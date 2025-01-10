# 🤖 Xenon Agents

![Xenon Logo](./assets/cover.png)

A multi-agent DeFi system that autonomously monitors market conditions and wallet status and executes transactions to optimize returns.

This system can be forked and updated with different instructions for the agents.

## ⚠️ Attention

**Autonomous agents** must be - by definition - autonomous. Inside this code there's no human-in-the-loop, no transaction approval nor confirmation. It works on mainnets and will execute real transactions with funds being moved from its wallet.

Make sure that you understand how it works, why it works in this way and you are ready to take any of the risks that this entails.

Please refer to the [Disclaimer](#disclaimer) section for more information on your responsibilities when running this code.

## 📚 Overview

This system consists of three main AI agents working together:

1. **Observer Agent**: Monitors market conditions, wallet status, and protocol states to generate market intelligence reports;
2. **Task Manager Agent**: Analyzes observer reports and determines optimal trading actions;
3. **Executor Agent**: Safely executes the approved trading tasks.

### 🔎 Observer Agent

The goal of the **Observer Agent** is to generate reports about the current state of the market, the status of the wallet and the past operations. This report will be sent to the **Task Manager Agent** that will either approve it and generate tasks or reject it and ask for a new report.

#### Observer Agent Behavior

The Observer Agent behaves following the system prompt defined in `src/system-prompts/observer-system-prompt.ts`.

```typescript
import type { Hex } from "viem";

export const getObserverSystemPrompt = (address: Hex) =>
  [
    "You're an expert web3 agent that generates investment opportunities proposals about Circle's stablecoins, USDC and EURc.",
    "Your goal is to generate a report about the various data that you ingest.",
    "This report will be used by the task manager agent to generate one or more tasks.",
    "The tasks will be then executed by the executor agent.",
    "You, the observer agent, are the one that will generate the report. The task manager agent will then use this report to generate tasks. The executor agent will then execute the tasks. You 3 together form the Portfolio Manager Agent (PMA)",
    "The PMA ultimate goal is to invest stablecoins, USDC and EURc, in the most stable and profitable protocols.",
    "Your report should be concise and to the point.",
    `The address of your wallet across multiple chains is ${address}.`,
    "You should ALWAYS take into account the current status of your wallet in terms of the various tokens you hold and how much they're worth.",
    "You should ALWAYS take into account the current market data, opportunities and conditions.",
    "You should ALWAYS take into account the current state of the protocols that you're monitoring or where you have a position.",
    "You should NEVER make a trade that would put your wallet at risk of being hacked or drained.",
    "You should ALWAYS take into account that you always need to have some ETH in your wallet to be able to pay for gas fees. If you don't have enough ETH, you should propose a task to the task manager agent to buy ETH. Mantain always a minimum of 0.002 ETH in your wallet.",
    "You MUST take into account not only the APY of the protocol when you opened a position, but also the current APY of that position.",
    "Do not round up the amount of tokens you need to sell. For example, if you need to sell 153.137 tokens, do not round up to 153.14.",
    "In case you identify a strategy that needs a given amount of a token, propose a strategy to get to that amount from your current wallet status.",
    "When proposing such strategy, you need to specify or hint the amount of tokens that we need to sell to reach that amount.",
    "Do not suggest the amount in dollars to sell, but rather the amount in tokens using the price of the token.",
  ].join("\n");
```

It's a pretty complex prompt, but let's see why it is structured this way and why some of the instructions that are there are actually mandatory and important:
- The goal of the agent is clear and concise;
- We specify to it what is the ultimate goal of the report itself, and that another entity (the "Task Manager") will be using it to generate tasks;
- We provide the address of the wallet to the agent so that it cannot hallucinate with wrong addresses (it may happen that if it's not aware, it could provide wrong information);
- We specify that it **always** needs to take into account the current status of the wallet in terms of tokens it holds and their value;
- We specify that it **always** needs to take into account the current market data, opportunities and conditions;
- We specify that it **always** needs to take into account the current state of the protocols that it's monitoring or where it has a position;
- We specify that it **never** needs to make a trade that would put its wallet at risk of being hacked or drained;
- We specify that it **always** needs to take into account that it always needs to have some ETH in its wallet to be able to pay for gas fees. If it doesn't have enough ETH, it should propose a task to the task manager agent to buy ETH. Mantain always a minimum of 0.002 ETH in its wallet;
- We specify that it **must** take into account not only the APY of the protocol when it opened a position, but also the current APY of that position;
- We specify that it **must not** round up the amount of tokens it needs to sell. This is useful for the task generation;
- We specify that it **must** take into account the exchange rate between USDC and EURc when swapping USDC for EURc or EURc for USDC or changing positions between USDC and EURc and vice versa;
- We specify that it **must** take into account the date when it opened a position to calculate if the trade is profitable;
- We specify that it **must** not suggest the amount in dollars to sell, but rather the amount in tokens using the price of the token.

All these points have been tested to be working well and do not produce any hallucinations. 

### 📝 Task Manager Agent

The goal of the **Task Manager Agent** is to analyze the report generated by the **Observer Agent** and generate tasks based on the report. It can also reject the report and ask for a new one.

At the end of the whole flow it will generate a final report that will be used to store the results of the executed tasks.

#### Task Manager Agent - Main Behavior

The Task Manager Agent behaves following the system prompt defined in `src/system-prompts/task-manager-system-prompt.ts`.

```typescript
export const getTaskManagerSystemPrompt = () =>
  [
    "You're an expert manager that generates tasks based on the report provided by the observer agent.",
    "Your goal is to decide whether to create one or more tasks based on the report provided by the observer agent.",
    "The observer agent will generate a report that will be used, by you, the task manager agent, to generate tasks. The executor agent will then execute the tasks. You 3 together form the Portfolio Manager Agent (PMA)",
    "The PMA ultimate goal is to invest in Circle's stablecoins, USDC and EURc, in the most stable and profitable protocols. You need to make sure that the tasks you propose are in line with this goal.",
    "If you decide to create a task, that should take the form a request that will be sent to the executor agent.",
    "Do not create tasks that are not in the form of 'Swap X token for Y token' or 'Deposit X token on Y' or 'Withdraw X token from Y'.",
    "Reason step by step your decisions and the tasks you create.",
    "You don't have to always propose a task, only when it's necessary. Holding positions is a valuable strategy.",
    "If you have a position in USDC or EURc and you want to close or reduce it, you need to withdraw the position from the protocol first. For example, if you have a position of100 USDC in AAVE on Base, and you have aBasUSDC in your wallet and you want to close it, you need to withdraw the 100 USDC from AAVE first. You can do it by sending a task to the executor agent such as 'Withdraw x aBasUSDC from AAVE on Base' or 'Withdraw x USDC from AAVE on Base', both will withdraw the USDC from AAVE on Base.",
    "You're not a high frequency trader, you're an expert on investing in stablecoins.",
    "You must consider the exchange rate between USDC and EURc when swapping USDC for EURc or EURc for USDC or changing positions between USDC and EURc and vice versa.",
    "Remember that every trade has a cost, so high frequency trading is not suggested if it's not profitable. Take into account the date when you opened the position to calculate if the trade is profitable.",
    "In case you don't have any tasks to execute, generate a text that explains why so that the observer agent can regenerate the report accordingly.",
    "In case there are tasks to be executed, generate a list of tasks that need to be executed.",
    "These tasks MUST be in a JSON format and can only include swaps and deposits.",
    "An example of a task is:",
    '{ "task": "Swap 100 USDC for EURc" }',
    "An example of list of tasks is:",
    '[ { "task": "Swap 100 USDC for EURc" }, { "task": "Deposit 100 USDC to AAVE v3" } ]',
    "The swaps and deposits MUST always include the amount to swap/deposit and the token to swap to.",
  ].join("\n");
```

The main thing to take into account here is that the tasks MUST be in a JSON format, and we try to enforce a particular format so that the executor agent can understand them and feed them to the Brian APIs.

#### Task Manager Agent - Final Report Behavior

For generating the final report, the Task Manager Agent uses the `getTaskManagerFinalReportSystemPrompt` function.

```typescript
export const getTaskManagerFinalReportSystemPrompt = () =>
  [
    "You're an expert manager that is capable of generating extensive reports based on what the observer has provided and what the executor has executed.",
    "The report you're going to create is going to be stored for later retrieval, so it needs to be comprehensive and detailed.",
    "It needs to include the following information:",
    "- What tasks were executed and when (add the date for each task)",
    "- What and how many tokens were swapped, if any, at what price and for which tokens",
    "- What and how many tokens were deposited, if any, on which protocol, for which amount and at what APY",
    "- What and how many tokens were withdrawn, if any, from which protocol and for which amount",
    "All this information is crucial and must not be omitted if it's available in both the observer and executor reports.",
    "If there's no information available, just say so. Add today's date to the report.",
  ].join("\n");
```

### 🔑 Executor Agent

The goal of the **Executor Agent** is to execute the tasks generated by the **Task Manager Agent**. It will generate the transactions by passing the tasks to the Brian APIs and then execute them.

#### Executor Agent Behavior

The Executor Agent behaves following the system prompt defined in `src/system-prompts/executor-system-prompt.ts`.

```typescript
export const getExecutorSystemPrompt = (address: Hex) =>
  [
    "You are an expert in executing transactions on the blockchain.",
    "You are given a list of tasks and you need to transform them into transactions.",
    "After you have transformed the tasks into transactions, you need to execute them.",
    "When you have finished executing the transactions, generate a report feedback about the results.",
    "The report feedback that you generate must include for each token its price and the amount received in dollars.",
  ].join("\n");
```

This agent is pretty simple, it just needs to execute the tasks and generate a report about the results.

## 🛠️ Agent Tools

Each agent has its own tools, defined in their own `toolkit.ts` file.

### Observer Agent Tools

The current available tools for the observer agent are:
- `getPastReports`: This tool is used to retrieve the past reports that contain information about previously executed actions. Refer to the [Memory](#-memory) section to know how the previously reports are stored and retrieved;
- `getWalletBalances`: This tool is used to retrieve the current balances of the wallet;
- `getMarketData`: This tool is used to retrieve market opportunities for USDC and EURC;
- `getCurrentEurUsdRate`: This tool is used to retrieve the current EUR/USD exchange rate;
- `noFurtherActions`: This tool is used to indicate that no further actions are needed.

The `noFurtherActions` tool is used to indicate that no further actions are needed. The agent will generate a `waitTime` number and the system will sleep for that given amount of time before starting again on their own.

This is useful when the observer agent has already generated a report that contains all the information needed and no further actions are needed, so that we prevent spamming of API calls and we don't waste resources.

### Task Manager Agent Tools

The current available tools for the task manager agent are:
- `sendMessageToObserver`: This tool is used to send a message to the observer agent;
- `sendMessageToExecutor`: This tool is used to send a message to the executor agent.

Pretty simple tools, just used to send messages to the other agents: the first one is used when to respond to the observer agent in case the report is not good enough; the second one is used when to send the tasks to the executor agent.

### Executor Agent Tools

The current available tools for the executor agent are:
- `getTransactionData`: This tool is used to retrieve the transaction data for the given task, calling the Brian APIs for getting the transaction data;
- `simulateTasks`: This tool is used to simulate the output of all the tasks. It is useful to to check the outputs and to fix the inputs of other tasks. This is expecially useful if the system wants to, for example, withdraw a position from a protocol and then deposit it on another protocol: the output of the withdraw will be used as the input of the deposit, but some fees are for sure taken, so we need to fix the input of the deposit to take into account the fees;
- `executeTransaction`: This tool is used to execute the transaction for the given task.

## 💬 Communication between agents

The communication between agents is done through a simple NodeJS `EventEmitter` that is used to send messages between the agents.

The agents then react to these messages and act accordingly.

The `EventBus` class is defined in `src/comms/event-bus.ts`. Each agent has its own `handleEvent` method that is used to react to the messages.

The communication in this particular use case happens in this way:
- The observer agent generates a report and sends it to the task manager agent;
- The task manager agent analyzes the report and generates tasks;
- The task manager agent sends the tasks to the executor agent;
- The executor agent executes the tasks and generates a report feedback;
- The executor agent sends the report feedback to the task manager agent;
- The task manager agent generates a final report with both the observer and executor reports and stores it for later retrieval.

We would like to explore more complex communication patterns in the future, such as using [XMTP](https://xmtp.com/).

## 📥 Memory

The memory is stored in a **Supabase** database and is used to store the past reports and retrieve them when needed.

The memory is stored in the `documents` table of the `xenon-agents` database.

The `documents` table has two columns:
- `content`: the content of the document, which is the report;
- `embedding`: the embedding of the document, which is used for semantic search.

The `documents` table has a `match_documents` function that is used to retrieve the past reports from the database. Follow [this guide](https://supabase.com/docs/guides/ai/vector-columns) to know more about how to create and use the `match_documents` function.

Please make sure to set the `query_embedding` column vector size to **1536** for OpenAI embeddings' size.

## ⚙️ HTTP APIs

Xenon exposes **by default** some APIs that can be used to build your own UI on top of it. 

> Please note that Xenon default UI is **coming soon**.

These are the routes exposed by the system:
- `/thoughts`: this route is used to retrieve the thoughts of the agents;
- `/thoughts/:agent`: this route is used to retrieve the thoughts of a specific agent (eg. `/thoughts/observer`);
- `/wallet`: this route is used to retrieve the wallet information. It returns the wallet balances, the wallet portfolio, the wallet transactions, the wallet positions and the wallet chart via Zerion.

## 🧑🏻‍💻 Development Guide

**Xenon** is a complex system, and requires a little bit of setup to be able to run it. Let's see all the different steps.

### 1. Setup the database

You need to create an account on [Supabase](https://supabase.com/) and create a new project. Inside the project you need to create the documents table (see [Memory](#-memory) section for more information) and the following tables:
- `tasks`: this table is used to store the tasks that need to be executed;
```SQL
create table
  public.tasks (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    task text not null,
    steps json not null,
    from_token jsonb null,
    to_token jsonb null,
    from_amount text null,
    to_amount text null,
    constraint tasks_pkey primary key (id)
  ) tablespace pg_default;
```
- `thoughts`: this table is used to store all the different agents' thoughts and messages.
```SQL
create table
  public.thoughts (
    id bigint generated by default as identity not null,
    created_at timestamp with time zone not null default now(),
    agent text null,
    text text null,
    tool_calls json null,
    tool_results json null,
    constraint thoughts_pkey primary key (id)
  ) tablespace pg_default;
```

### 2. Setup the environment variables

You need to create a `.env` file in the root of the project with the following variables:

```
OPENAI_API_KEY=""
PORTALS_API_KEY=""
BRIAN_API_URL="https://api.brianknows.org"
BRIAN_API_KEY="brian_app_rfNZfRT3nUyQdcpyz"
SUPABASE_URL=""
SUPABASE_KEY=""
PRIVATE_KEY=""
PORT="8000"
ZERION_API_KEY=""
```

- The `PORTALS_API_KEY` is the API key for the Portals API. You can get it from [Portals](https://portals.fi/) and it's used to retrieve wallet balances and protocols information;
- The `ZERION_API_KEY` is the API key for the Zerion API. You can get it from [Zerion](https://app.zerion.io/);
- The `BRIAN_API_KEY` is the URL for the Brian API. You can get it from [Brian App](https://brianknows.org/app).

You can change the chain by adding a `CHAIN_NAME` and `CHAIN_ID` environment variables. The `CHAIN_NAME` is used by Portals and Zerion, so if you change it make sure that it's supported by both.

### 3. Running the system

Run the system using `bun`:
```bash
bun src/index.ts
```

You will see the logs of the system in the console.

## 🤝🏻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. We're looking for a lot of improvements, optimizations, new features and new use cases. Feel also free to fork this project and create your own version of it.

### 💡 Ideas

If you feel like contributing to the project, here are some ideas that we would like to explore:

- [ ] Using TEE for private key management (eg. using [Lit Protocol](https://litprotocol.com/)) and transactions signing;
- [ ] Using TEE for running the system in a secure and private way (eg. using [Phala Network](https://phala.network/));
- [ ] Using [XMTP](https://xmtp.org) for the communication between agents;
- [ ] Adding [Twitter](https://x.com) integration for the observer agent for posting a smaller version of the report to Twitter;
- [ ] Adding [Telegram](https://telegram.org) integration for the observer agent for posting a smaller version of the report as a Telegram message;
- [ ] Adding [Farcaster](https://farcaster.xyz) integration for the observer agent for posting a smaller version of the report as a Farcaster cast.

## 🛡️ License

This project is licensed under the terms of the MIT license. See LICENSE for more details.

## ‼️ Disclaimer

*This code is being provided as is. No guarantee, representation or warranty is being made, express or implied, as to the safety or correctness of the code. It has not been audited and as such there can be no assurance it will work as intended, and users may experience delays, failures, errors, omissions or loss of transmitted information. Nothing in this repo should be construed as investment advice or legal advice for any particular facts or circumstances and is not meant to replace competent counsel. It is strongly advised for you to contact a reputable attorney in your jurisdiction for any questions or concerns with respect thereto. Santo Labs GmbH is not liable for any use of the foregoing, and users should proceed with caution and use at their own risk.*