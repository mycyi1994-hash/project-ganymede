"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { FundDetail, FundSummary } from "@/lib/funds/api";
import { incomeFund, INCOME_FUNDS, type FundDefinition } from "@/lib/funds/catalog";
import { formatUsdMicros } from "@/lib/nav-display";
import { shortTime } from "@/lib/product-market";
import { PROOF_DEPLOYMENT } from "@/lib/xstocks/proof";
import { INCOME_TERMS, type AutocallTerms, type CoveredCallTerms } from "@/lib/income/terms";
import { premiumYield, type CoveredCallDocument } from "@/lib/income/covered-call";
import { couponPayout, observationDate, type AutocallDocument } from "@/lib/income/autocall";
import { verifyIncomeSnapshot, type IncomeDocument, type IncomeVerification } from "@/lib/income/verify";
import { useFundResource } from "./useFundResource";
import { FundOrder, KIND_LABELS, NavLine, useFundAccount } from "./Funds";
import { ChartHead, useWidth } from "./PoolVisuals";
import { useAsk } from "./AskUstx";
import { AssetMark, Icon } from "./Icons";
import { OkxSource } from "./OkxSource";

// The income products: two covered-call funds and a step-down autocallable note (ELS) on SPYx and
// QQQx. Each page reads its record and documents from GET /api/v1/funds, checks the record against X
// Layer in the browser, and draws the product's payoff from the document. Demo dollars only.

const money = (value: number, digits = 2) => `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const pct = (ratio: number, digits = 1) => `${(ratio * 100).toFixed(digits)}%`;
const signed = (ratio: number, digits = 1) => `${ratio > 0 ? "+" : ratio < 0 ? "−" : ""}${Math.abs(ratio * 100).toFixed(digits)}%`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const txUrl = (hash: string | null | undefined) => hash && /^0x[0-9a-f]{64}$/i.test(hash) ? `${PROOF_DEPLOYMENT.explorerUrl}/tx/${hash}` : null;

function useIncomeCheck(fund: FundDetail | null, id: string): IncomeVerification {
  const [state, setState] = useState<{ fund: FundDetail; check: IncomeVerification } | null>(null);
  useEffect(() => {
    if (!fund) return;
    let cancelled = false;
    verifyIncomeSnapshot(fund, id).then(check => { if (!cancelled) setState({ fund, check }); }).catch(() => { if (!cancelled) setState({ fund, check: { result: "unavailable", detail: "X Layer could not be read just now." } }); });
    return () => { cancelled = true; };
  }, [fund, id]);
  return state?.fund === fund ? state.check : { result: "checking", detail: "Reading the record on X Layer…" };
}

/** The latest document this page has, before or without the check (the check's own when it matched). */
function latestDocument(fund: FundDetail | null, check: IncomeVerification): IncomeDocument | null {
  if (check.document) return check.document;
  const entry = fund?.history.find(item => item.status === "confirmed") ?? fund?.history[0];
  try { return entry ? JSON.parse(entry.canonical) as IncomeDocument : null; } catch { return null; }
}

/** A covered call's return at expiry against holding the ETF, by the ETF's move: capped above the strike, cushioned by the premium. */
function CoveredCallPayoff({ document }: { document: CoveredCallDocument }) {
  const [hover, setHover] = useState<number | null>(null);
  const title = useId();
  const [ref, W] = useWidth(640);
  const price = document.underlying.price;
  const yieldNow = premiumYield(document).month;
  const strikeMove = document.call.strike / price - 1;
  const moves = Array.from({ length: 61 }, (_, index) => (index - 30) / 200); // −15% … +15%
  const covered = (move: number) => Math.min(move, strikeMove) + yieldNow;
  const H = 230, top = 16, bottom = 28, left = 44, right = 12;
  const lo = -0.16, hi = 0.16;
  const x = (move: number) => left + (move + 0.15) / 0.3 * (W - left - right);
  const y = (value: number) => top + (hi - value) / (hi - lo) * (H - top - bottom);
  const path = (fn: (move: number) => number) => moves.map((move, index) => `${index ? "L" : "M"}${x(move).toFixed(1)},${y(fn(move)).toFixed(1)}`).join("");
  const at = hover === null ? null : moves[hover];
  const question = `On the ${document.underlying.symbol} covered call fund, the fund sold a call at ${money(document.call.strike)} with the ETF at ${money(price)}, for a premium of ${pct(yieldNow, 2)} of the fund this month. Explain in plain words what the fund earns if the ETF rises 10%, stays flat, or falls 10% by ${day(document.call.expiresAt)}.`;
  return <figure className="gmd-navmove gmd-income-chart" aria-labelledby={title}>
    <ChartHead id={title} title="At this call's expiry" question={question} />
    <ul className="gmd-lq-legend"><li><i className="is-line-pool" aria-hidden="true" />Covered call</li><li><i className="is-line-held" aria-hidden="true" />Holding the ETF</li></ul>
    <div className="gmd-lq-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Return at expiry: the covered call earns the ${pct(yieldNow, 2)} premium plus the ETF's move up to the strike, ${signed(strikeMove)}; holding the ETF earns its move.`}
        onPointerMove={event => { const box = event.currentTarget.getBoundingClientRect(); const ratio = ((event.clientX - box.left) / box.width * W - left) / (W - left - right); setHover(Math.max(0, Math.min(moves.length - 1, Math.round(ratio * 60)))); }} onPointerLeave={() => setHover(null)}>
        {[-0.1, 0, 0.1].map(value => <g key={value}><line className="gmd-lq-base" x1={left} x2={W - right} y1={y(value)} y2={y(value)} /><text className="gmd-lq-tick" x={left - 6} y={y(value) + 4} textAnchor="end">{signed(value, 0)}</text></g>)}
        <line className="gmd-income-strike" x1={x(strikeMove)} x2={x(strikeMove)} y1={top} y2={H - bottom} />
        <text className="gmd-lq-tick" x={x(strikeMove) + 6} y={top + 10}>Strike {money(document.call.strike)}</text>
        <path className="gmd-navmove-held" d={path(move => move)} pathLength={1} />
        <path className="gmd-navmove-pool" d={path(covered)} pathLength={1} />
        {[-0.15, 0, 0.15].map(move => <text key={move} className="gmd-lq-tick" x={x(move)} y={H - 8} textAnchor="middle">{move === 0 ? "ETF flat" : signed(move, 0)}</text>)}
        {at !== null && <g className="gmd-navmove-cross"><line x1={x(at)} x2={x(at)} y1={top} y2={H - bottom} /><circle className="is-held" cx={x(at)} cy={y(at)} r={4} /><circle className="is-pool" cx={x(at)} cy={y(covered(at))} r={4} /></g>}
      </svg>
      {at !== null && <div className={`gmd-chart-tip${hover! > 30 ? " is-left" : ""}`} style={{ left: `${(x(at) / W) * 100}%`, top: "18%" }} role="status"><b>{signed(covered(at), 2)}</b><span>Covered call, ETF {signed(at, 1)}</span><small>Holding the ETF: {signed(at, 2)}</small></div>}
    </div>
    <figcaption className="gmd-caption">Over this one-month call, before the next one is sold. The premium is modelled by Black–Scholes at {pct(document.terms.volatility, 0)} volatility: there is no options market for xStocks on X Layer.</figcaption>
  </figure>;
}

/** The note's barriers through its life, the worse index now and the knock-in level. */
function AutocallPath({ document, terms }: { document: AutocallDocument; terms: AutocallTerms }) {
  const title = useId();
  const [ref, W] = useWidth(640);
  const H = 240, top = 18, bottom = 30, left = 44, right = 16;
  const n = terms.barriers.length;
  const x = (index: number) => left + index / n * (W - left - right);
  const y = (level: number) => top + (1.2 - level) / (1.2 - 0.3) * (H - top - bottom);
  const steps = terms.barriers.map((barrier, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(barrier).toFixed(1)} L${x(index + 1).toFixed(1)},${y(barrier).toFixed(1)}`).join(" ");
  const done = document.state.observations.length;
  const question = `Explain this autocallable note (ELS) in plain words. It started on ${day(document.state.fixedAt)}; the worse of the S&P 500 and the Nasdaq-100 is at ${pct(document.worst)} of its start. ${document.nextObservation ? `At the next observation on ${day(document.nextObservation.date)} it pays back ${money(document.nextObservation.payIfCalled)} per $100 if the worse index is at or above ${pct(document.nextObservation.barrier, 0)}.` : ""} The knock-in is at ${pct(terms.knockIn, 0)}${document.state.knockedIn ? " and has been hit" : " and has not been hit"}. When would I get my money back, and what could I lose?`;
  return <figure className="gmd-navmove gmd-income-chart" aria-labelledby={title}>
    <ChartHead id={title} title="Barriers and where the note stands" question={question} />
    <ul className="gmd-lq-legend"><li><i className="is-line-pool" aria-hidden="true" />Early-repayment barrier</li><li><i className="is-dollars" aria-hidden="true" />Worse index now</li><li><i className="is-line-held" aria-hidden="true" />Knock-in</li></ul>
    <div className="gmd-lq-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Barriers ${terms.barriers.map(b => pct(b, 0)).join(", ")} at six-monthly observations; the worse index is at ${pct(document.worst)}; knock-in ${pct(terms.knockIn, 0)}.`}>
        {[1, 0.75, 0.5].map(level => <g key={level}><line className="gmd-lq-base" x1={left} x2={W - right} y1={y(level)} y2={y(level)} /><text className="gmd-lq-tick" x={left - 6} y={y(level) + 4} textAnchor="end">{pct(level, 0)}</text></g>)}
        <rect className="gmd-income-done" x={x(0)} y={top} width={Math.max(0, x(done) - x(0))} height={H - top - bottom} />
        <path className="gmd-navmove-pool" d={steps} pathLength={1} />
        <line className="gmd-income-ki" x1={left} x2={W - right} y1={y(terms.knockIn)} y2={y(terms.knockIn)} />
        <line className="gmd-income-now" x1={left} x2={W - right} y1={y(document.worst)} y2={y(document.worst)} />
        <circle className="gmd-income-dot" cx={x(done)} cy={y(document.worst)} r={6} />
        <text className="gmd-flow-label" x={x(done) + 10} y={y(document.worst) - 8}>Now {pct(document.worst)}</text>
        {terms.barriers.map((barrier, index) => <text key={index} className="gmd-lq-tick" x={x(index + 1)} y={H - 8} textAnchor="end">{index + 1 === n ? "3 yrs" : `${(index + 1) * 6} mo`}</text>)}
      </svg>
    </div>
    <figcaption className="gmd-caption">At each six-month observation the note pays back early if the worse index is at or above that step. Below the dashed knock-in at {pct(terms.knockIn, 0)}, capital is at risk at maturity.</figcaption>
  </figure>;
}

/** What the note pays at maturity by the worse index's level, with and without a knock-in. */
function AutocallPayoff({ terms }: { terms: AutocallTerms }) {
  const [hover, setHover] = useState<number | null>(null);
  const title = useId();
  const [ref, W] = useWidth(640);
  const H = 220, top = 16, bottom = 28, left = 48, right = 12;
  const levels = Array.from({ length: 121 }, (_, index) => 0.2 + index / 100); // 20% … 140%
  const full = couponPayout(terms, terms.barriers.length);
  const last = terms.barriers[terms.barriers.length - 1];
  const notIn = (level: number) => level >= terms.knockIn ? full : terms.face * level;
  const knocked = (level: number) => level >= last ? full : terms.face * level;
  const x = (level: number) => left + (level - 0.2) / 1.2 * (W - left - right);
  const y = (value: number) => top + (130 - value) / 120 * (H - top - bottom);
  const path = (fn: (level: number) => number) => levels.map((level, index) => `${index ? "L" : "M"}${x(level).toFixed(1)},${y(fn(level)).toFixed(1)}`).join("");
  const at = hover === null ? null : levels[hover];
  const question = `On this step-down note, at maturity it pays ${money(full)} per $100 unless the worse index ever fell below ${pct(terms.knockIn, 0)} and ends below ${pct(last, 0)}; then it pays $100 times the worse index's level. Explain with examples what I would get at maturity.`;
  return <figure className="gmd-navmove gmd-income-chart" aria-labelledby={title}>
    <ChartHead id={title} title="At maturity, per $100" question={question} />
    <ul className="gmd-lq-legend"><li><i className="is-line-pool" aria-hidden="true" />Never knocked in</li><li><i className="is-dollars" aria-hidden="true" />After a knock-in</li></ul>
    <div className="gmd-lq-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Pays ${money(full)} at maturity unless it knocked in below ${pct(terms.knockIn, 0)} and ends below ${pct(last, 0)}; then $100 times the worse index's level.`}
        onPointerMove={event => { const box = event.currentTarget.getBoundingClientRect(); const ratio = ((event.clientX - box.left) / box.width * W - left) / (W - left - right); setHover(Math.max(0, Math.min(levels.length - 1, Math.round(ratio * 120)))); }} onPointerLeave={() => setHover(null)}>
        {[50, 100, full].map(value => <g key={value}><line className="gmd-lq-base" x1={left} x2={W - right} y1={y(value)} y2={y(value)} /><text className="gmd-lq-tick" x={left - 6} y={y(value) + 4} textAnchor="end">{money(value, 0)}</text></g>)}
        <path className="gmd-income-knocked" d={path(knocked)} pathLength={1} />
        <path className="gmd-navmove-pool" d={path(notIn)} pathLength={1} />
        {[0.5, 0.75, 1, 1.4].map(level => <text key={level} className="gmd-lq-tick" x={x(level)} y={H - 8} textAnchor="middle">{pct(level, 0)}</text>)}
        {at !== null && <g className="gmd-navmove-cross"><line x1={x(at)} x2={x(at)} y1={top} y2={H - bottom} /><circle className="is-pool" cx={x(at)} cy={y(notIn(at))} r={4} /><circle className="is-held" cx={x(at)} cy={y(knocked(at))} r={4} /></g>}
      </svg>
      {at !== null && <div className={`gmd-chart-tip${hover! > 60 ? " is-left" : ""}`} style={{ left: `${(x(at) / W) * 100}%`, top: "18%" }} role="status"><b>{money(notIn(at))}</b><span>Worse index at {pct(at, 0)}, never knocked in</span><small>After a knock-in: {money(knocked(at))}</small></div>}
    </div>
    <figcaption className="gmd-caption">Before maturity the note can pay back early at any six-month observation. Nothing hedges it: it pays from recorded prices, in demo dollars.</figcaption>
  </figure>;
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

/** Ask USTX for an income product. */
function IncomeAsk({ definition }: { definition: FundDefinition }) {
  const assistant = useAsk();
  if (!assistant) return null;
  const questions = definition.kind === "covered-call"
    ? ["How does a covered call fund earn income?", `${definition.ticker} or just holding the ETF: what is the trade-off?`, "Why is the premium higher on the Nasdaq-100 than on the S&P 500?"]
    : ["When does this note pay back early?", "What is a knock-in, and how close is it now?", "What could I lose with this note?"];
  return <aside className="gmd-pool-ask" aria-label={`Ask USTX about ${definition.name}`}>
    <span className="gmd-ask-guide-mark" aria-hidden="true"><Icon name="spark" size={16} /></span>
    <div><b>New to {definition.kind === "covered-call" ? "covered calls" : "ELS"}?</b><p>Ask USTX explains how this product works, in plain words.</p>
      <div className="gmd-ask-guide-actions">{questions.map(question => <button type="button" key={question} onClick={() => assistant.ask(`${question} (${definition.name}, ${definition.description})`)}>{question}</button>)}</div></div>
  </aside>;
}

/** One income product's page. */
export function IncomeScreen({ id }: { id: string }) {
  const definition = incomeFund(id);
  const { data, error: failed } = useFundResource<{ fund: FundDetail }>(`/api/v1/funds?id=${encodeURIComponent(id)}`);
  const fund = data?.fund ?? null;
  const { data: account, error: accountError } = useFundAccount(id);
  const check = useIncomeCheck(fund, id);
  useEffect(() => { if (definition) document.title = `${definition.name} (${definition.ticker}) · Ganymede`; }, [definition]);
  if (!definition) return null;
  const terms = INCOME_TERMS[id];
  const latest = latestDocument(fund, check);
  const nav = check.record?.navPerShareMicros ?? null;
  const note = terms.kind === "autocall" && latest?.kind === "autocall" ? latest : null;
  const call = terms.kind === "covered-call" && latest?.kind === "covered-call" ? latest : null;
  const closed = note ? note.state.status !== "live" ? "This note has ended and takes no new money." : Date.parse(note.asOf) > Date.parse(note.subscriptionEndsAt) ? `Subscriptions closed on ${day(note.subscriptionEndsAt)}.` : null : null;
  return <>
    <Link className="gmd-breadcrumb" prefetch={false} href="/?category=income"><Icon name="back" size={16} />Income &amp; structured</Link>
    <div className="gmd-page-heading"><div><span className="gmd-ticker">{definition.ticker} <span>{KIND_LABELS[definition.kind ?? "basket"]}</span></span><h1>{definition.name}</h1><p>{definition.description}</p></div><span className="gmd-badge">Demo product · model pricing</span></div>
    {failed && <p className="gmd-inline-error" role="status">This product could not be read just now. Reload the page in a moment.</p>}
    {accountError && <p className="gmd-inline-error" role="status">{accountError}</p>}
    <div className="gmd-fund-layout">
      <div className="gmd-fund-main">
        <section className="gmd-fund-hero" aria-label={`${definition.name} value`}>
          <div><span>{terms.kind === "autocall" ? "Value per note / USD" : "NAV per share / USD"}</span><strong>{nav ? formatUsdMicros(nav, terms.kind === "autocall" ? 2 : 4) : "—"}</strong><small>{check.record ? `Recorded ${shortTime(check.record.effectiveAt)}` : "Waiting for a verified record"}</small></div>
          <div className="gmd-fund-hero-side"><OkxSource>Priced by OKX OnchainOS</OkxSource>{txUrl(fund?.nav?.txHash) && <a className="gmd-inline-tx" href={txUrl(fund?.nav?.txHash)!} target="_blank" rel="noreferrer">Recorded on X Layer<Icon name="external" size={12} /><span className="gmd-sr-only"> (opens in a new tab)</span></a>}</div>
          {terms.kind === "covered-call" && <NavLine series={fund?.series ?? []} label={`${definition.name} NAV over the last seven days`} />}
        </section>
        <section className={`gmd-evidence-summary is-${check.result === "matched" ? "matched" : check.result === "failed" ? "failed" : "waiting"}`} aria-live="polite">
          <div className="gmd-evidence-icon"><Icon name={check.result === "matched" ? "check" : "info"} size={24} /></div>
          <div><h2>{{ matched: "Value verified on X Layer", failed: "This value could not be verified", unavailable: "Verification unavailable", checking: "Checking the latest record…" }[check.result]}</h2><p>{check.detail}</p></div>
        </section>
        {call && <section className="gmd-income-section" aria-labelledby="call-title">
          <header className="gmd-section-heading"><div><h2 id="call-title">This month&rsquo;s call</h2><p>The fund holds {call.underlying.symbol} and has sold one call on it, until {day(call.call.expiresAt)}.</p></div><span className="gmd-fund-asset"><AssetMark symbol={call.underlying.symbol} /></span></header>
          <div className="gmd-pools-summary-stats gmd-income-tiles">
            <Tile label={`${call.underlying.symbol} price`} value={money(call.underlying.price)} note={`Recorded ${shortTime(call.asOf)}`} />
            <Tile label="Strike" value={money(call.call.strike)} note={`${signed(call.call.strike / call.underlying.price - 1)} from the price now`} />
            <Tile label="Premium this month" value={pct(premiumYield(call).month, 2)} note={`About ${pct(premiumYield(call).annualized)} a year if every month paid the same`} />
            <Tile label="Expires" value={day(call.call.expiresAt)} note={`${Math.max(0, Math.ceil((Date.parse(call.call.expiresAt) - Date.parse(call.asOf)) / 86_400_000))} days left · ${call.rolls} ${call.rolls === 1 ? "roll" : "rolls"} so far`} />
          </div>
          <CoveredCallPayoff document={call} />
        </section>}
        {note && terms.kind === "autocall" && <section className="gmd-income-section" aria-labelledby="note-title">
          <header className="gmd-section-heading"><div><h2 id="note-title">Where the note stands</h2><p>Started on {day(note.state.fixedAt)} at {terms.underlyings.map(symbol => `${symbol} ${money(note.state.initial[symbol])}`).join(" and ")}.</p></div><span className="gmd-fund-asset">{terms.underlyings.map(symbol => <AssetMark key={symbol} symbol={symbol} />)}</span></header>
          <div className="gmd-pools-summary-stats gmd-income-tiles">
            {terms.underlyings.map(symbol => <Tile key={symbol} label={`${symbol} vs start`} value={pct(note.performance[symbol])} note={money(note.prices[symbol])} />)}
            <Tile label="Knock-in" value={note.state.knockedIn ? "Hit" : "Not hit"} note={note.state.knockedIn ? `On ${day(note.state.knockedInAt!)}` : `The worse index is ${pct(note.worst - terms.knockIn)} above ${pct(terms.knockIn, 0)}`} />
            <Tile label={note.state.status === "live" ? "Next observation" : note.state.status === "called" ? "Called" : "Matured"} value={note.nextObservation ? day(note.nextObservation.date) : money(note.state.payout ?? 0)} note={note.nextObservation ? `Pays ${money(note.nextObservation.payIfCalled)} if at or above ${pct(note.nextObservation.barrier, 0)}` : "Paid to holders' demo balances"} />
          </div>
          <AutocallPath document={note} terms={terms} />
          <div className="gmd-data-table-scroll"><table className="gmd-table"><caption className="gmd-sr-only">Observation schedule</caption><thead><tr><th>Observation</th><th>Date</th><th>Barrier</th><th>Pays per $100 if called</th><th>Result</th></tr></thead><tbody>
            {terms.barriers.map((barrier, index) => { const seen = note.state.observations[index]; return <tr key={index}><th scope="row">{index + 1}</th><td>{day(observationDate(terms, note.state.fixedAt, index + 1))}</td><td>{pct(barrier, 0)}</td><td>{money(couponPayout(terms, index + 1))}</td><td>{seen ? (seen.called ? `Called at ${pct(seen.worst)}` : `Not called (${pct(seen.worst)})`) : "—"}</td></tr>; })}
          </tbody></table></div>
        </section>}
        {terms.kind === "autocall" && <section className="gmd-income-section" aria-label="Payoff"><AutocallPayoff terms={terms} /></section>}
        {!latest && <p className="gmd-caption">The first record is written within five minutes of the product&rsquo;s launch{terms.kind === "autocall" ? ", and fixes the note’s starting levels" : ""}.</p>}
        <IncomeAsk definition={definition} />
        <section className="gmd-terms"><h2>How {definition.ticker} works</h2><dl className="gmd-facts">
          {terms.kind === "covered-call" ? <CoveredCallFacts terms={terms} /> : <AutocallFacts terms={terms} />}
          <div><dt>Records</dt><dd>Value and its document published on X Layer Testnet every five minutes; your browser recomputes the value from the document</dd></div>
          <div><dt>Investors</dt><dd>{fund ? `${fund.demo.investors} demo ${fund.demo.investors === 1 ? "balance" : "balances"}` : "—"}</dd></div>
        </dl><p className="gmd-caption">A demo product on X Layer Testnet, bought with demo dollars that have no value. It is not an offer, a security or investment advice.</p></section>
      </div>
      <FundOrder key={id} fund={definition} nav={nav} account={account} buyOnly={terms.kind === "autocall"} closed={closed} />
    </div>
  </>;
}

function CoveredCallFacts({ terms }: { terms: CoveredCallTerms }) {
  return <>
    <div><dt>Holds</dt><dd>{terms.underlying}, the {terms.underlying === "SPYx" ? "S&P 500" : "Nasdaq-100"} ETF xStock, priced by OKX OnchainOS</dd></div>
    <div><dt>Each month</dt><dd>Sells a {terms.tenorDays}-day call {pct(terms.moneyness, 0)} above the price and keeps the premium; at expiry the call settles in cash and everything goes back into the ETF</dd></div>
    <div><dt>Option pricing</dt><dd>Black–Scholes at {pct(terms.volatility, 0)} volatility and a {pct(terms.rate, 0)} rate, marked at every record. There is no options market for xStocks on X Layer, so the fund writes the call in the model</dd></div>
    <div><dt>Like</dt><dd>Covered-call ETFs on the same indices, such as XYLD and QYLD, and Cboe&rsquo;s BXM buy-write index</dd></div>
    <div><dt>Orders</dt><dd>Buy and redeem at the latest NAV with your demo balance, no fee</dd></div>
  </>;
}

function AutocallFacts({ terms }: { terms: AutocallTerms }) {
  return <>
    <div><dt>Underlyings</dt><dd>The worse of {terms.underlyings.join(" and ")} against their starting levels</dd></div>
    <div><dt>Term</dt><dd>Three years, observed every {terms.observationMonths} months</dd></div>
    <div><dt>Early repayment</dt><dd>Barriers {terms.barriers.map(b => pct(b, 0)).join(" · ")}; called at face plus {pct(terms.couponPerYear * terms.observationMonths / 12)} per half-year ({pct(terms.couponPerYear, 0)} a year)</dd></div>
    <div><dt>Knock-in</dt><dd>{pct(terms.knockIn, 0)} of the starting level, checked at every record; only then is capital at risk at maturity</dd></div>
    <div><dt>Orders</dt><dd>Subscribe at ${terms.face} a note with your demo balance for {terms.subscriptionDays} days after the starting levels are fixed. Not sold back early: it pays automatically when called or at maturity</dd></div>
    <div><dt>Like</dt><dd>Korean step-down ELS on two indices; here it pays from recorded prices and nothing hedges it</dd></div>
  </>;
}

/** The income and structured products on Markets, as cards. */
export function IncomeShowcase({ kinds }: { kinds: ("covered-call" | "autocall")[] }) {
  const { data } = useFundResource<{ funds: FundSummary[] }>("/api/v1/funds");
  const products = INCOME_FUNDS.filter(item => kinds.includes(item.kind as "covered-call" | "autocall"));
  return <section className="gmd-income-showcase" aria-label="Income and structured products">
    {products.map(product => {
      const summary = data?.funds.find(item => item.id === product.id);
      const terms = INCOME_TERMS[product.id];
      return <Link prefetch={false} key={product.id} href={product.href} className="gmd-income-card">
        <span className="gmd-ticker">{product.ticker} <span>{KIND_LABELS[product.kind ?? "basket"]}</span></span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="gmd-income-card-marks" aria-hidden="true">{product.constituents.map(symbol => <AssetMark key={symbol} symbol={symbol} />)}</div>
        <dl>
          <div><dt>{terms.kind === "autocall" ? "Value per note" : "NAV"}</dt><dd>{summary?.nav ? formatUsdMicros(summary.nav.perShareMicros, 2) : "First record soon"}</dd></div>
          {terms.kind === "covered-call" ? <div><dt>Call</dt><dd>{pct(terms.moneyness, 0)} above · {terms.tenorDays} days</dd></div> : <div><dt>Coupon</dt><dd>{pct(terms.couponPerYear, 0)} a year · knock-in {pct(terms.knockIn, 0)}</dd></div>}
        </dl>
        <span className="gmd-income-card-go">View <Icon name="arrow" size={16} /></span>
      </Link>;
    })}
  </section>;
}
