import { Hono, type Context } from "hono";
import { retrieveThoughts, retrieveThoughtsByAgent } from "../../memory";

const thoughtsRouter = new Hono();

const getThoughtsHandler = async (c: Context) => {
  const thoughts = await retrieveThoughts();

  return c.json(thoughts);
};

const getThoughtsByAgentHandler = async (c: Context) => {
  const thoughts = await retrieveThoughtsByAgent(c.req.param("agent"));

  return c.json(thoughts);
};

thoughtsRouter.get("/", getThoughtsHandler);
thoughtsRouter.get("/:agent", getThoughtsByAgentHandler);

export { thoughtsRouter };
