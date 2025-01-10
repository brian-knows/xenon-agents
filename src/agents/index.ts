import type { Account } from "viem";
import { EventBus } from "../comms";
import { ExecutorAgent } from "./executor";
import { ObserverAgent } from "./observer";
import { TaskManagerAgent } from "./task-manager";
import figlet from "figlet";

/**
 * Registers the agents and returns them
 * @returns The registered agents
 */
export const registerAgents = (eventBus: EventBus, account: Account) => {
  console.log(figlet.textSync("XENON"));
  console.log("======== Registering agents =========");
  // initialize the agents
  console.log(`[registerAgents] initializing executor agent...`);
  const executorAgent = new ExecutorAgent("executor", eventBus, account);
  console.log(`[registerAgents] executor agent initialized.`);
  console.log(`[registerAgents] initializing observer agent...`);
  const observerAgent = new ObserverAgent("observer", eventBus);
  console.log(`[registerAgents] observer agent initialized.`);
  console.log(`[registerAgents] initializing task manager agent...`);
  const taskManagerAgent = new TaskManagerAgent("task-manager", eventBus);
  console.log(`[registerAgents] task manager agent initialized.`);

  // register messages from the observer to the task manager
  console.log(
    `[registerAgents] registering messages from the observer to the task manager...`
  );
  eventBus.register(`${observerAgent.name}-${taskManagerAgent.name}`, (data) =>
    taskManagerAgent.handleEvent(
      `${observerAgent.name}-${taskManagerAgent.name}`,
      data
    )
  );
  console.log(
    `[registerAgents] messages from the observer to the task manager registered.`
  );

  // register messages from the task manager to the executor
  console.log(
    `[registerAgents] registering messages from the task manager to the executor...`
  );
  eventBus.register(`${taskManagerAgent.name}-${executorAgent.name}`, (data) =>
    executorAgent.handleEvent(
      `${taskManagerAgent.name}-${executorAgent.name}`,
      data
    )
  );
  console.log(
    `[registerAgents] messages from the task manager to the executor registered.`
  );

  // register messages from the executor to the task manager
  console.log(
    `[registerAgents] registering messages from the executor to the task manager...`
  );
  eventBus.register(`${executorAgent.name}-${taskManagerAgent.name}`, (data) =>
    taskManagerAgent.handleEvent(
      `${executorAgent.name}-${taskManagerAgent.name}`,
      data
    )
  );
  console.log(
    `[registerAgents] messages from the executor to the task manager registered.`
  );

  // register messages from the task manager to the observer
  console.log(
    `[registerAgents] registering messages from the task manager to the observer...`
  );
  eventBus.register(`${taskManagerAgent.name}-${observerAgent.name}`, (data) =>
    observerAgent.handleEvent(
      `${taskManagerAgent.name}-${observerAgent.name}`,
      data
    )
  );
  console.log(
    `[registerAgents] messages from the task manager to the observer registered.`
  );

  console.log(`[registerAgents] all agents registered.`);

  return {
    executorAgent,
    observerAgent,
    taskManagerAgent,
  };
};
