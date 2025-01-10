import { generateText } from "ai";
import type { EventBus } from "../../comms";
import { Agent } from "../agent";
import { getExecutorToolkit } from "./toolkit";
import { openai } from "@ai-sdk/openai";
import { getExecutorSystemPrompt } from "../../system-prompts";
import { saveThought } from "../../memory";
import type { Account } from "viem";

export class ExecutorAgent extends Agent {
  private account: Account;

  constructor(name: string, eventBus: EventBus, account: Account) {
    super(name, eventBus);
    this.account = account;
  }

  async handleEvent(event: string, data: any): Promise<void> {
    switch (event) {
      case `task-manager-${this.name}`:
        return this.handleTaskManagerEvent(data);
    }
  }

  private async handleTaskManagerEvent(data: any): Promise<void> {
    console.log(
      `[${this.name}] received data from task-manager: ${data.result}.`
    );

    const executorTools = getExecutorToolkit(this.account);

    const response = await generateText({
      model: openai("gpt-4o-mini", { parallelToolCalls: false }),
      tools: executorTools,
      system: getExecutorSystemPrompt(this.account.address),
      prompt: `Generate the transactions and then execute the following tasks: ${data.result}`,
      maxSteps: 100,
      maxRetries: 10,
      experimental_continueSteps: true,
      onStepFinish: this.onStepFinish,
    });

    this.eventBus.emit(`${this.name}-task-manager`, {
      result: response.text,
      report: data.report,
    });
  }

  async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    console.log(
      `[executor] step finished. tools called: ${
        toolCalls.length > 0
          ? toolCalls.map((tool: any) => tool.toolName).join(", ")
          : "none"
      }`
    );
    if (text) {
      await saveThought({
        agent: "executor",
        text,
        toolCalls,
        toolResults,
      });
    }
  }
}
