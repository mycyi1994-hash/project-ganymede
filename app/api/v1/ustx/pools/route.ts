import { engineEnv } from "@/lib/engine/api-helpers";
import { EngineRepository } from "@/lib/engine/repository";
import { activityDay, parseActivityIndex } from "@/lib/xstocks/activity";
import { STATE_MARKET_ACTIVITY } from "@/lib/xstocks/activity-index";
import { FUND_DEPLOYMENT, POOL_FEE_BPS, fundExplorer } from "@/lib/xstocks/fund";
import { POOL_LAUNCHED_AT, lpTokenValueMicros, poolValueMicros, readLiquidity, readPoolYield } from "@/lib/xstocks/liquidity";
import { V4_POOL_DEPLOYMENT, readV4Pool, v4ValueMicros } from "@/lib/xstocks/v4-liquidity";

export const dynamic = "force-dynamic";

// Any site or app may read this: public chain state, no cookies, no credentials.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400" };

function json(value: unknown, status: number, cache: string): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": cache } });
}

const WAD = 10n ** 18n;
/** "6.62" from an 18-decimal fraction: percent to two decimals, rounded toward zero. */
const percent = (wad: bigint) => { const bps = wad * 10_000n / WAD; const sign = bps < 0n ? "-" : ""; const size = bps < 0n ? -bps : bps; return `${sign}${size / 100n}.${(size % 100n).toString().padStart(2, "0")}`; };

/** The last 24 hours of the pool's trades, from the index the scheduled job keeps; null before its first run. */
async function lastDay() {
  const index = parseActivityIndex((await new EngineRepository(engineEnv().DB).getState(STATE_MARKET_ACTIVITY))?.value);
  if (!index) return null;
  const day = activityDay(index, Date.now());
  return { trades: day.poolTrades, volumeMicros: day.poolVolumeMicros.toString(), feesMicros: day.poolFeesMicros.toString(), complete: day.complete, since: day.since, toBlock: index.toBlock };
}

/** USTX's liquidity pools on X Layer Testnet, read from the chain when called. Reads only. */
export async function GET() {
  try {
    const [{ pool }, growth, day, v4] = await Promise.all([
      readLiquidity(null),
      readPoolYield().catch(() => null),
      lastDay().catch(() => null),
      V4_POOL_DEPLOYMENT ? readV4Pool(V4_POOL_DEPLOYMENT, null).catch(() => null) : Promise.resolve(null),
    ]);
    const nav = pool.nav.navMicros;
    const priceMicros = pool.sharesMicros > 0n ? pool.dollarsMicros * 1_000_000n / pool.sharesMicros : null;
    const pools: unknown[] = [{
      id: "ustx-dusd",
      type: "constant-product",
      address: FUND_DEPLOYMENT.pool,
      block: pool.block,
      tokens: { ustx: FUND_DEPLOYMENT.fund, dusd: FUND_DEPLOYMENT.dollar, decimals: 6 },
      lpToken: { address: FUND_DEPLOYMENT.pool, symbol: "USTX-LP", decimals: 6, supplyMicros: pool.supply.toString() },
      feeBps: Number(POOL_FEE_BPS),
      reserves: { ustxMicros: pool.sharesMicros.toString(), dusdMicros: pool.dollarsMicros.toString() },
      priceMicros: priceMicros?.toString() ?? null,
      navMicros: nav?.toString() ?? null,
      valueMicros: nav !== null ? poolValueMicros(pool, nav).toString() : null,
      lpTokenValueMicros: nav !== null && pool.supply > 0n ? lpTokenValueMicros(pool, nav).toString() : null,
      feeApr: growth && {
        percent: percent(growth.aprWad), wad: growth.aprWad.toString(), growthWad: growth.growthWad.toString(),
        fromBlock: growth.fromBlock, toBlock: growth.toBlock, from: new Date(growth.fromTime * 1000).toISOString(), to: new Date(growth.toTime * 1000).toISOString(),
        lpTokenValueFromMicros: growth.lpValueFromMicros?.toString() ?? null, lpTokenValueToMicros: growth.lpValueToMicros?.toString() ?? null,
        heldValueToMicros: growth.heldValueToMicros?.toString() ?? null,
      },
      last24h: day,
      openedAt: POOL_LAUNCHED_AT,
      explorerUrl: fundExplorer.address(FUND_DEPLOYMENT.pool),
    }];
    if (V4_POOL_DEPLOYMENT && v4) {
      const { pool: hooked } = v4;
      pools.push({
        id: "ustx-dusd-v4",
        type: "uniswap-v4-nav-pegged",
        hook: V4_POOL_DEPLOYMENT.hook, poolManager: V4_POOL_DEPLOYMENT.poolManager, router: V4_POOL_DEPLOYMENT.router,
        block: hooked.block,
        tokens: { ustx: V4_POOL_DEPLOYMENT.asset, dusd: V4_POOL_DEPLOYMENT.dollar, decimals: 6 },
        lpToken: { address: V4_POOL_DEPLOYMENT.hook, symbol: "USTX-V4LP", decimals: 6, supplyMicros: hooked.supply.toString() },
        feePips: hooked.feePips,
        holdings: { ustxMicros: hooked.sharesMicros.toString(), dusdMicros: hooked.dollarsMicros.toString() },
        waiting: { ustxMicros: hooked.pending.sharesMicros.toString(), dusdMicros: hooked.pending.dollarsMicros.toString() },
        priceMicros: hooked.priceMicros.toString(),
        navMicros: hooked.nav.answer !== null ? hooked.nav.navMicros.toString() : null,
        valueMicros: hooked.nav.answer !== null ? v4ValueMicros(hooked, hooked.nav.answer).toString() : null,
        peggedAt: hooked.peggedAt ? new Date(hooked.peggedAt * 1000).toISOString() : null,
        explorerUrl: fundExplorer.address(V4_POOL_DEPLOYMENT.hook),
      });
    }
    return json({
      network: FUND_DEPLOYMENT.name,
      chainId: FUND_DEPLOYMENT.chainId,
      pools,
      rule: "Read from X Layer Testnet when called. Amounts are micros (6 decimals). valueMicros counts USTX at the fund's current NAV and dUSD at face value. feeApr is the growth of √(USTX × dUSD) per LP token between fromBlock and toBlock (the last seven days, or since the pool opened), which only the 0.3% fee raises, annualised without compounding; null when it cannot be read. Over the same blocks, lpTokenValueFromMicros and lpTokenValueToMicros value one LP token's part of the reserves at the NAV of each block, and heldValueToMicros values the same USTX and dUSD held outside the pool at the later NAV. last24h counts the pool's trades in the market activity index, an arbitrage's included, with the fee they paid in demo dollars; null before the index is built. A v4 pool appears once it is deployed: feePips is its swap fee now in hundredths of a basis point, and waiting holds deposits that become LP tokens at the next NAV record.",
      environment: "X Layer Testnet. Demo dollars and USTX have no value; not an offer.",
    }, 200, "public, max-age=60");
  } catch (error) {
    console.error("Public pools read failed", (error instanceof Error ? error.message : String(error)).replace(/https?:\/\/\S+/g, "[rpc]"));
    return json({ error: "The pools on X Layer Testnet could not be read. Try again shortly.", code: "pools_unavailable" }, 503, "no-store");
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
