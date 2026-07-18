"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import MiniAsciiCelestial from "../../MiniAsciiCelestial";
import WalletConnect from "../../WalletConnect";
import type { BasketAsset, Etf } from "../../data/etfs";

type ProductTab = "overview" | "performance" | "holdings" | "methodology" | "documents";

type LiveProduct = {
  id: string;
  strategyStyle: "passive" | "active";
  status: string;
  nav: null | {
    navPerShareMicros: string;
    netAssetValueKrw: string;
    asOf: string;
    quality: string;
  };
  lastRebalance: null | { status?: string; completed_at?: string };
};

type MarketPayload = {
  products: LiveProduct[];
  lastCycle: null | { mode: "paper" | "live"; marketDataQuality: string; completedAt: string };
};

function asNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatKrw(value: string | number) {
  return `₩${asNumber(value).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`;
}

function formatNav(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return `₩${(asNumber(value) / 1_000_000).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function currentWalletAddress() {
  if (!window.ethereum) return null;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
    return accounts[0] ?? null;
  } catch {
    return null;
  }
}

const tabs: Array<{ id: ProductTab; label: string }> = [
  { id: "overview", label: "OVERVIEW" },
  { id: "performance", label: "PERFORMANCE" },
  { id: "holdings", label: "HOLDINGS" },
  { id: "methodology", label: "METHODOLOGY" },
  { id: "documents", label: "DOCUMENTS & RISKS" },
];

const shades = ["#eeede8", "#aaa9a4", "#85847f", "#64635f", "#4d4c49", "#393936"];

function AssetMark({ asset }: { asset: BasketAsset }) {
  return <span className={`detail-asset-mark mark-${asset.iconKey}`} aria-hidden="true">{asset.ticker.slice(0, 1)}</span>;
}

function ProductTabs({ active, onChange }: { active: ProductTab; onChange: (tab: ProductTab) => void }) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: ProductTab) => {
    if (!(event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End")) return;
    event.preventDefault();
    const currentIndex = tabs.findIndex((tab) => tab.id === current);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const next = tabs[nextIndex].id;
    onChange(next);
    requestAnimationFrame(() => document.getElementById(`product-tab-${next}`)?.focus());
  };

  return (
    <div className="product-tabs" role="tablist" aria-label="ETF product information">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`product-tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          aria-controls={`product-panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          className={active === tab.id ? "is-active" : ""}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, tab.id)}
        >{tab.label}</button>
      ))}
    </div>
  );
}

function OverviewPanel({ etf, liveProduct, engineMode, amountKrw, subscriptionStatus, submitting, orderError, onAmountChange, onSubscribe }: {
  etf: Etf;
  liveProduct: LiveProduct | null;
  engineMode: "paper" | "live";
  amountKrw: string;
  subscriptionStatus: string;
  submitting: boolean;
  orderError: string;
  onAmountChange: (value: string) => void;
  onSubscribe: () => void;
}) {
  const navPerShare = liveProduct?.nav ? asNumber(liveProduct.nav.navPerShareMicros) / 1_000_000 : asNumber(etf.nav.replace("$", ""));
  const estimatedShares = navPerShare > 0 ? asNumber(amountKrw) / navPerShare : 0;
  const hasRequest = Boolean(subscriptionStatus);
  return (
    <div className="product-overview-panel">
      <div className="product-overview-main">
        <article className="product-information-card objective-card">
          <span>INVESTMENT OBJECTIVE</span>
          <h3>What this strategy is designed to do</h3>
          <p>{etf.description}</p>
          <div className="objective-points">
            <div><b>RULES-BASED</b><p>Transparent selection and weighting methodology.</p></div>
            <div><b>DIVERSIFIED</b><p>{etf.assetCount} eligible assets across the strategy universe.</p></div>
            <div><b>REBALANCED</b><p>{etf.rebalanceFrequency.toLowerCase()} review and portfolio maintenance.</p></div>
          </div>
        </article>

        <article className="product-information-card product-facts-card">
          <span>PRODUCT FACTS</span>
          <dl>
            <div><dt>Benchmark</dt><dd>{etf.benchmark}</dd></div>
            <div><dt>Inception</dt><dd>{etf.inceptionDate}</dd></div>
            <div><dt>Domicile</dt><dd>{etf.domicile}</dd></div>
            <div><dt>Distribution</dt><dd>{etf.distribution}</dd></div>
            <div><dt>Minimum model position</dt><dd>{etf.minimum}</dd></div>
            <div><dt>Rebalance</dt><dd>{etf.rebalanceFrequency}</dd></div>
          </dl>
        </article>

        <article className="product-information-card risk-summary-card">
          <span>KEY RISKS</span>
          <h3>{etf.risk} risk classification</h3>
          <p>{etf.methodology.risk}</p>
          <ul>
            <li>Digital assets may experience extreme price volatility and liquidity gaps.</li>
            <li>Index methodology and constituent eligibility may change at rebalance.</li>
            <li>Model returns do not include taxes, spreads or execution costs.</li>
          </ul>
        </article>
      </div>

      <aside className="product-order-card" aria-label="ETF subscription order">
        <div className="order-card-heading"><span>SUBSCRIPTION</span><b>{engineMode === "live" ? "LIVE CONTROLLED" : "PAPER CONTROLLED"}</b></div>
        <p>Submit a primary-market fund-share subscription. KYC, cash funding, execution and GIWA settlement are tracked as separate controlled states.</p>
        <label className="subscription-amount">
          <span>SUBSCRIPTION AMOUNT / KRW</span>
          <input type="number" min="100000" step="100000" inputMode="numeric" value={amountKrw} onChange={(event) => onAmountChange(event.target.value)} aria-describedby="subscription-minimum" />
        </label>
        <dl>
          <div><dt>ORDER NOTIONAL</dt><dd>{formatKrw(amountKrw)}</dd></div>
          <div><dt>{liveProduct?.nav ? "LATEST NAV" : "REFERENCE NAV"}</dt><dd>{formatNav(liveProduct?.nav?.navPerShareMicros, etf.nav)}</dd></div>
          <div><dt>EST. FUND SHARES</dt><dd>{estimatedShares.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</dd></div>
          <div><dt>EXPENSE RATIO</dt><dd>{etf.fee}</dd></div>
        </dl>
        <button type="button" disabled={submitting || asNumber(amountKrw) < 100_000} className={`product-add-button${hasRequest ? " is-added" : ""}`} onClick={onSubscribe}>{submitting ? "SUBMITTING…" : hasRequest ? "VIEW SUBSCRIPTION" : "SUBSCRIBE"}</button>
        {subscriptionStatus && <p className="subscription-state" role="status">REQUEST STATUS <b>{subscriptionStatus.toUpperCase()}</b></p>}
        {orderError && <p className="subscription-error" role="alert">{orderError}</p>}
        <WalletConnect />
        <small id="subscription-minimum">Minimum ₩100,000. A wallet connection identifies the GIWA settlement account; it does not bypass KYC, funding approval or fund controls.</small>
      </aside>
    </div>
  );
}

function PerformancePanel({ etf }: { etf: Etf }) {
  const months = ["AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"];
  return (
    <div className="performance-panel">
      <dl className="performance-summary">
        <div><dt>YTD</dt><dd>+{etf.ytdReturn}</dd></div>
        <div><dt>1 YEAR</dt><dd>+{etf.oneYearReturn}</dd></div>
        <div><dt>SINCE INCEPTION</dt><dd>+{etf.sinceInceptionReturn}</dd></div>
        <div><dt>VOLATILITY</dt><dd>{etf.volatility}</dd></div>
        <div><dt>MAX DRAWDOWN</dt><dd>{etf.maxDrawdown}</dd></div>
      </dl>
      <article className="return-chart-card">
        <header><div><span>MONTHLY MODEL RETURNS</span><h3>Trailing 12 months</h3></div><p>Return %</p></header>
        <div className="return-chart" role="img" aria-label={`Monthly returns for ${etf.name}: ${etf.monthlyReturns.join(", ")} percent`}>
          {etf.monthlyReturns.map((value, index) => (
            <div className="return-column" key={months[index]}>
              <div className="return-bar-space"><i className={value >= 0 ? "is-positive" : "is-negative"} style={{ height: `${Math.abs(value) * 6 + 5}px` }} /></div>
              <b>{value > 0 ? "+" : ""}{value.toFixed(1)}</b>
              <span>{months[index]}</span>
            </div>
          ))}
        </div>
      </article>
      <div className="performance-disclosure"><span>i</span><p>Past or illustrative performance does not guarantee future results. Returns are shown before taxes and may not reflect actual tradability.</p></div>
    </div>
  );
}

function HoldingsPanel({ etf }: { etf: Etf }) {
  const stops = etf.basket.map((asset, index) => {
    const start = etf.basket.slice(0, index).reduce((sum, preceding) => sum + preceding.weight, 0);
    return `${shades[index % shades.length]} ${start}% ${start + asset.weight}%`;
  }).join(",");
  const maximum = Math.max(...etf.basket.map((asset) => asset.weight));

  return (
    <div className="holdings-panel-v2">
      <div className="basket-visual-v2">
        <div className="allocation-donut" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={`${etf.name} basket allocation`}><span><b>100</b><small>% ALLOCATED</small></span></div>
        <div><span>BASKET COMPOSITION</span><h3>{etf.assetCount} assets, 100% allocated</h3><p>Holdings are reviewed at each {etf.rebalanceFrequency.toLowerCase()} rebalance and may change without notice.</p></div>
      </div>
      <div className="holdings-table-v2" role="table" aria-label="ETF basket holdings">
        <div className="holding-row-v2 holding-head-v2" role="row"><span>#</span><span>ASSET</span><span>CLASS</span><span>ROLE</span><span>ALLOCATION</span><span>WEIGHT</span></div>
        {etf.basket.map((asset) => (
          <div className="holding-row-v2" role="row" key={asset.ticker}>
            <span>{String(asset.rank).padStart(2, "0")}</span>
            <span className="holding-asset-v2"><AssetMark asset={asset} /><b>{asset.ticker}</b><small>{asset.name}</small></span>
            <span>{asset.assetClass}</span>
            <span>{asset.description}</span>
            <span className="holding-progress"><i><b style={{ width: `${asset.weight / maximum * 100}%` }} /></i></span>
            <span><b>{asset.weight}%</b></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodologyPanel({ etf }: { etf: Etf }) {
  const items = [
    ["01", "SELECTION", etf.methodology.selection],
    ["02", "WEIGHTING", etf.methodology.weighting],
    ["03", "REBALANCING", etf.methodology.rebalance],
    ["04", "ELIGIBILITY", etf.methodology.eligibility],
    ["05", "POSITION LIMITS", etf.methodology.limits],
    ["06", "RISK CONTROLS", etf.methodology.risk],
  ];
  return <div className="methodology-panel-v2">{items.map(([number, label, copy]) => <article key={number}><span>{number}</span><div><b>{label}</b><p>{copy}</p></div></article>)}</div>;
}

function DocumentsPanel({ etf }: { etf: Etf }) {
  const documents = [
    ["PRODUCT SUMMARY", "Key product facts, objective, costs and risks", "UPDATED JUL 2026"],
    ["INDEX METHODOLOGY", "Selection, weighting and rebalancing rules", "VERSION 2.1"],
    ["RISK DISCLOSURE", "Digital asset, liquidity, custody and testnet risks", "UPDATED JUL 2026"],
    ["HOLDINGS REPORT", `Current ${etf.assetCount}-asset basket composition`, etf.lastRebalanced],
  ];
  return (
    <div className="documents-panel">
      <section>
        <span>PRODUCT DOCUMENTS</span>
        <h3>Review before adding a strategy</h3>
        {documents.map(([name, description, version], index) => (
          <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{name}</b><p>{description}</p></div><small>{version}</small><button type="button" onClick={() => window.print()}>PRINT / SAVE</button></article>
        ))}
      </section>
      <aside id="risk-disclosure">
        <span>IMPORTANT INFORMATION</span>
        <h3>Controlled product launch</h3>
        <p>The strategy, NAV, order, rebalance, investor and audit services are implemented as an operating system. Public offering remains disabled until the fund, custody, transfer-agent, venue and distribution approvals are configured.</p>
        <p>GIWA Sepolia is the current share-settlement rail. Testnet assets have no economic value and the relayer remains isolated from fund custody.</p>
        <p>Performance history shown in this interface is illustrative until an administrator-verified live track record is available. Review the approved prospectus before investing.</p>
      </aside>
    </div>
  );
}

export default function EtfDetailClient({ etf }: { etf: Etf }) {
  const [activeTab, setActiveTab] = useState<ProductTab>("overview");
  const [liveProduct, setLiveProduct] = useState<LiveProduct | null>(null);
  const [engineMode, setEngineMode] = useState<"paper" | "live">("paper");
  const [amountKrw, setAmountKrw] = useState("1000000");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const totalWeight = useMemo(() => etf.basket.reduce((sum, asset) => sum + asset.weight, 0), [etf.basket]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [marketResponse, walletAddress] = await Promise.all([fetch("/api/market", { cache: "no-store" }), currentWalletAddress()]);
        const market = await marketResponse.json() as MarketPayload & { error?: string };
        if (!marketResponse.ok) throw new Error(market.error || "Fund engine is unavailable");
        if (!cancelled) {
          setLiveProduct(market.products.find((product) => product.id === etf.id) ?? null);
          setEngineMode(market.lastCycle?.mode ?? "paper");
        }
        const portfolioResponse = await fetch("/api/portfolio", { cache: "no-store", headers: walletAddress ? { "x-ganymede-wallet": walletAddress } : undefined });
        if (!portfolioResponse.ok) return;
        const portfolio = await portfolioResponse.json() as { subscriptions?: Array<{ product_id?: string; productId?: string; status?: string }> };
        const latest = portfolio.subscriptions?.find((subscription) => (subscription.product_id ?? subscription.productId) === etf.id);
        if (!cancelled && latest?.status) setSubscriptionStatus(latest.status);
      } catch (error) {
        if (!cancelled) setOrderError(error instanceof Error ? error.message : "Fund engine is unavailable");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [etf.id]);

  const subscribe = async () => {
    if (subscriptionStatus) {
      window.location.assign("/?app=portfolio");
      return;
    }
    setSubmitting(true);
    setOrderError("");
    try {
      const walletAddress = await currentWalletAddress();
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(walletAddress ? { "x-ganymede-wallet": walletAddress } : {}) },
        body: JSON.stringify({ productId: etf.id, amountKrw, walletAddress, clientReference: crypto.randomUUID() }),
      });
      const payload = await response.json() as { subscription?: { status?: string }; error?: string };
      if (!response.ok) throw new Error(payload.error || "Subscription request failed");
      setSubscriptionStatus(payload.subscription?.status ?? "submitted");
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Subscription request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="product-detail-page">
      <header className="detail-topbar product-detail-topbar">
        <button type="button" className="detail-brand" onClick={() => window.location.assign("/")} aria-label="Ganymede Index overview"><span>G</span><strong>GANYMEDE INDEX<small>DIGITAL ASSET ETFs</small></strong></button>
        <p>ETF PRODUCTS <i>/</i> {etf.ticker}</p>
        <WalletConnect compact />
      </header>

      <div className="giwa-testnet-notice"><span><i /> GIWA SETTLEMENT RAIL</span><p>GIWA Sepolia · Chain ID 91342 · Permissioned fund-share registry</p><a href="https://sepolia-explorer.giwa.io" target="_blank" rel="noreferrer">OPEN EXPLORER ↗</a></div>

      <section className="product-detail-hero" aria-labelledby="detail-product-name">
        <div className="product-detail-copy">
          <button className="detail-back" type="button" onClick={() => window.location.assign("/?app=select")}>← ALL ETF PRODUCTS</button>
          <div className="product-detail-labels"><span>ETF / {etf.ticker}</span><b className={`strategy-style-badge strategy-${etf.strategyStyle}`}>{etf.strategyStyle.toUpperCase()}</b><b className={`risk-badge risk-${etf.risk.toLowerCase()}`}>{etf.risk} RISK</b></div>
          <h1 id="detail-product-name">{etf.name}</h1>
          <h2>{etf.tagline}</h2>
          <p>{etf.description}</p>
          <div className="product-hero-actions"><button type="button" onClick={() => setActiveTab("overview")}>{subscriptionStatus ? "VIEW SUBSCRIPTION" : "SUBSCRIBE"}</button><button type="button" onClick={() => setActiveTab("documents")}>REVIEW DOCUMENTS</button></div>
        </div>

        <div className="product-hero-visual" aria-label={`${etf.name} animated ASCII product planet`}><MiniAsciiCelestial variant={etf.visual} /></div>

        <aside className="product-market-data">
          <span>FUND DATA / {liveProduct?.nav?.quality?.toUpperCase() ?? "INITIALIZING"}</span>
          <div className="product-nav"><small>LATEST NAV</small><b>{formatNav(liveProduct?.nav?.navPerShareMicros, etf.nav)}</b><em>{liveProduct?.status?.toUpperCase() ?? "BOOTSTRAPPING"}</em></div>
          <dl><div><dt>FUND AUM</dt><dd>{liveProduct?.nav ? formatKrw(liveProduct.nav.netAssetValueKrw) : etf.aum}</dd></div><div><dt>1Y RETURN</dt><dd>+{etf.oneYearReturn}</dd></div><div><dt>EXPENSE RATIO</dt><dd>{etf.fee}</dd></div><div><dt>BASKET</dt><dd>{totalWeight}% / {etf.assetCount}</dd></div></dl>
        </aside>
      </section>

      <ProductTabs active={activeTab} onChange={setActiveTab} />

      <section id={`product-panel-${activeTab}`} role="tabpanel" aria-labelledby={`product-tab-${activeTab}`} className="product-tab-panel">
        {activeTab === "overview" && <OverviewPanel etf={etf} liveProduct={liveProduct} engineMode={engineMode} amountKrw={amountKrw} subscriptionStatus={subscriptionStatus} submitting={submitting} orderError={orderError} onAmountChange={setAmountKrw} onSubscribe={subscribe} />}
        {activeTab === "performance" && <PerformancePanel etf={etf} />}
        {activeTab === "holdings" && <HoldingsPanel etf={etf} />}
        {activeTab === "methodology" && <MethodologyPanel etf={etf} />}
        {activeTab === "documents" && <DocumentsPanel etf={etf} />}
      </section>

      <footer className="product-detail-footer"><span>GANYMEDE INDEX / {etf.ticker}</span><p>Subscriptions remain subject to KYC, approved offering documents, funding and operational acceptance.</p><span>GIWA SEPOLIA / 91342</span></footer>
    </main>
  );
}
