import { tool } from "ai";
import { z } from "zod";

export const getTaskManagerToolkit = () => {
  return {
    sendMessageToObserver: tool({
      description:
        "use this tool when you want to send a message to the observer.",
      parameters: z.object({
        message: z.string(),
      }),
    }),
    sendMessageToExecutor: tool({
      description:
        "use this tool when you want to send a message to the executor.",
      parameters: z.object({
        message: z.string(),
      }),
    }),
  };
};
