"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatUsdMicros, formatUsdRounded } from "@/lib/nav-display";
import { formatShares } from "@/lib/demo/format";
import { formatSharePpm, type PoolLiquidity } from "@/lib/xstocks/liquidity";

// The Pools page's pictures, drawn from the pool's reserves as read from X Layer: where the pool's
// liquidity sits by price, how a deposit of demo dollars goes in, and what a NAV move does to it
// against holding the same tokens. Nothing here is a forecast; every figure follows from the reserves.

const money = (value: number, digits = 2) => `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** The plot's width in CSS pixels, so the chart draws at its real size and its text stays 12px on a phone too. */
function useWidth(initial: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

type Bin = { from: number; to: number; side: "dollars" | "shares"; amount: number; value: number };

/**
 * A constant-product pool's liquidity in 2% price bands either side of its price. Below the price
 * it holds demo dollars, which buy USTX as the price falls; above it, USTX, which it sells as the
 * price rises. With L = √(USTX × dUSD): a band from a to b holds L(√b − √a) dUSD below the price and
 * L(1/√a − 1/√b) USTX above it.
 */
export function liquidityBins(pool: PoolLiquidity, steps = 12, width = 0.02): Bin[] {
  const shares = Number(pool.sharesMicros) / 1e6, dollars = Number(pool.dollarsMicros) / 1e6;
  if (!(shares > 0 && dollars > 0)) return [];
  const price = dollars / shares, l = Math.sqrt(shares * dollars);
  const bins: Bin[] = [];
  for (let k = -steps; k < steps; k += 1) {
    const from = price * (1 + k * width), to = price * (1 + (k + 1) * width);
    if (k < 0) { const amount = l * (Math.sqrt(to) - Math.sqrt(from)); bins.push({ from, to, side: "dollars", amount, value: amount }); }
    else { const amount = l * (1 / Math.sqrt(from) - 1 / Math.sqrt(to)); bins.push({ from, to, side: "shares", amount, value: amount * (from + to) / 2 }); }
  }
  return bins;
}

/** Where the pool's liquidity sits by price, with the pool's price and the NAV marked; each band has its tooltip. */
export function LiquidityChart({ pool, nav, share }: { pool: PoolLiquidity; nav: bigint | null; share: number | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const title = useId();
  const [plotRef, W] = useWidth(900);
  const bins = liquidityBins(pool);
  if (!bins.length) return null;
  const H = W < 500 ? 200 : 230, top = 38, bottom = 28, plot = H - top - bottom;
  const low = bins[0].from, high = bins[bins.length - 1].to;
  const x = (price: number) => ((price - low) / (high - low)) * W;
  const max = Math.max(...bins.map(bin => bin.value));
  const slot = W / bins.length, bar = Math.min(24, slot * 0.66);
  const price = Number(pool.dollarsMicros) / Number(pool.sharesMicros);
  const navPrice = nav !== null ? Number(nav) / 1e6 : null;
  const marker = (at: number, label: string, anchorLeft: boolean, row: number) => <g className="gmd-lq-marker">
    <line x1={x(at)} x2={x(at)} y1={top - 4} y2={H - bottom} />
    <text x={x(at) + (anchorLeft ? -6 : 6)} y={12 + row * 14} textAnchor={anchorLeft ? "end" : "start"}>{label}</text>
  </g>;
  const navInside = navPrice !== null && navPrice > low && navPrice < high;
  const active = hover === null ? null : bins[hover];
  return <figure className="gmd-lq" aria-labelledby={title}>
    <div className="gmd-lq-head"><h3 id={title}>Liquidity by price</h3>
      <ul className="gmd-lq-legend"><li><i className="is-dollars" aria-hidden="true" />dUSD, buys USTX if the price falls</li><li><i className="is-shares" aria-hidden="true" />USTX, sold if the price rises</li></ul></div>
    <div className="gmd-lq-plot" ref={plotRef}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Liquidity in 2% price bands from ${money(low)} to ${money(high)}: demo dollars below the pool price of ${money(price)}, USTX above it.`}>
        <line className="gmd-lq-base" x1={0} x2={W} y1={H - bottom} y2={H - bottom} />
        {bins.map((bin, index) => {
          const height = Math.max(2, (bin.value / max) * plot);
          const cx = index * slot + slot / 2, left = cx - bar / 2, base = H - bottom, r = Math.min(4, height);
          return <g key={index} className={`gmd-lq-bar is-${bin.side}${hover === index ? " is-active" : ""}`}>
            <path d={`M${left},${base} V${base - height + r} Q${left},${base - height} ${left + r},${base - height} H${left + bar - r} Q${left + bar},${base - height} ${left + bar},${base - height + r} V${base} Z`} />
            <rect className="gmd-lq-hit" x={index * slot} y={top} width={slot} height={plot} tabIndex={0} aria-label={`${money(bin.from)} to ${money(bin.to)}: ${money(bin.value, 0)}`}
              onPointerEnter={() => setHover(index)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} />
          </g>;
        })}
        {marker(price, `Pool ${money(price)}`, navPrice !== null && navPrice > price, 0)}
        {navInside && marker(navPrice!, `NAV ${money(navPrice!)}`, navPrice! <= price, 1)}
        {(W < 500 ? [-0.2, 0, 0.2] : [-0.2, -0.1, 0, 0.1, 0.2]).map(move => <text key={move} className="gmd-lq-tick" x={x(price * (1 + move))} y={H - 8} textAnchor="middle">{move === 0 ? "now" : `${move > 0 ? "+" : "−"}${Math.abs(move * 100)}%`}</text>)}
      </svg>
      {active && <div className={`gmd-chart-tip${hover! > bins.length / 2 ? " is-left" : ""}`} style={{ left: `${((hover! + 0.5) / bins.length) * 100}%`, top: "30%" }} role="status">
        <b>{money(active.value, 0)}</b>
        <span>{active.side === "dollars" ? `${money(active.amount, 0)} dUSD` : `${active.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} USTX`}</span>
        <small>{money(active.from)} – {money(active.to)}</small>
        {share !== null && share > 0 && <small>Yours: {money(active.value * share, active.value * share < 1 ? 4 : 2)}</small>}
      </div>}
    </div>
    <figcaption className="gmd-caption">Read from the pool’s reserves on X Layer. A constant-product pool spreads its liquidity across every price, so each 2% band holds a similar amount; the bands nearest the price trade first.</figcaption>
  </figure>;
}

/** How a deposit of demo dollars goes into the pool: the part invested at the NAV and the part deposited as it is. */
export function DepositPreview({ split, lpMicros, shareAfter }: {
  split: { investMicros: bigint; sharesMicros: bigint; dollarsMicros: bigint } | null; lpMicros: bigint | null; shareAfter: bigint | null;
}) {
  if (!split) return <section className="gmd-deposit-preview is-empty" aria-labelledby="deposit-preview-title"><h3 id="deposit-preview-title">Your deposit</h3>
    <div className="gmd-deposit-bar" aria-hidden="true"><i style={{ flex: 1 }} /><i style={{ flex: 1 }} /></div>
    <p className="gmd-caption">Enter an amount of demo dollars, or pick one, to see how it goes into the pool.</p></section>;
  const total = split.investMicros + split.dollarsMicros;
  const invested = total > 0n ? Number(split.investMicros * 10_000n / total) / 100 : 50;
  return <section className="gmd-deposit-preview" aria-labelledby="deposit-preview-title">
    <h3 id="deposit-preview-title">Your deposit of {formatUsdRounded(total)}</h3>
    <div className="gmd-deposit-bar" role="img" aria-label={`${invested.toFixed(1)}% buys USTX at the NAV, ${(100 - invested).toFixed(1)}% goes in as demo dollars`}>
      <i className="is-shares" style={{ flex: invested }} /><i className="is-dollars" style={{ flex: 100 - invested }} />
    </div>
    <dl className="gmd-deposit-parts">
      <div><dt><i className="is-shares" aria-hidden="true" />Buys USTX at the NAV</dt><dd>{formatUsdMicros(split.investMicros, 2)}<small>{formatShares(split.sharesMicros)} USTX</small></dd></div>
      <div><dt><i className="is-dollars" aria-hidden="true" />Goes in as dUSD</dt><dd>{formatUsdMicros(split.dollarsMicros, 2)}<small>at the pool’s ratio</small></dd></div>
      <div><dt>You receive</dt><dd>{lpMicros !== null ? `${formatShares(lpMicros)} USTX-LP` : "—"}<small>{shareAfter !== null ? `${formatSharePpm(shareAfter, true)} of the pool after` : ""}</small></dd></div>
    </dl>
  </section>;
}

const MOVES = Array.from({ length: 81 }, (_, index) => index - 30); // −30% … +50%

/** A deposit's value after the NAV moves and arbitrage brings the pool to it, against holding the same tokens: √r against (1 + r) / 2. */
export function NavMoveChart({ amount }: { amount: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const title = useId();
  const [plotRef, W] = useWidth(460);
  const H = 200, top = 14, bottom = 26, left = 6, right = 80;
  const pooled = (move: number) => amount * Math.sqrt(1 + move / 100);
  const held = (move: number) => amount * (2 + move / 100) / 2;
  const values = MOVES.flatMap(move => [pooled(move), held(move)]);
  const min = Math.min(...values), max = Math.max(...values);
  const x = (move: number) => left + ((move + 30) / 80) * (W - left - right);
  const y = (value: number) => top + (1 - (value - min) / (max - min || 1)) * (H - top - bottom);
  const line = (value: (move: number) => number) => MOVES.map((move, index) => `${index ? "L" : "M"}${x(move).toFixed(1)},${y(value(move)).toFixed(1)}`).join("");
  const gap = `${line(held)} ${MOVES.slice().reverse().map(move => `L${x(move).toFixed(1)},${y(pooled(move)).toFixed(1)}`).join("")} Z`;
  const at = hover === null ? null : MOVES[hover];
  return <figure className="gmd-navmove" aria-labelledby={title}>
    <div className="gmd-lq-head"><h3 id={title}>If the NAV moves</h3>
      <ul className="gmd-lq-legend"><li><i className="is-line-pool" aria-hidden="true" />In the pool</li><li><i className="is-line-held" aria-hidden="true" />Holding both</li></ul></div>
    <div className="gmd-lq-plot" ref={plotRef}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${money(amount, 0)} deposited: after a NAV move of −30% to +50%, in the pool against holding both tokens, before fees.`}
        onPointerMove={event => { const box = event.currentTarget.getBoundingClientRect(); const ratio = ((event.clientX - box.left) / box.width * W - left) / (W - left - right); setHover(Math.max(0, Math.min(MOVES.length - 1, Math.round(ratio * 80)))); }}
        onPointerLeave={() => setHover(null)}>
        <line className="gmd-lq-base" x1={x(0)} x2={x(0)} y1={top} y2={H - bottom} />
        <path className="gmd-navmove-gap" d={gap} />
        <path className="gmd-navmove-held" d={line(held)} />
        <path className="gmd-navmove-pool" d={line(pooled)} />
        <text className="gmd-navmove-label" x={x(50) + 6} y={y(held(50)) - 4}>Holding</text>
        <text className="gmd-navmove-label" x={x(50) + 6} y={y(pooled(50)) + 12}>In the pool</text>
        {[-30, 0, 25, 50].map(move => <text key={move} className="gmd-lq-tick" x={x(move)} y={H - 8} textAnchor="middle">{move === 0 ? "0%" : `${move > 0 ? "+" : "−"}${Math.abs(move)}%`}</text>)}
        {at !== null && <g className="gmd-navmove-cross"><line x1={x(at)} x2={x(at)} y1={top} y2={H - bottom} /><circle className="is-held" cx={x(at)} cy={y(held(at))} r={4} /><circle className="is-pool" cx={x(at)} cy={y(pooled(at))} r={4} /></g>}
      </svg>
      {at !== null && <div className={`gmd-chart-tip${hover! > 50 ? " is-left" : ""}`} style={{ left: `${(x(at) / W) * 100}%`, top: "20%" }} role="status">
        <b>{money(pooled(at))}</b><span>In the pool, NAV {at > 0 ? "+" : at < 0 ? "−" : ""}{Math.abs(at)}%</span>
        <small>Holding both: {money(held(at))}</small><small>Difference: {money(pooled(at) - held(at))}</small>
      </div>}
    </div>
    <figcaption className="gmd-caption">Before fees, which add to the pool. An illustration, not a forecast.</figcaption>
  </figure>;
}

