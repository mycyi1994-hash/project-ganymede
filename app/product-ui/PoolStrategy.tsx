"use client";

import { useEffect, useId, useState } from "react";
import { formatUsdMicros } from "@/lib/nav-display";
import { poolValueMicros, type PoolLiquidity } from "@/lib/xstocks/liquidity";
import { tickToUsd, v4ValueMicros, type V4Deployment, type V4Pool } from "@/lib/xstocks/v4-liquidity";
import {
  LP_STRATEGIES, constantProductRange, strategyById, strategyShape, strategyYear, workingNearNav,
  type PriceRange, type ShapeBin, type StrategyId,
} from "@/lib/xstocks/lp-strategy";
import { Icon } from "./Icons";
import { useAsk } from "./AskUstx";
import { ChartHead, useWidth } from "./PoolVisuals";

// Liquidity strategies on Pools, laid out as Meteora lays out its shapes: Spot, Curve, Spot + Curve
// and a split of one's own, each a real split of the deposit between the constant-product pool and
// the v4 pool held at the NAV (lib/xstocks/lp-strategy.ts). The chart draws where the deposit's
// dollars would sit by price, from both pools' ranges as read on X Layer; Ask USTX explains the
// chosen strategy, or one's own split, with the figures on screen.

const money = (value: number, digits = 2) => `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const signed = (ratio: number) => `${ratio > 0 ? "+" : ratio < 0 ? "−" : ""}${Math.abs(Math.round(ratio * 1000) / 10)}%`;

export type StrategyChoice = { id: StrategyId; v4Percent: number };
export const strategyPercent = (choice: StrategyChoice) => choice.id === "custom" ? choice.v4Percent : strategyById(choice.id).v4Percent;

/** Each pool's measured result for its providers per $10,000 a year, as GET /api/v1/ustx/pools serves it. */
export function useMeasuredResults() {
  const [value, setValue] = useState<{ constantProduct: bigint | null; v4: bigint | null; from: string | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/ustx/pools", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then((body: { lpResults?: { from?: string } | null; pools?: Array<{ id?: string; lpResult?: { per10kYearMicros?: string | null } | null }> } | null) => {
      if (cancelled || !body) return;
      const rate = (id: string) => { const raw = body.pools?.find(pool => pool.id === id)?.lpResult?.per10kYearMicros; return typeof raw === "string" ? BigInt(raw) : null; };
      setValue({ constantProduct: rate("ustx-dusd"), v4: rate("ustx-dusd-v4"), from: body.lpResults?.from ?? null });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return value;
}

/** A small picture of each shape, as on Meteora's strategy buttons. */
function ShapeIcon({ id, v4Percent }: { id: StrategyId; v4Percent: number }) {
  const bars = Array.from({ length: 9 }, (_, index) => {
    const peak = Math.max(0, 1 - Math.abs(index - 4) / 2.2);
    const curve = v4Percent / 100, even = 1 - curve;
    return id === "spot" ? 0.5 : id === "curve" ? 0.12 + peak * 0.88 : 0.12 + even * 0.35 + peak * curve * 0.8;
  });
  return <svg className="gmd-strategy-icon" viewBox="0 0 54 24" aria-hidden="true">{bars.map((height, index) => <rect key={index} x={index * 6} y={24 - height * 22} width={4} height={height * 22} rx={1} className={index < 4 ? "is-dollars" : index > 4 ? "is-shares" : "is-mid"} />)}</svg>;
}

/** The four strategies as buttons, and the split for one's own. */
export function StrategyPicker({ value, onChange }: { value: StrategyChoice; onChange: (next: StrategyChoice) => void }) {
  const id = useId();
  return <div className="gmd-strategy">
    <span className="gmd-strategy-label" id={id}>Strategy</span>
    <div className="gmd-strategy-options" role="radiogroup" aria-labelledby={id}>
      {LP_STRATEGIES.map(item => <button type="button" role="radio" key={item.id} aria-checked={value.id === item.id} onClick={() => onChange({ id: item.id, v4Percent: value.v4Percent })}>
        <ShapeIcon id={item.id} v4Percent={item.id === "custom" ? value.v4Percent : item.v4Percent} />
        <b>{item.name}</b><small>{item.label}</small>
      </button>)}
    </div>
    {value.id === "custom" && <div className="gmd-strategy-split">
      <label htmlFor={`${id}-split`}><span>At the NAV (v4) <b>{value.v4Percent}%</b></span><span>Even (constant product) <b>{100 - value.v4Percent}%</b></span></label>
      <input id={`${id}-split`} type="range" min={0} max={100} step={5} value={value.v4Percent} onChange={event => onChange({ id: "custom", v4Percent: Number(event.target.value) })} />
    </div>}
  </div>;
}

/** Both pools as price ranges, read from X Layer: what the shape is drawn from. */
export function poolRanges(pool: PoolLiquidity | null, v4: V4Pool | null, deployment: V4Deployment | null) {
  const nav = pool?.nav.navMicros ?? (v4 && v4.nav.answer !== null ? v4.nav.navMicros : null);
  const cp = pool && nav !== null && pool.sharesMicros > 0n ? { ranges: constantProductRange(pool), price: Number(pool.dollarsMicros) / Number(pool.sharesMicros), valueMicros: poolValueMicros(pool, nav) } : null;
  const toRange = (range: V4Pool["base"]): PriceRange | null => {
    if (!deployment || range.liquidity === 0n) return null;
    const a = tickToUsd(range.lower, deployment.assetIsCurrency0), b = tickToUsd(range.upper, deployment.assetIsCurrency0);
    return { lower: Math.min(a, b), upper: Math.max(a, b), liquidity: Number(range.liquidity) };
  };
  const pegged = v4 && v4.nav.answer !== null && deployment ? {
    ranges: [toRange(v4.base), toRange(v4.limit)].filter((range): range is PriceRange => range !== null),
    price: Number(v4.priceMicros) / 1e6, valueMicros: v4ValueMicros(v4, v4.nav.answer),
  } : null;
  return { nav, constantProduct: cp, v4: pegged };
}

/** Where a deposit under the chosen strategy sits by price, with what it means and Ask USTX. */
export function StrategyChart({ choice, amountMicros, pool, v4, deployment, tall = false }: { choice: StrategyChoice; amountMicros: bigint; pool: PoolLiquidity | null; v4: V4Pool | null; deployment: V4Deployment | null; tall?: boolean }) {
  const title = useId();
  const [hover, setHover] = useState<number | null>(null);
  const [plotRef, W] = useWidth(900);
  const measured = useMeasuredResults();
  const assistant = useAsk();
  const strategy = strategyById(choice.id);
  const v4Percent = strategyPercent(choice);
  const { nav, constantProduct, v4: pegged } = poolRanges(pool, v4, deployment);
  if (nav === null) return <div className="gmd-lq is-loading" aria-busy="true"><i className="gmd-skeleton gmd-lq-skeleton" aria-hidden="true" /></div>;
  const v4Micros = amountMicros * BigInt(v4Percent) / 100n, cpMicros = amountMicros - v4Micros;
  const bins = strategyShape({ navMicros: nav, constantProductMicros: cpMicros, v4Micros, constantProduct, v4: pegged });
  const near = workingNearNav(bins, nav);
  const deposit = Number(amountMicros) / 1e6;
  const nearTotal = near.constantProduct + near.v4;
  const year = measured ? strategyYear(cpMicros, v4Micros, measured) : null;
  const navPrice = Number(nav) / 1e6;
  const H = tall ? 340 : W < 500 ? 220 : 260, top = 30, bottom = 30, plot = H - top - bottom;
  const max = Math.max(1e-9, ...bins.map(bin => bin.constantProduct + bin.v4));
  const slot = W / bins.length, bar = Math.min(26, slot * 0.7);
  const active = hover === null ? null : bins[hover];
  // The constant-product part is drawn lighter only when the deposit is in both pools.
  const mixed = v4Percent > 0 && v4Percent < 100;
  const shape = (bin: ShapeBin, index: number) => {
    const all = (bin.constantProduct + bin.v4) / max * plot, base = H - bottom;
    const heightCp = bin.constantProduct / max * plot;
    const left = index * slot + (slot - bar) / 2;
    const distance = Math.abs(index + 0.5 - bins.length / 2);
    return <g key={index} className={`gmd-strategy-bar is-${bin.side}${hover === index ? " is-active" : ""}`} style={{ ["--gmd-delay" as string]: `${Math.round(distance * 26)}ms` }}>
      <rect className="is-v4" x={left} y={base - Math.max(all, 1.5)} width={bar} height={Math.max(all, 1.5)} rx={Math.min(4, bar / 3)} />
      {mixed && heightCp > 0.5 && <rect className="is-cp" x={left} y={base - heightCp} width={bar} height={heightCp} rx={Math.min(4, bar / 3)} />}
      <rect className="gmd-lq-hit" x={index * slot} y={top} width={slot} height={plot} tabIndex={0} aria-label={`${money(bin.from)} to ${money(bin.to)}: ${money(bin.constantProduct + bin.v4)}`}
        onPointerEnter={() => setHover(index)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} />
    </g>;
  };
  const describe = `${strategy.name}${choice.id === "custom" ? ` (my own split: ${v4Percent}% in the v4 pool held at the NAV, ${100 - v4Percent}% in the constant-product pool)` : ` (${v4Percent}% in the v4 pool held at the NAV, ${100 - v4Percent}% in the constant-product pool)`}`;
  const figures = `For ${money(deposit)} of demo dollars, about ${money(nearTotal)} would sit within 2% of the NAV of ${money(navPrice)} (${money(near.v4)} from the v4 pool, ${money(near.constantProduct)} from the constant-product pool).${year !== null ? ` At each pool's measured result for providers so far, a year would come to about ${formatUsdMicros(year < 0n ? -year : year, 2)}${year < 0n ? " lost" : ""}.` : ""}`;
  const questions = [
    { label: choice.id === "custom" ? "Explain my split" : `Explain ${strategy.name} in detail`, question: `On Pools I chose the ${describe} liquidity strategy. ${figures} Explain in detail and in plain words how this strategy works with these two pools, what I earn and from whom, and what happens when the NAV moves or a new NAV record arrives.` },
    { label: "Compare it with the others", question: `On Pools the liquidity strategies are Spot (all in the constant-product pool), Curve (all in the v4 pool held at the NAV), Spot + Curve (half each) and a custom split. I am looking at ${describe}. ${figures} Compare the strategies for me: which earns more per dollar near the NAV, which is safer when the price jumps, and who each one suits.` },
    { label: "When does it do badly?", question: `When does the ${describe} liquidity strategy on Pools do badly? ${figures} Explain impermanent loss, the pool's price moving from the NAV, the v4 pool's deposit waiting for the next NAV record, and anything else, simply.` },
  ];
  return <figure className={`gmd-lq gmd-strategy-chart${tall ? " is-tall" : ""}`} aria-labelledby={title}>
    <ChartHead id={title} title={`Your liquidity by price: ${strategy.name}`} question={questions[0].question} />
    <ul className="gmd-lq-legend">
      <li><i className="is-dollars" aria-hidden="true" />dUSD, buys USTX below the NAV</li>
      <li><i className="is-shares" aria-hidden="true" />USTX, sold above the NAV</li>
      {mixed && <li><i className="is-cp" aria-hidden="true" />Lighter: the constant-product pool’s part</li>}
    </ul>
    <div className="gmd-lq-plot" ref={plotRef}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${strategy.name}: ${money(deposit)} by price from ${money(bins[0].from)} to ${money(bins[bins.length - 1].to)}; ${money(nearTotal)} within 2% of the NAV.`}>
        <rect className="gmd-strategy-near" x={W * (0.5 - 0.02 / 0.12)} y={top - 10} width={W * (0.04 / 0.12)} height={plot + 10} />
        <text className="gmd-lq-tick gmd-strategy-near-label" x={W / 2} y={top - 14} textAnchor="middle">Within 2% of the NAV: {money(nearTotal, 0)} of {money(deposit, 0)}</text>
        <line className="gmd-lq-base" x1={0} x2={W} y1={H - bottom} y2={H - bottom} />
        <g key={`${choice.id}-${v4Percent}`}>{bins.map(shape)}</g>
        <line className="gmd-strategy-nav" x1={W / 2} x2={W / 2} y1={top - 4} y2={H - bottom} />
        {[-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06].filter(move => W >= 500 || Math.abs(move) !== 0.04).map(move => <text key={move} className="gmd-lq-tick" x={W / 2 + move / 0.12 * W} y={H - 9} textAnchor={move === -0.06 ? "start" : move === 0.06 ? "end" : "middle"}>{move === 0 ? `NAV ${money(navPrice)}` : signed(move)}</text>)}
      </svg>
      {active && <div className={`gmd-chart-tip${hover! > bins.length / 2 ? " is-left" : ""}`} style={{ left: `${((hover! + 0.5) / bins.length) * 100}%`, top: "28%" }} role="status">
        <b>{money(active.constantProduct + active.v4, active.constantProduct + active.v4 < 1 ? 4 : 2)}</b>
        <span>{money(active.from)} – {money(active.to)}</span>
        <small>v4 pool at the NAV: {money(active.v4, active.v4 < 1 ? 4 : 2)}</small>
        <small>Constant product: {money(active.constantProduct, active.constantProduct < 1 ? 4 : 2)}</small>
      </div>}
    </div>
    <dl className="gmd-strategy-facts">
      <div><dt>Within 2% of the NAV</dt><dd>{money(nearTotal)}<small>{deposit > 0 ? `${Math.round(nearTotal / deposit * 100)}% of your deposit meets the trades there` : "—"}</small></dd></div>
      <div><dt>Split</dt><dd>{v4Percent}% at the NAV<small>{100 - v4Percent}% even, in the constant-product pool</small></dd></div>
      <div><dt>A year at the measured results</dt><dd>{year === null ? "—" : `${year < 0n ? "−" : "+"}${formatUsdMicros(year < 0n ? -year : year, 2)}`}<small>Each pool’s result for providers so far, per dollar; not a forecast</small></dd></div>
    </dl>
    <p className="gmd-strategy-summary">{strategy.summary}</p>
    {assistant && <div className="gmd-strategy-ask">
      <span className="gmd-ask-guide-mark" aria-hidden="true"><Icon name="spark" size={16} /></span>
      <div><b>{choice.id === "custom" ? "Ask USTX about your split" : `Ask USTX about ${strategy.name}`}</b>
        <div className="gmd-ask-guide-actions">{questions.map(item => <button type="button" key={item.label} onClick={() => assistant.ask(item.question)}>{item.label}</button>)}</div></div>
    </div>}
    <figcaption className="gmd-caption">Drawn from both pools’ ranges as read on X Layer, at your share of each. The v4 pool’s hook moves its range to every NAV record; the constant-product pool keeps liquidity at every price, so little of it sits near the NAV. A deposit to the v4 pool becomes LP tokens at the next NAV record. Bid-Ask shapes need a position of your own, which neither pool offers.</figcaption>
  </figure>;
}
