import { generateText } from "ai";
import type { EventBus } from "../../comms";
import { Agent } from "../agent";
import { openai } from "@ai-sdk/openai";
import { getObserverSystemPrompt } from "../../system-prompts";
import type { Hex } from "viem";
import { getObserverToolkit } from "./toolkit";
import { saveThought } from "../../memory";
import env from "../../env";

const OBSERVER_STARTING_PROMPT =
  "Based on the current market data and the tokens that you hold, generate a report explaining what steps could be taken.";

/**
 * @dev The observer agent is responsible for generating a report about the best opportunities to make money.
 */
export class ObserverAgent extends Agent {
  address?: Hex;

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
    switch (event) {
      case `task-manager-${this.name}`:
        return this.handleTaskManagerEvent(data);
    }
  }

  /**
   * @param data - The data to handle
   */
  private async handleTaskManagerEvent(data: any): Promise<void> {
    if (data) {
      console.log(
        `[${this.name}] received message from task-manager: ${data.result}`
      );
    }

    await this.start(this.address!, data);
  }

  /**
   * @dev Starts the observer agent
   * @param address - The address of the account to observe
   * @param taskManagerData - The data from the task manager agent
   */
  async start(address: Hex, taskManagerData?: any): Promise<any> {
    this.address = address;

    const toolkit = getObserverToolkit(address);

    if (!taskManagerData) {
      const response = await generateText({
        model: openai(env.MODEL_NAME),
        system: getObserverSystemPrompt(address),
        prompt: OBSERVER_STARTING_PROMPT,
        tools: toolkit,
        maxSteps: 100,
        onStepFinish: this.onStepFinish,
      });

      this.eventBus.emit(`${this.name}-task-manager`, {
        report: response.text,
      });
    } else {
      const response = await generateText({
        model: openai(env.MODEL_NAME),
        system: getObserverSystemPrompt(address),
        messages: [
          {
            role: "assistant",
            content: taskManagerData.report,
          },
          {
            role: "user",
            content: `This is the feedback from the task executor agent:
            ${taskManagerData.result}`,
          },
        ],
        tools: toolkit,
        maxSteps: 100,
        onStepFinish: this.onStepFinish,
      });

      if (response.toolCalls.length > 0) {
        const noFurtherActionsTool = response.toolCalls.find(
          (tool: any) => tool.toolName === "noFurtherActionsTool"
        );
        if (noFurtherActionsTool) {
          this.eventBus.emit(`${this.name}-task-manager`, {
            noFurtherActions: true,
            // @ts-ignore
            waitTime: noFurtherActionsTool.args.waitTime * 1000,
          });
        }
      } else {
        this.eventBus.emit(`${this.name}-task-manager`, {
          report: response.text,
        });
      }
    }
  }

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    console.log(
      `[observer] step finished. tools called: ${
        toolCalls.length > 0
          ? toolCalls.map((tool: any) => tool.toolName).join(", ")
          : "none"
      }`
    );
    if (text) {
      await saveThought({
        agent: "observer",
        text,
        toolCalls,
        toolResults,
      });
    }
  }
}
