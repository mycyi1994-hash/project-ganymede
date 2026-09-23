"use client";

import { useCallback, useEffect, useState } from "react";
import SiteHeader from "../SiteHeader";

type Holding = {
  symbol: string;
  address: string;
  weightBps: number;
  unitsWad: string;
  priceMicros: string;
  valueMicros: string;
  priceTime: string;
  priceSource: string;
};

type Composition = {
  productId: string;
  asOf: string;
  pricingChainIndex: string;
  basketFixedAt: string;
  navPerShareMicros: string;
  holdings: Holding[];
};

type Publication = {
  asOf: string;
  navPerShareMicros: string;
  holdingsHash: string;
  canonical: string;
  status: string;
  txHash: string | null;
  error: string | null;
};

type ProofResponse = {
  product: { id: string; ticker: string; name: string; benchmark: string; methodology: string; inceptionNavMicros: string };
  pricing: { chainIndex: string; name: string; explorerUrl: string; constituents: Array<{ symbol: string; underlying: string; name: string; address: string | null }> };
  registry: { chain: string; chainName: string; chainId: number; explorerUrl: string; address: string | null };
  latest: {
    evaluatedAt: string;
    status: "awaiting_configuration" | "awaiting_prices" | "priced";
    blockers: string[];
    warnings: string[];
    composition: Composition | null;
    canonical: string | null;
    holdingsHash: string | null;
    publication: Publication | null;
  } | null;
  history: Publication[];
  onchain: { navPerShareMicros: string; sharesOutstandingMicros: string; holdingsHash: string; effectiveAt: string | null; publishedAt: string | null } | null;
  onchainError: string | null;
};

type Check = { state: "pass" | "fail" | "pending"; detail: string };

const MICROS = 1_000_000n;
const WAD = 10n ** 18n;

function usd(micros: string | bigint, digits = 2): string {
  const value = BigInt(micros);
  const whole = value / MICROS;
  const fraction = (value % MICROS).toString().padStart(6, "0").slice(0, digits);
  return `$${whole.toLocaleString("en-US")}.${fraction}`;
}

function units(wad: string): string {
  const value = BigInt(wad);
  return `${(value / WAD).toString()}.${(value % WAD).toString().padStart(18, "0").slice(0, 6)}`;
}

function shortHash(hash: string | null | undefined): string {
  return hash ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : "—";
}

function time(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

const STATUS_LABEL: Record<string, string> = {
  priced: "LIVE PRICED",
  awaiting_prices: "AWAITING LIVE PRICES",
  awaiting_configuration: "AWAITING CONFIGURATION",
};

export default function ProofClient() {
  const [data, setData] = useState<ProofResponse | null>(null);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<{ source: ProofResponse; hash: Check; chain: Check; nav: Check } | null>(null);
  const checks = verification?.source === data ? verification : null;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/xstocks", { cache: "no-store" });
      if (!response.ok) throw new Error(`API ${response.status}`);
      setData(await response.json() as ProofResponse);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load proof data");
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(load, 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  // Verification runs in the browser: the server supplies documents, never verdicts.
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    (async () => {
      const onchain = data.onchain;
      const published = onchain ? [data.latest?.publication, ...data.history].find((entry) => entry?.holdingsHash === onchain.holdingsHash) ?? null : null;
      let hash: Check = { state: "pending", detail: "No on-chain publication to verify yet." };
      let chain: Check = { state: "pending", detail: data.onchainError ?? "Registry has no NAV for this product yet." };
      let nav: Check = { state: "pending", detail: "Waiting for an on-chain NAV." };

      if (onchain && onchain.effectiveAt) {
        chain = published
          ? { state: "pass", detail: `latestNav on ${data.registry.chainName} carries a holdings hash this page holds the document for.` }
          : { state: "fail", detail: "The registry's holdings hash matches none of the compositions this page holds." };
        if (published) {
          try {
            const computed = await sha256Hex(published.canonical);
            hash = computed === onchain.holdingsHash
              ? { state: "pass", detail: `sha256(composition) computed in your browser = ${shortHash(computed)}` }
              : { state: "fail", detail: `Browser computed ${shortHash(computed)}, chain holds ${shortHash(onchain.holdingsHash)}` };
            const documentNav = (JSON.parse(published.canonical) as Composition).navPerShareMicros;
            nav = documentNav === onchain.navPerShareMicros
              ? { state: "pass", detail: `On-chain NAV ${usd(onchain.navPerShareMicros, 6)} matches the NAV stated in the published document.` }
              : { state: "fail", detail: `On-chain NAV ${usd(onchain.navPerShareMicros, 6)} ≠ composition ${usd(documentNav, 6)}` };
          } catch {
            hash = { state: "fail", detail: "The published document could not be checked in this browser." };
            nav = { state: "fail", detail: "The document's NAV could not be read." };
          }
        }
      }
      if (!cancelled) setVerification({ source: data, hash, chain, nav });
    })();
    return () => { cancelled = true; };
  }, [data]);

  const verifiedCanonical = data?.onchain ? [data.latest?.publication, ...(data.history ?? [])].find((entry) => entry?.holdingsHash === data.onchain?.holdingsHash)?.canonical ?? null : null;
  const canonical = verifiedCanonical ?? data?.latest?.canonical ?? null;
  let publishedComposition: Composition | null = null;
  if (verifiedCanonical) {
    try { publishedComposition = JSON.parse(verifiedCanonical) as Composition; } catch { /* The failed check is shown above the document. */ }
  }
  const composition = publishedComposition ?? data?.latest?.composition ?? null;
  const record = data?.onchain?.effectiveAt ? data.onchain : null;
  const checkList = [
    { label: "On-chain record", check: checks?.chain, description: "A composition is available for this record." },
    { label: "Composition hash", check: checks?.hash, description: "The document matches the hash on chain." },
    { label: "NAV value", check: checks?.nav, description: "The recorded and documented NAV agree." },
  ];
  const passed = checkList.filter(({ check }) => check?.state === "pass").length;
  const summaryState = error || data?.onchainError ? "unavailable" : !data ? "loading" : !record ? "waiting" : !checks ? "checking" : checkList.some(({ check }) => check?.state === "fail") ? "fail" : passed === 3 ? "pass" : "waiting";
  const summaryText = { unavailable: "Data could not be refreshed.", loading: "Loading NAV evidence.", waiting: "Awaiting a published record.", checking: "Checking the published record.", fail: "The checks need attention.", pass: "NAV evidence matches." }[summaryState];
  let prettyDocument = canonical ?? "No composition yet.";
  if (canonical) { try { prettyDocument = JSON.stringify(JSON.parse(canonical), null, 2); } catch { /* Keep the original bytes inspectable. */ } }
  const status = data ? data.latest?.status ?? "awaiting_configuration" : error ? "unavailable" : "loading";
  const registryUrl = data?.registry.address ? `${data.registry.explorerUrl}/address/${data.registry.address}` : null;

  const copy = async () => {
    if (!canonical) return;
    try {
      await navigator.clipboard.writeText(canonical);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setCopyError("Copy was unavailable. Select the document text below to copy it manually.");
    }
  };

  return (
    <main className="product-detail-page ganymede-v4 proof-page">
      <SiteHeader current="proof" />

      <section className="proof-hero" aria-labelledby="proof-title">
        <div>
          <p className="proof-kicker">GMD USTX / NAV EVIDENCE / TESTNET</p>
          <h1 id="proof-title">Proof of NAV</h1>
          <p className="proof-lede">See the recorded value of the US tech basket, then inspect the evidence behind it. Three checks compare the published document with the on-chain record.</p>
        <div className={`proof-result-heading proof-result-${summaryState}`} aria-live="polite" aria-atomic="true">
          <div><span className="proof-result-eyebrow">BROWSER VERIFICATION</span><h2 id="proof-verify">{summaryText}</h2></div>
          <span className="proof-count">{summaryState === "pass" || summaryState === "fail" ? `${passed} / 3 CHECKS PASSED` : summaryState === "unavailable" ? "DATA UNAVAILABLE" : summaryState === "loading" ? "LOADING DATA" : summaryState === "waiting" ? "NOT YET VERIFIED" : "CHECKING…"}</span>
        </div>
        </div>
        <aside className="proof-record" aria-label="Last on-chain NAV">
          <span>LAST ON-CHAIN NAV / USD</span>
          <strong>{record ? usd(record.navPerShareMicros, 4) : "—"}</strong>
          <dl><div><dt>RECORD EFFECTIVE</dt><dd>{time(record?.effectiveAt)}</dd></div><div><dt>NETWORK</dt><dd>{data?.registry.chainName ?? "X Layer Testnet"}</dd></div></dl>
          <p>{data?.latest?.status === "awaiting_prices" ? "Latest prices are unavailable. Showing the last recorded NAV." : "One share in the model basket · evidence only"}</p>
        </aside>
      </section>

      <section className="proof-section proof-result" aria-label="Evidence checks">
        {error && <p className="proof-refresh-error" role="alert">{data ? "The latest refresh failed. The record shown is from the last successful load." : "NAV evidence could not be loaded."} <button type="button" onClick={() => void load()}>TRY AGAIN</button></p>}
        {data?.onchainError && <p className="proof-refresh-error">The on-chain record is currently unavailable.</p>}
        <ol className="proof-checks">{checkList.map(({ label, check, description }) => <li key={label} className={`proof-check proof-check-${check?.state ?? "pending"}`}><b aria-hidden="true">{check?.state === "pass" ? "✓" : check?.state === "fail" ? "!" : "…"}</b><div><strong>{label}</strong><p>{check?.state === "pass" ? description : check?.state === "fail" ? "Could not confirm a match. Open the details below." : "Waiting for evidence."}</p><span className="check-state-label">{check?.state === "pass" ? "MATCHED" : check?.state === "fail" ? "NEEDS ATTENTION" : "PENDING"}</span></div></li>)}</ol>
        <p className="proof-footnote">These checks establish document consistency. They do not verify custody, backing or investment safety.</p>
        <details className="detail-disclosure proof-check-details"><summary>Inspect the checks & registry <span aria-hidden="true">+</span></summary><div className="disclosure-content">
          {checkList.map(({ label, check }) => <p key={label}><strong>{label}</strong> — {check?.detail ?? "Waiting for evidence."}</p>)}
          <p>Registry {registryUrl ? <a href={registryUrl} target="_blank" rel="noreferrer">{data?.registry.address} ↗</a> : data ? "not configured" : error ? "unavailable" : "loading…"}</p>
          <p>Published {time(record?.publishedAt)} · Network {data?.registry.chainName ?? "—"}{data ? ` / ${data.registry.chainId}` : ""}</p>
        </div></details>
      </section>

      <section className="proof-section" aria-labelledby="proof-holdings">
        <header><div><span className="proof-result-eyebrow">{publishedComposition ? "PUBLISHED COMPOSITION" : "LATEST PRICED COMPOSITION"}</span><h2 id="proof-holdings">Inside the US tech basket.</h2></div><p>{composition ? `Priced ${time(composition.asOf)}` : error ? "Composition unavailable" : "Waiting for composition data"}</p></header>
        {composition && !publishedComposition && <p className="proof-footnote">This composition has not been matched to the on-chain record shown above.</p>}
        <div className="proof-table-wrap proof-simple-wrap"><table className="proof-table proof-simple-table"><thead><tr><th scope="col">Token</th><th scope="col">Weight at fixing</th><th scope="col">Value / share</th></tr></thead><tbody>
          {(composition?.holdings ?? []).map((holding) => <tr key={holding.symbol}><th scope="row"><span>{holding.symbol}</span><small>{data?.pricing.constituents.find((item) => item.symbol === holding.symbol)?.name}</small></th><td>{(holding.weightBps / 100).toFixed(2)}%</td><td>{usd(holding.valueMicros, 4)}</td></tr>)}
        </tbody></table>{!composition && <p className="proof-empty">{data ? "No priced composition is available yet." : error ? "Composition unavailable." : "Loading composition…"}</p>}</div>
        <p className="proof-footnote">Weights are set at fixing and can drift with prices. {composition ? `Basket fixed ${time(composition.basketFixedAt)}.` : ""}</p>
        <details className="detail-disclosure"><summary>Token addresses & pricing details <span aria-hidden="true">+</span></summary><div className="disclosure-content"><div className="proof-table-wrap"><table className="proof-table"><thead><tr><th scope="col">Token / address</th><th scope="col">Units / share</th><th scope="col">Price</th><th scope="col">Priced at</th></tr></thead><tbody>{(composition?.holdings ?? []).map((holding) => <tr key={holding.symbol}><th scope="row">{holding.symbol}<small><a href={`${data?.pricing.explorerUrl}/address/${holding.address}`} target="_blank" rel="noreferrer">{shortHash(holding.address)} ↗</a></small></th><td>{units(holding.unitsWad)}</td><td>{usd(holding.priceMicros, 4)}</td><td>{time(holding.priceTime)}</td></tr>)}</tbody></table></div>{data?.latest?.blockers && data.latest.blockers.length > 0 && <ul className="proof-blockers" aria-label="Why the latest NAV was not published">{data.latest.blockers.map((blocker) => <li key={blocker}>Not published: {blocker}</li>)}</ul>}<p className="proof-footnote">Latest pricing: {status === "loading" ? "LOADING DATA" : status === "unavailable" ? "DATA UNAVAILABLE" : STATUS_LABEL[status]} · {time(data?.latest?.evaluatedAt)}. Prices: OKX OnchainOS DEX, X Layer (chain {data?.pricing.chainIndex ?? "196"}).</p></div></details>
      </section>

      <section className="proof-section proof-supporting" aria-label="Supporting evidence">
        <details className="detail-disclosure"><summary><span>On-chain publications<small>{data ? `${data.history.length} recent records` : error ? "Publications unavailable" : "Loading publications…"}</small></span><span aria-hidden="true">+</span></summary><div className="disclosure-content">
          {data && data.history.length > 0 ? <div className="proof-table-wrap"><table className="proof-table"><thead><tr><th scope="col">Effective</th><th scope="col">NAV / share</th><th scope="col">Holdings hash</th><th scope="col">Status</th><th scope="col">Transaction</th></tr></thead><tbody>{data.history.map((entry) => <tr key={entry.asOf}><th scope="row">{time(entry.asOf)}</th><td>{usd(entry.navPerShareMicros, 4)}</td><td><code>{shortHash(entry.holdingsHash)}</code></td><td>{entry.status.toUpperCase()}</td><td>{entry.txHash ? <a href={`${data.registry.explorerUrl}/tx/${entry.txHash}`} target="_blank" rel="noreferrer">{shortHash(entry.txHash)} ↗</a> : entry.error ?? "—"}</td></tr>)}</tbody></table></div> : <p className="proof-empty">{data ? "No publications yet." : error ? "Publications unavailable." : "Loading publications…"}</p>}
        </div></details>
        <details className="detail-disclosure"><summary><span>The original document<small>Canonical JSON & independent hash check</small></span><span aria-hidden="true">+</span></summary><div className="disclosure-content">
          <div className="proof-document-toolbar"><p>Copy the exact bytes used for the hash. The preview below is formatted for reading.</p><button type="button" className="proof-copy" onClick={copy} disabled={!canonical}>{copied ? "COPIED" : "COPY JSON"}</button></div>
          <p className="proof-copy-status" role="status">{copyError || (copied ? "Canonical JSON copied." : "")}</p>
          <pre className="proof-json">{prettyDocument}</pre>
          <p className="proof-footnote">To check independently, save the copied text as composition.json, run <code>printf &apos;%s&apos; &quot;$(cat composition.json)&quot; | sha256sum</code>, and compare it with the registry’s <code>holdingsHash</code> for <code>keccak256(&quot;{data?.product.id ?? "us-tech-x"}&quot;)</code>.</p>
        </div></details>
      </section>

      <footer className="product-detail-footer"><span>GANYMEDE INDEX / {data?.product.ticker ?? "GMD USTX"}</span><p>Test environment. NAV evidence only; no fund shares are offered. xStocks are issued by Backed; Ganymede does not custody them.</p><span>{data ? `${data.registry.chainName.toUpperCase()} / ${data.registry.chainId}` : ""}</span></footer>
    </main>
  );
}
