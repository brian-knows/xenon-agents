import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  PRIVATE_KEY: z.string(),
  ZERION_API_KEY: z.string(),
  BRIAN_API_KEY: z.string(),
  PORTALS_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  BRIAN_API_URL: z.string().default("https://staging-api.brianknows.org"),
  CHAIN_ID: z.string().default("8453"),
  CHAIN_NAME: z.string().default("base"),
  MODEL_NAME: z.string().default("gpt-4o-2024-08-06"),
});

export const env = envSchema.parse(process.env);

export type Environment = {
  Bindings: z.infer<typeof envSchema>;
};

export default env;
