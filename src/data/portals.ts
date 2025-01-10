import type { Hex } from "viem";
import env from "../env";

/**
 * @dev Gets the balances of an account
 * @param owner - The owner of the account
 * @returns The balances of the account
 */
export const getAccountBalances = async (owner: Hex) => {
  const url = `https://api.portals.fi/v2/account?owner=${owner}&networks=${env.CHAIN_NAME}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.PORTALS_API_KEY}`,
    },
  });

  return response.json();
};

/**
 * @dev Gets the market data
 * @returns The market data
 */
/**
 * @dev Gets the market data for both USDC and EURC
 * @returns The market data for both tokens
 */
export const getMarketData = async (
  minApy: number = 3,
  maxApy: number = 60
) => {
  const fetchTokenData = async (search: string, minLiquidity: number) => {
    const url = `https://api.portals.fi/v2/tokens?networks=${env.CHAIN_NAME}&minLiquidity=${minLiquidity}&minApy=${minApy}&maxApy=${maxApy}&search=${search}`;
    console.log("======== fetchTokenData =========");
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.PORTALS_API_KEY}`,
      },
    });
    return response.json();
  };

  const [usdcData, eurcData] = await Promise.all([
    fetchTokenData("usdc", 10000000),
    fetchTokenData("eurc", 2000000),
  ]);

  return {
    usdc: usdcData,
    eurc: eurcData,
  };
};

/**
 * @dev Gets the market data for multiple protocol/token combinations
 * @param queries - Array of {protocol, token} pairs to check
 * @param minLiquidity - Minimum liquidity threshold
 * @param minApy - Minimum APY threshold
 * @param maxApy - Maximum APY threshold
 * @returns The market data for the specified positions
 */
export const getPositionData = async (
  queries: Array<{ protocol: string; token: string }>,
  minLiquidity: number = 10000000,
  minApy: number = 3,
  maxApy: number = 60
) => {
  const results = await Promise.all(
    queries.map(async ({ protocol, token }) => {
      const url = `https://api.portals.fi/v2/tokens?networks=${env.CHAIN_NAME}&platforms=${protocol}&minLiquidity=${minLiquidity}&minApy=${minApy}&maxApy=${maxApy}&search=${token}`;
      console.log("======== fetchPositionData =========");
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.PORTALS_API_KEY}`,
        },
      });
      const data = await response.json();
      return {
        protocol,
        token,
        data,
      };
    })
  );
  return results;
};
