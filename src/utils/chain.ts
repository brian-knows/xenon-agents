import * as chains from "viem/chains";

export const getChain = (chainId: number) =>
  Object.values(chains).find((chain) => chain.id === chainId);
