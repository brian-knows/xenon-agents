import { generateText } from "ai";
import type { EventBus } from "../../comms";
import {
  getTaskManagerFinalReportSystemPrompt,
  getTaskManagerSystemPrompt,
} from "../../system-prompts";
import { Agent } from "../agent";
import { openai } from "@ai-sdk/openai";
import { getTaskManagerToolkit } from "./toolkit";
import { saveThought, storeReport } from "../../memory";
import env from "../../env";

/**
 * @dev The task manager agent is responsible for generating tasks to be executed.
 */
export class TaskManagerAgent extends Agent {
  /**
   * @param name - The name of the agent
   * @param eventBus - The event bus to emit events to other agents
   */
  constructor(name: string, eventBus: EventBus) {
    super(name, eventBus);
  }

  /**
   * @param event - The event to handle
   * @param data - The data to handle
   */
  async handleEvent(event: string, data: any): Promise<void> {
    console.log(`[${this.name}] received data from [${event.split("-")[0]}].`);
    switch (event) {
      case `observer-${this.name}`:
        return this.handleObserverReport(data);
      case `executor-${this.name}`:
        return this.handleExecutorResult(data);
    }
  }

  /**
   * @dev Handles the observer report
   * @param data - The data to handle
   */
  private async handleObserverReport(data: {
    report: string;
    noFurtherActions?: boolean;
    waitTime?: number;
  }): Promise<void> {
    data.report &&
      console.log(
        `[${this.name}] received a report from the observer agent:\n\n${data.report}.`
      );

    const toolkit = getTaskManagerToolkit();

    if (data.noFurtherActions && data.waitTime) {
      console.log(
        `[${this.name}] no further actions needed. waiting for ${
          data.waitTime / 1000
        } seconds.`
      );
      // sleep for the waitTime
      await new Promise((resolve) => setTimeout(resolve, data.waitTime));

      // ask the observer agent for a new report
      this.eventBus.emit(`${this.name}-observer`, undefined);

      return;
    }

    const { toolCalls } = await generateText({
      model: openai(env.MODEL_NAME, { structuredOutputs: true }),
      system: getTaskManagerSystemPrompt(),
      prompt: `Given the report that follows, decide to generate one or more tasks to be executed.
      
      Observer agent report:
      ${data.report}
      
      Decide whether you want to use the sendMessageToObserver or sendMessageToExecutor tool. You must use one of them.`,
      tools: toolkit,
      maxSteps: 10,
      onStepFinish: this.onStepFinish,
    });

    const tool = toolCalls[0];

    if (!tool || tool.toolName !== "sendMessageToExecutor") {
      this.eventBus.emit(`${this.name}-observer`, {
        result: tool ? tool.args.message : "Generate a new report.",
        report: data.report,
      });
    } else if (tool.toolName === "sendMessageToExecutor") {
      this.eventBus.emit(`${this.name}-executor`, {
        result: tool.args.message,
        report: data.report,
      });
    }
  }

  async handleExecutorResult(data: {
    result: string;
    report: string;
  }): Promise<void> {
    console.log(
      `[${this.name}] received result from the executor agent:\n\n${data.result}.`
    );

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      system: getTaskManagerFinalReportSystemPrompt(),
      prompt: `Given the following report and result, generate a report to be sent to the observer agent about the execution of the tasks.
      
      Observer agent report:
      ${data.report}
      
      Executor agent result:
      ${data.result}`,
      maxSteps: 10,
      onStepFinish: this.onStepFinish,
    });

    await storeReport(response.text);

    this.eventBus.emit(`${this.name}-observer`, {
      result: response.text,
      report: data.report,
    });
  }

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    console.log(
      `[task-manager] step finished. tools called: ${
        toolCalls.length > 0
          ? toolCalls.map((tool: any) => tool.toolName).join(", ")
          : "none"
      }`
    );
    if (text) {
      await saveThought({
        agent: "task-manager",
        text,
        toolCalls,
        toolResults,
      });
    }
  }
}
