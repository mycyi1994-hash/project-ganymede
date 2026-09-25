import { createPublicClient, createWalletClient, http, maxUint256, parseAbi, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xlayerTestnet } from "./chain";

/**
 * The USTX arbitrage keeper, a Worker of its own (wrangler.keeper.jsonc). Every five minutes it
 * asks GanymedeNavArbitrage for the trade that closes the USTX pool's gap to the NAV and, when the
 * gap is wider than the pool's fee, sends that trade from its own wallet. That keeps the pool's
 * market price near the NAV, the way ETF creation and redemption do for a fund.
 *
 * Its key (KEEPER_PRIVATE_KEY, a Worker secret) holds testnet OKB for gas and no-value demo
 * dollars, claimed from the demo dollar when it runs low. It has no role on any contract, and a
 * trade that is no longer profitable when it lands reverts in the arbitrage contract.
 */

export interface KeeperEnv {
  KEEPER_PRIVATE_KEY?: string;
  ARBITRAGE_ADDRESS?: string;
  DOLLAR_ADDRESS?: string;
  SETTLEMENT_RPC_URL?: string;
}

/** The smallest trade worth sending, in demo-dollar micros. */
export const MIN_TRADE_MICROS = 1_000_000n;
// The fund refuses investments under $10, and a claim adds 10,000 demo dollars.
const MIN_INVESTMENT_MICROS = 10_000_000n;
const CLAIM_MICROS = 10_000_000_000n;

export type Quote = { buyInPool: boolean; dollarsIn: bigint; dollarsOut: bigint };
export type Sent = { hash: Hex; success: boolean };

/** What the keeper reads and sends. The Worker binds it to X Layer Testnet; tests use a fake. */
export interface KeeperChain {
  quote(): Promise<Quote>;
  dollarBalance(): Promise<bigint>;
  allowance(): Promise<bigint>;
  nextClaimAt(): Promise<bigint>;
  now(): Promise<bigint>;
  claim(): Promise<Sent>;
  approve(): Promise<Sent>;
  arbitrage(buyInPool: boolean, dollarsIn: bigint, minProfit: bigint): Promise<Sent>;
}

export type KeeperOutcome =
  | { action: "none"; reason: string }
  | { action: "arbitrage"; direction: "buyAndRedeem" | "investAndSell"; dollarsIn: string; expectedOut: string; hash: Hex; success: boolean };

export async function runKeeper(chain: KeeperChain): Promise<KeeperOutcome> {
  let quote: Quote;
  try {
    quote = await chain.quote();
  } catch (error) {
    // For example NavTooOld: without a usable NAV there is no gap to close.
    return { action: "none", reason: `no quote: ${describe(error)}` };
  }
  if (quote.dollarsIn === 0n) return { action: "none", reason: "the pool is within its fee of the NAV" };
  const minimum = quote.buyInPool ? MIN_TRADE_MICROS : MIN_INVESTMENT_MICROS;
  if (quote.dollarsIn < minimum) return { action: "none", reason: `the gap calls for ${quote.dollarsIn} demo-dollar micros, below the ${minimum} a trade needs` };

  let balance = await chain.dollarBalance();
  if (balance < quote.dollarsIn && (await chain.nextClaimAt()) <= (await chain.now())) {
    const claimed = await chain.claim();
    if (!claimed.success) return { action: "none", reason: `claim reverted: ${claimed.hash}` };
    balance += CLAIM_MICROS;
  }
  const size = balance < quote.dollarsIn ? balance : quote.dollarsIn;
  if (size < minimum) return { action: "none", reason: `holds ${size} demo-dollar micros, below the ${minimum} a trade needs` };
  if ((await chain.allowance()) < size) {
    const approved = await chain.approve();
    if (!approved.success) return { action: "none", reason: `approve reverted: ${approved.hash}` };
  }
  // At the quoted size, insist on half the expected profit; a smaller trade only insists on no loss.
  const minProfit = size === quote.dollarsIn ? (quote.dollarsOut - quote.dollarsIn) / 2n : 0n;
  const sent = await chain.arbitrage(quote.buyInPool, size, minProfit);
  return {
    action: "arbitrage",
    direction: quote.buyInPool ? "buyAndRedeem" : "investAndSell",
    dollarsIn: size.toString(),
    expectedOut: quote.dollarsOut.toString(),
    hash: sent.hash,
    success: sent.success,
  };
}

const ARBITRAGE_ABI = parseAbi([
  "function quote() view returns (bool buyInPool, uint256 dollarsIn, uint256 dollarsOut)",
  "function buyAndRedeem(uint256 dollarsIn, uint256 minProfit) returns (uint256)",
  "function investAndSell(uint256 dollarsIn, uint256 minProfit) returns (uint256)",
]);

const DOLLAR_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function nextClaimAt(address account) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function claim()",
]);

function address(value: string | undefined, name: string): Address {
  if (!value || !/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error(`${name} is not set.`);
  return value as Address;
}

/** The keeper's chain on X Layer Testnet, signing with KEEPER_PRIVATE_KEY. */
export function xlayerKeeperChain(env: KeeperEnv): KeeperChain {
  const key = env.KEEPER_PRIVATE_KEY;
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error("KEEPER_PRIVATE_KEY is not set.");
  const arbitrage = address(env.ARBITRAGE_ADDRESS, "ARBITRAGE_ADDRESS");
  const dollar = address(env.DOLLAR_ADDRESS, "DOLLAR_ADDRESS");
  const account = privateKeyToAccount(key as Hex);
  const transport = http(env.SETTLEMENT_RPC_URL || xlayerTestnet.rpcUrls.default.http[0]);
  const publicClient = createPublicClient({ chain: xlayerTestnet, transport });
  const walletClient = createWalletClient({ chain: xlayerTestnet, transport, account });

  // Writes in one run take consecutive nonces and wait for each receipt, so a node of the
  // load-balanced RPC that lags the last receipt cannot hand out a used nonce.
  let nonce: number | undefined;
  async function send(write: (nonce: number) => Promise<Hex>): Promise<Sent> {
    nonce ??= await publicClient.getTransactionCount({ address: account.address, blockTag: "pending" });
    const hash = await write(nonce++);
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
    return { hash, success: receipt.status === "success" };
  }

  return {
    async quote() {
      const [buyInPool, dollarsIn, dollarsOut] = await publicClient.readContract({ address: arbitrage, abi: ARBITRAGE_ABI, functionName: "quote" });
      return { buyInPool, dollarsIn, dollarsOut };
    },
    dollarBalance: () => publicClient.readContract({ address: dollar, abi: DOLLAR_ABI, functionName: "balanceOf", args: [account.address] }),
    allowance: () => publicClient.readContract({ address: dollar, abi: DOLLAR_ABI, functionName: "allowance", args: [account.address, arbitrage] }),
    nextClaimAt: () => publicClient.readContract({ address: dollar, abi: DOLLAR_ABI, functionName: "nextClaimAt", args: [account.address] }),
    now: async () => (await publicClient.getBlock()).timestamp,
    claim: () => send(n => walletClient.writeContract({ address: dollar, abi: DOLLAR_ABI, functionName: "claim", nonce: n, gas: 150_000n })),
    approve: () => send(n => walletClient.writeContract({ address: dollar, abi: DOLLAR_ABI, functionName: "approve", args: [arbitrage, maxUint256], nonce: n, gas: 80_000n })),
    arbitrage: (buyInPool, dollarsIn, minProfit) =>
      send(n => walletClient.writeContract({
        address: arbitrage,
        abi: ARBITRAGE_ABI,
        functionName: buyInPool ? "buyAndRedeem" : "investAndSell",
        args: [dollarsIn, minProfit],
        nonce: n,
        gas: 400_000n,
      })),
  };
}

// Log messages only; an RPC URL can carry a provider key.
function describe(error: unknown): string {
  const text = error instanceof Error ? (error as { shortMessage?: string }).shortMessage ?? error.message : String(error);
  return text.replace(/https?:\/\/\S+/g, "[rpc]").slice(0, 200);
}

export default {
  async scheduled(_controller: ScheduledController, env: KeeperEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      Promise.resolve()
        .then(() => runKeeper(xlayerKeeperChain(env)))
        .then(outcome => console.log(JSON.stringify(outcome)), error => console.error(`keeper run failed: ${describe(error)}`)),
    );
  },
  // The keeper only runs on its schedule; it serves nothing.
  async fetch(): Promise<Response> {
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<KeeperEnv>;
