import { Hono } from "hono";
import {
  getAccountBalances,
  getWalletBalanceChart,
  getWalletFungiblePositions,
  getWalletPortfolio,
  getWalletTransactions,
} from "../../data";
import { cache } from "hono/cache";
import { privateKeyToAccount } from "viem/accounts";
import env from "../../env";

const walletRouter = new Hono();

walletRouter.get(
  "/",
  cache({
    cacheName: "xenon-app",
    cacheControl: "max-age=36000",
  }),
  async (c) => {
    const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

    const period = c.req.query("period") || "month";

    const [chart, portfolio, transactions, positions, wallet] =
      await Promise.all([
        getWalletBalanceChart(account.address, period),
        getWalletPortfolio(account.address),
        getWalletTransactions(account.address),
        getWalletFungiblePositions(account.address),
        getAccountBalances(account.address),
      ]);

    return c.json({
      address: account.address,
      wallet,
      chart,
      portfolio,
      transactions,
      positions,
    });
  }
);

export { walletRouter };
