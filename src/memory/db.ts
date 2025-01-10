import { createClient } from "@supabase/supabase-js";
import env from "../env";
import OpenAI from "openai";

// Create a single supabase client for interacting with your database
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

/**
 * @dev Saves a thought to the database
 * @param agent - The agent that made the thought
 * @param text - The text of the thought
 * @param toolCalls - The tool calls made by the agent
 * @param toolResults - The tool results returned by the agent
 */
export const saveThought = async ({
  agent,
  text,
  toolCalls,
  toolResults,
}: {
  agent: string;
  text: string;
  toolCalls: any;
  toolResults: any;
}) =>
  supabase.from("thoughts").insert({
    agent,
    text,
    tool_calls: toolCalls,
    tool_results: toolResults,
  });

/**
 * @dev Retrieves all thoughts from the database
 * @returns All thoughts
 */
export const retrieveThoughts = async () =>
  supabase
    .from("thoughts")
    .select("*")
    .order("created_at", { ascending: false });

/**
 * @dev Retrieves all thoughts from the database for a given agent
 * @param agent - The agent to retrieve thoughts for
 * @returns All thoughts for the given agent
 */
export const retrieveThoughtsByAgent = async (agent: string) =>
  supabase
    .from("thoughts")
    .select("*")
    .eq("agent", agent)
    .order("created_at", { ascending: false });

/**
 * @dev Retrieves all tasks from the database
 * @returns All tasks
 */
export const retrieveTasks = async () =>
  supabase.from("tasks").select("id").order("created_at", { ascending: false });

/**
 * @dev Stores a task in the database
 * @param task - The task to store
 * @param steps - The steps to store
 * @param fromToken - The token to store
 * @param toToken - The token to store
 * @param fromAmount - The amount to store
 * @param toAmount - The amount to store
 */
export const storeTask = async (
  task: string,
  steps: any,
  fromToken: any,
  toToken: any,
  fromAmount?: string,
  toAmount?: string
) =>
  supabase
    .from("tasks")
    .insert({
      task,
      steps,
      from_token: fromToken,
      to_token: toToken,
      from_amount: fromAmount,
      to_amount: toAmount,
    })
    .select("*")
    .limit(1);

/**
 * @dev Updates a task in the database
 * @param taskId - The id of the task to update
 * @param task - The task to update
 * @param steps - The steps to update
 * @param fromToken - The token to update
 * @param toToken - The token to update
 * @param fromAmount - The amount to update
 * @param toAmount - The amount to update
 * @returns The updated task
 */
export const updateTask = async (
  taskId: string,
  task: string,
  steps: any,
  fromToken: any,
  toToken: any,
  fromAmount?: string,
  toAmount?: string
) =>
  supabase
    .from("tasks")
    .update({
      task,
      steps,
      from_token: fromToken,
      to_token: toToken,
      from_amount: fromAmount,
      to_amount: toAmount,
    })
    .eq("id", taskId)
    .select("*")
    .limit(1);

/**
 * @dev Retrieves a task from the database by its id
 * @param taskId - The id of the task to retrieve
 * @returns The task
 */
export const retrieveTaskById = async (taskId: string) =>
  supabase.from("tasks").select("*").eq("id", taskId).limit(1);

/**
 * @dev Deletes a task from the database
 * @param taskId - The id of the task to delete
 */
export const deleteTask = async (taskId: string) =>
  supabase.from("tasks").delete().eq("id", taskId);

/**
 * @dev Stores a report in the database
 * @param report - The report to store
 */
export const storeReport = async (report: string) => {
  const openai = new OpenAI();
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: report.replaceAll("\n", " "),
  });

  const embedding = embeddingResponse.data[0].embedding;

  const { error } = await supabase
    .from("documents")
    .insert({ content: report, embedding });

  if (error) {
    console.error(`[storeReport] error: ${JSON.stringify(error)}`);
  }
};

/**
 * @dev Retrieves past reports from the database
 * @param question - The question to retrieve past reports for
 * @returns Past reports
 */
export const retrievePastReports = async (question: string) => {
  const openai = new OpenAI();
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: question.replaceAll("\n", " "),
  });

  const questionEmbedding = embeddingResponse.data[0].embedding;

  const { data: documents } = await supabase.rpc("match_documents", {
    query_embedding: questionEmbedding,
    match_threshold: 0.78,
    match_count: 10,
  });

  return documents;
};
