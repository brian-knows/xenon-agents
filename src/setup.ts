import { env } from "bun";
import { privateKeyToAccount } from "viem/accounts";
import { registerAgents } from "./agents";
import { EventBus } from "./comms";

const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

// initialize the event bus
const eventBus = new EventBus();

// register the agents
const { executorAgent, observerAgent, taskManagerAgent } = registerAgents(
  eventBus,
  account
);

export { eventBus, executorAgent, observerAgent, taskManagerAgent, account };
