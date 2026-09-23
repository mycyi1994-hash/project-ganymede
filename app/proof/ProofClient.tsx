"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import WalletConnect from "../WalletConnect";

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
  const [checks, setChecks] = useState<{ hash: Check; chain: Check; nav: Check } | null>(null);
  const [copied, setCopied] = useState(false);

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
          const computed = await sha256Hex(published.canonical);
          hash = computed === onchain.holdingsHash
            ? { state: "pass", detail: `sha256(composition) computed in your browser = ${shortHash(computed)}` }
            : { state: "fail", detail: `Browser computed ${shortHash(computed)}, chain holds ${shortHash(onchain.holdingsHash)}` };
          const documentNav = (JSON.parse(published.canonical) as Composition).navPerShareMicros;
          nav = documentNav === onchain.navPerShareMicros
            ? { state: "pass", detail: `On-chain NAV ${usd(onchain.navPerShareMicros, 6)} = Σ units × price in the composition` }
            : { state: "fail", detail: `On-chain NAV ${usd(onchain.navPerShareMicros, 6)} ≠ composition ${usd(documentNav, 6)}` };
        }
      }
      if (!cancelled) setChecks({ hash, chain, nav });
    })();
    return () => { cancelled = true; };
  }, [data]);

  const verifiedCanonical = data?.onchain ? [data.latest?.publication, ...(data.history ?? [])].find((entry) => entry?.holdingsHash === data.onchain?.holdingsHash)?.canonical ?? null : null;
  const canonical = verifiedCanonical ?? data?.latest?.canonical ?? null;
  // A pricing pass that did not publish keeps showing the composition the chain anchors, not a blank NAV.
  const composition = data?.latest?.composition ?? (verifiedCanonical ? JSON.parse(verifiedCanonical) as Composition : null);
  const showingPublished = Boolean(composition && !data?.latest?.composition);
  const status = data ? data.latest?.status ?? "awaiting_configuration" : error ? "unavailable" : "loading";
  const registryUrl = data?.registry.address ? `${data.registry.explorerUrl}/address/${data.registry.address}` : null;

  const copy = async () => {
    if (!canonical) return;
    try {
      await navigator.clipboard.writeText(canonical);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="product-detail-page ganymede-v4 proof-page">
      <header className="detail-topbar product-detail-topbar">
        <button type="button" className="detail-brand" onClick={() => window.location.assign("/")} aria-label="Ganymede Index overview"><span>G</span><strong>GANYMEDE INDEX<small>TOKENIZED-STOCK ETF OPERATIONS</small></strong></button>
        <nav className="detail-route-nav" aria-label="Product navigation"><Link href="/?app=select">ALL STRATEGIES</Link><a href="/proof" aria-current="page">PROOF OF NAV</a></nav>
        <WalletConnect compact />
      </header>

      <section className="proof-hero" aria-labelledby="proof-title">
        <div>
          <p className="proof-kicker">XSTOCKS ON X LAYER · NAV PUBLISHED ON CHAIN</p>
          <h1 id="proof-title">Proof of NAV</h1>
          <p className="proof-lede">{data?.product.name ?? "GANYMEDE US TECH x"}: an equal-weight basket of tokenized US mega-cap tech stocks. Every NAV is priced from live X Layer liquidity and anchored on chain as the sha256 of its full composition, so you can check it yourself below without trusting us.</p>
        </div>
        <dl className="proof-nav">
          <div><dt>NAV PER SHARE</dt><dd>{composition ? usd(composition.navPerShareMicros, 4) : "—"}</dd></div>
          <div><dt>STATUS</dt><dd className={`proof-status proof-status-${status}`}>{status === "loading" ? "LOADING DATA" : status === "unavailable" ? "DATA UNAVAILABLE" : STATUS_LABEL[status]}</dd></div>
          <div><dt>{showingPublished ? "LAST PUBLISHED" : "LAST PRICED"}</dt><dd>{time(showingPublished ? composition?.asOf : data?.latest?.evaluatedAt)}</dd></div>
          <div><dt>INCEPTION NAV</dt><dd>{data ? usd(data.product.inceptionNavMicros) : "—"}</dd></div>
        </dl>
      </section>

      {error && <p className="proof-alert" role="alert">Could not load proof data: {error}</p>}

      <section className="proof-section" aria-labelledby="proof-verify">
        <header><h2 id="proof-verify">Verify it yourself</h2><p>Checked in this browser against {data?.registry.chainName ?? "the registry"}{data ? ` (chain ${data.registry.chainId})` : ""}</p></header>
        <ol className="proof-checks">
          {([
            ["On-chain record", checks?.chain],
            ["Composition hash", checks?.hash],
            ["NAV arithmetic", checks?.nav],
          ] as const).map(([label, check]) => (
            <li key={label} className={`proof-check proof-check-${check?.state ?? "pending"}`}>
              <b aria-hidden="true">{check?.state === "pass" ? "✓" : check?.state === "fail" ? "✕" : "…"}</b>
              <div><strong>{label}</strong><p>{check?.detail ?? "Checking…"}</p></div>
            </li>
          ))}
        </ol>
        <p className="proof-footnote">
          Registry {registryUrl ? <a href={registryUrl} target="_blank" rel="noreferrer">{shortHash(data?.registry.address)} ↗</a> : data ? "not configured" : error ? "unavailable" : "loading…"}
          {data?.onchain?.effectiveAt && <> · latestNav effective {time(data.onchain.effectiveAt)} · published {time(data.onchain.publishedAt)}</>}
        </p>
      </section>

      <section className="proof-section" aria-labelledby="proof-holdings">
        <header><h2 id="proof-holdings">Composition</h2><p>{composition ? `Units fixed ${time(composition.basketFixedAt)} · re-fixed quarterly at the prevailing NAV` : data?.product.methodology}</p></header>
        <div className="proof-table-wrap">
          <table className="proof-table">
            <thead><tr><th scope="col">Token</th><th scope="col">Weight at fixing</th><th scope="col">Units / share</th><th scope="col">{showingPublished ? "Price at publication" : "Live price"}</th><th scope="col">Value / share</th><th scope="col">Priced at</th></tr></thead>
            <tbody>
              {(composition?.holdings ?? data?.pricing.constituents.map((constituent) => ({ symbol: constituent.symbol, address: constituent.address ?? "", weightBps: 0, unitsWad: "0", priceMicros: "0", valueMicros: "0", priceTime: "", priceSource: "" })) ?? []).map((holding) => {
                const constituent = data?.pricing.constituents.find((candidate) => candidate.symbol === holding.symbol);
                return (
                  <tr key={holding.symbol}>
                    <th scope="row">
                      <span>{holding.symbol}</span>
                      <small>{constituent?.name ?? ""}{holding.address ? <> · <a href={`${data?.pricing.explorerUrl}/address/${holding.address}`} target="_blank" rel="noreferrer">{shortHash(holding.address)} ↗</a></> : " · address not configured"}</small>
                    </th>
                    <td>{holding.weightBps ? `${(holding.weightBps / 100).toFixed(2)}%` : "—"}</td>
                    <td>{holding.unitsWad !== "0" ? units(holding.unitsWad) : "—"}</td>
                    <td>{holding.priceMicros !== "0" ? usd(holding.priceMicros, 4) : "—"}</td>
                    <td>{holding.valueMicros !== "0" ? usd(holding.valueMicros, 4) : "—"}</td>
                    <td>{holding.priceTime ? time(holding.priceTime) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {showingPublished && <p className="proof-footnote">Showing the composition behind the NAV on chain, published {time(composition?.asOf)}. The latest pricing pass at {time(data?.latest?.evaluatedAt)} did not publish.</p>}
        {data?.latest?.blockers && data.latest.blockers.length > 0 && (
          <ul className="proof-blockers" aria-label="Why the latest NAV was not published">
            {data.latest.blockers.map((blocker) => <li key={blocker}>Not published: {blocker}</li>)}
          </ul>
        )}
        <p className="proof-footnote">Prices: OKX OnchainOS DEX market price, X Layer (chainIndex {data?.pricing.chainIndex ?? "196"}). A NAV is published only when every constituent is priced in the same pass; there is no fallback to reference prices.</p>
      </section>

      <section className="proof-section" aria-labelledby="proof-history">
        <header><h2 id="proof-history">On-chain publications</h2><p>Most recent first</p></header>
        {data && data.history.length > 0 ? (
          <div className="proof-table-wrap">
            <table className="proof-table">
              <thead><tr><th scope="col">Effective</th><th scope="col">NAV / share</th><th scope="col">Holdings hash</th><th scope="col">Status</th><th scope="col">Transaction</th></tr></thead>
              <tbody>
                {data.history.map((entry) => (
                  <tr key={entry.asOf}>
                    <th scope="row">{time(entry.asOf)}</th>
                    <td>{usd(entry.navPerShareMicros, 4)}</td>
                    <td><code>{shortHash(entry.holdingsHash)}</code></td>
                    <td>{entry.status.toUpperCase()}</td>
                    <td>{entry.txHash ? <a href={`${data.registry.explorerUrl}/tx/${entry.txHash}`} target="_blank" rel="noreferrer">{shortHash(entry.txHash)} ↗</a> : entry.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="proof-empty">{data ? "No publications yet." : error ? "Publications unavailable." : "Loading publications…"}</p>}
      </section>

      <section className="proof-section" aria-labelledby="proof-document">
        <header><h2 id="proof-document">The document behind the hash</h2><button type="button" className="proof-copy" onClick={copy} disabled={!canonical}>{copied ? "COPIED" : "COPY JSON"}</button></header>
        <p className="proof-footnote">COPY JSON copies the exact canonical bytes that were hashed (the view below is pretty-printed for reading). Paste them into a file, run <code>printf &apos;%s&apos; &quot;$(cat composition.json)&quot; | sha256sum</code>, and compare the result with <code>holdingsHash</code> from <code>GanymedeNavRegistry.latestNav(keccak256(&quot;{data?.product.id ?? "us-tech-x"}&quot;))</code>.</p>
        <pre className="proof-json">{canonical ? JSON.stringify(JSON.parse(canonical), null, 2) : "No composition yet."}</pre>
      </section>

      <footer className="product-detail-footer"><span>GANYMEDE INDEX / {data?.product.ticker ?? "GMD USTX"}</span><p>Test environment. NAV evidence only; no fund shares are offered. xStocks are issued by Backed; Ganymede does not custody them.</p><span>{data ? `${data.registry.chainName.toUpperCase()} / ${data.registry.chainId}` : ""}</span></footer>
    </main>
  );
}
