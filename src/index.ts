import { app } from "./app";
import env from "./env";
import { observerAgent, account } from "./setup";

console.log(`[🚀] starting observer agent loop.`);
observerAgent.start(account.address as `0x${string}`);

export default {
  port: env.PORT || 3000,
  fetch: app.fetch,
};
