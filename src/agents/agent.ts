import type { EventBus } from "../comms";

export abstract class Agent {
  name: string;
  protected eventBus: EventBus;

  constructor(name: string, eventBus: EventBus) {
    this.name = name;
    this.eventBus = eventBus;
  }

  abstract handleEvent(event: string, data: any): void;

  abstract onStepFinish({ text, toolCalls, toolResults }: any): Promise<void>;
}
