"use client";

import { useEffect, useState } from "react";
import type { Composition } from "@/lib/xstocks/basket";
import { MAINNET } from "@/lib/xstocks/mainnet";
import { comparePrices, formatDifference, POOL_TOLERANCE, readPoolPrices, XSTOCK_POOLS, type PoolPrices } from "@/lib/xstocks/pool-prices";
import { formatUsdMicros } from "@/lib/nav-display";
import { shortTime } from "@/lib/product-market";
import { Icon } from "./Icons";

type Read = { key: string; pools: PoolPrices | null; error: string | null };

/**
 * The second price source, checked by the browser: the recorded prices beside the X Layer mainnet
 * pools read directly from the public RPC, with the recorded units valued at the pool prices.
 */
export default function PoolCheck({ composition }: { composition: Composition | null }) {
  const key = composition ? `${composition.asOf}:${composition.navPerShareMicros}` : "";
  const [read, setRead] = useState<Read | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    readPoolPrices()
      .then(pools => { if (!cancelled) setRead({ key, pools, error: null }); })
      .catch(reason => { if (!cancelled) setRead({ key, pools: null, error: reason instanceof Error ? reason.message : "The X Layer pools could not be read." }); });
    return () => { cancelled = true; };
  }, [key, attempt]);
  const current = read?.key === key ? read : null;
  const comparison = composition && current?.pools ? comparePrices(composition, current.pools) : null;
  const state = !composition || !current ? "loading" : current.error || !comparison ? "unavailable" : comparison.agrees ? "matched" : "failed";
  const label = { loading: "Reading the X Layer pools…", unavailable: "Pools unavailable", matched: "Prices agree", failed: "Prices disagree" }[state];
  const pool = (symbol: string) => XSTOCK_POOLS.find(entry => entry.symbol === symbol);
  return <section className="gmd-proof-history gmd-pool-check" id="proof-pools" aria-labelledby="pools-title">
    <header className="gmd-section-heading"><div><h2 id="pools-title">A second price source</h2><p>The recorded OKX OnchainOS prices beside the X Layer pools, read by your browser.</p></div><span className={`gmd-check-chip is-${state}`} aria-live="polite">{state === "matched" ? <Icon name="check" size={15} /> : <i aria-hidden="true" />}{label}</span></header>
    {comparison && <p className="gmd-pool-summary">The recorded holdings are worth <strong>{formatUsdMicros(comparison.poolNavMicros, 4)}</strong> per share at the pool prices, against the recorded NAV of <strong>{formatUsdMicros(comparison.recordedNavMicros, 4)}</strong>: <strong>{formatDifference(comparison.navDifferenceBps)}</strong>.</p>}
    {state === "unavailable" && <p className="gmd-pool-summary">Your browser could not read the X Layer pools just now. <button className="gmd-text-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
    {comparison && <div className="gmd-data-table-scroll"><table className="gmd-table"><thead><tr><th>xStock</th><th>Recorded</th><th>Pool now</th><th>Difference</th><th>Pool</th></tr></thead><tbody>{comparison.rows.map(row => { const entry = pool(row.symbol); return <tr key={row.symbol}><th scope="row">{row.symbol}</th><td>{formatUsdMicros(row.recordedMicros, 2)}</td><td>{formatUsdMicros(row.poolMicros, 2)}</td><td>{formatDifference(row.differenceBps)}</td><td>{entry ? <a className="gmd-inline-tx" href={`${MAINNET.explorerUrl}/address/${entry.pool}`} target="_blank" rel="noreferrer">{entry.stable.symbol}<Icon name="external" size={12} /><span className="gmd-sr-only"> pool on OKX Explorer (opens in a new tab)</span></a> : "—"}</td></tr>; })}</tbody></table></div>}
    <p className="gmd-caption">{current?.pools ? `Read at X Layer block ${current.pools.blockNumber.toLocaleString("en-US")}, ${shortTime(current.pools.blockTime)}. ` : ""}Each pool is the Uniswap V3 pool where the xStock’s ERC-4626 wrapper trades against a dollar stablecoin, named in the last column, confirmed with the factory and the wrapper on every read, converted at the wrapper’s rate and counting the stablecoin as $1. Pool prices move with every trade and the record can be a few minutes older, so the prices agree when the NAV is within {POOL_TOLERANCE.navBps / 100}% and each xStock within {POOL_TOLERANCE.assetBps / 100}%. The publisher runs the same comparison and does not record a NAV the pools disagree with.</p>
  </section>;
}
