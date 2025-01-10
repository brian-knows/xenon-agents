import type { Hex } from "viem";
import env from "../env";

/**
 * @dev Gets the balance chart of a wallet
 * @param address - The address of the wallet
 * @returns The balance chart of the wallet
 */
export const getWalletBalanceChart = async (
  address: Hex,
  period: string = "month"
) => {
  try {
    const url = `https://api.zerion.io/v1/wallets/${address}/charts/${period}?currency=usd&filter[chain_ids]=${env.CHAIN_NAME}`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Basic ${env.ZERION_API_KEY}`,
      },
    };

    const response = await fetch(url, options);

    return response.json();
  } catch (error) {
    console.log("=========== getWalletBalanceChart error ===========");
    console.error(error);
    return null;
  }
};

/**
 * @dev Gets the portfolio of a wallet
 * @param address - The address of the wallet
 * @returns The portfolio of the wallet
 */
export const getWalletPortfolio = async (address: Hex) => {
  try {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Basic ${env.ZERION_API_KEY}`,
      },
    };

    const response = await fetch(
      `https://api.zerion.io/v1/wallets/${address}/portfolio?currency=usd`,
      options
    );

    return response.json();
  } catch (error) {
    console.log("=========== getWalletPortfolio error ===========");
    console.error(error);
    return null;
  }
};

/**
 * @dev Gets the transactions of a wallet
 * @param address - The address of the wallet
 * @returns The transactions of the wallet
 */
export const getWalletTransactions = async (address: Hex) => {
  try {
    const url = `https://api.zerion.io/v1/wallets/${address}/transactions/?currency=usd&page[size]=100&filter[trash]=only_non_trash&filter[chain_ids]=${env.CHAIN_NAME}`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Basic ${env.ZERION_API_KEY}`,
      },
    };

    const response = await fetch(url, options);

    return response.json();
  } catch (error) {
    console.log("=========== getWalletTransactions error ===========");
    console.error(error);
    return null;
  }
};

/**
 * @dev Gets the fungible positions of a wallet
 * @param address - The address of the wallet
 * @returns The fungible positions of the wallet
 */
export const getWalletFungiblePositions = async (address: Hex) => {
  try {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Basic ${env.ZERION_API_KEY}`,
      },
    };

    const response = await fetch(
      `https://api.zerion.io/v1/wallets/${address}/positions/?filter[positions]=only_simple&currency=usd&filter[chain_ids]=${env.CHAIN_NAME}&filter[trash]=only_non_trash&sort=value`,
      options
    );

    return response.json();
  } catch (error) {
    console.log("=========== getWalletFungiblePositions error ===========");
    console.error(error);
    return null;
  }
};
