import { tool } from "ai";
import type { Hex } from "viem";
import { getAccountBalances, getMarketData } from "../../data";
import { z } from "zod";
import { retrievePastReports } from "../../memory";

export const getObserverToolkit = (address: Hex) => {
  return {
    getPastReports: tool({
      description:
        "A tool that returns the past reports that contain information about previously executed actions.",
      parameters: z.object({
        question: z
          .string()
          .describe(
            "The question to retrieve past reports for. If you are thinking about performing operations with USDC for example, you could generate a question to ask to your memory."
          ),
      }),
      execute: async ({ question }) => {
        console.log("======== getPastReports Tool =========");
        console.log(
          `[getPastReports] retrieving past reports with question: ${question}`
        );
        const reports = await retrievePastReports(question);

        if (!reports || reports.length === 0) {
          return "No past reports found. This is ok, it means that you're thinking about a new operation.";
        }

        console.log(`[getPastReports] reports retrieved: ${reports.length}`);

        return reports
          .map(
            (report: any) =>
              `Report containing the operations done the ${report.created_at}:\n${report.content}\n`
          )
          .join("\n");
      },
    }),
    getWalletBalances: tool({
      description: "A tool that returns the current balances of your wallet.",
      parameters: z.object({}),
      execute: async () => {
        console.log("======== getWalletBalances Tool =========");
        console.log(
          `[getWalletBalances] fetching token balances for ${address}...`
        );
        const { balances } = await getAccountBalances(address);

        const tokenBalances = balances
          .filter(
            (balance: any) =>
              balance.platform === "native" || balance.platform === "basic"
          )
          .map(
            (balance: any) =>
              `[${balance.symbol}] balance: ${balance.balance} $${balance.balanceUSD}) - price: $${balance.price}`
          )
          .join("\n");

        const formattedBalances = balances
          .filter(
            (balance: any) =>
              balance.platform !== "native" && balance.platform !== "basic"
          )
          .map(
            (balance: any) =>
              `[${balance.symbol}] balance: ${balance.balance} $${
                balance.balanceUSD
              }) on protocol ${balance.platform.replace("-", " ")} with APY ${
                balance.metrics.apy
              }%`
          )
          .join("\n");

        console.log(`[getWalletBalances] balances fetched correctly.`);
        return `This is the current status of the wallet with address ${address}:\nTokens:\n${tokenBalances}\nOpen positions:\n${formattedBalances}`;
      },
    }),
    getMarketData: tool({
      description:
        "A tool that returns the current market data for USDC and EURC.",
      parameters: z.object({}),
      execute: async () => {
        console.log("======== getMarketData Tool =========");
        console.log(`[getMarketData] fetching market data...`);
        const marketData = await getMarketData();

        const formatTokens = (data: any) => {
          if (!data?.tokens || data.tokens.length === 0) {
            return "No opportunities found";
          }

          return data.tokens
            .map(
              (token: any) =>
                `[${token.name}] APY: ${token.metrics.apy}% - volume 1d: $${token.metrics.volumeUsd1d} - volume 7d: $${token.metrics.volumeUsd7d}`
            )
            .join("\n");
        };

        const usdcFormatted = formatTokens(marketData.usdc);
        const eurcFormatted = formatTokens(marketData.eurc);

        console.log(`[getMarketData] market data fetched correctly.`);
        return `These are the current market opportunities:\n\nUSDC Opportunities:\n${usdcFormatted}\n\nEURC Opportunities:\n${eurcFormatted}`;
      },
    }),
    getCurrentEurUsdRate: tool({
      description: "A tool that returns the current EUR/USD exchange rate.",
      parameters: z.object({}),
      execute: async () => {
        console.log("======== getCurrentEurUsdRate Tool =========");
        console.log(`[getCurrentEurUsdRate] fetching EUR/USD rate...`);

        try {
          const response = await fetch(
            "https://api.frankfurter.dev/v1/latest?symbols=USD"
          );
          const data = await response.json();
          const rate = data.rates.USD;

          console.log(
            `[getCurrentEurUsdRate] rate fetched successfully: ${rate}`
          );
          return `Current EUR/USD exchange rate: 1 EUR = ${rate} USD (as of ${data.date})`;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return `Error fetching EUR/USD rate: ${errorMessage}`;
        }
      },
    }),
    noFurtherActionsTool: tool({
      description:
        "A tool that you decide to use when no further actions are needed.",
      parameters: z.object({
        reason: z
          .string()
          .describe("The reason why no further actions are needed."),
        waitTime: z
          .number()
          .describe(
            "The time to wait before executing the next action. This number must be logical to the operations you've done."
          ),
      }),
    }),
  };
};
