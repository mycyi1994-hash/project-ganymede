"use client";

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import MiniAsciiCelestial from "../../MiniAsciiCelestial";
import WalletConnect from "../../WalletConnect";
import { DEFAULT_SETTLEMENT_CHAIN } from "@/lib/chains";
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
  targets: Array<{ symbol: string; target_weight_bps: number; rationale: string; effective_at: string }>;
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

function formatWeight(value: number) {
  return Number(value.toFixed(2)).toString();
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
  { id: "performance", label: "MODEL RESULTS" },
  { id: "holdings", label: "HOLDINGS" },
  { id: "methodology", label: "HOW IT WORKS" },
  { id: "documents", label: "RISKS & DOCUMENTS" },
];

const shades = ["#eeede8", "#aaa9a4", "#85847f", "#64635f", "#4d4c49", "#393936"];

const assetMetadata: Record<string, { name: string; assetClass: string }> = {
  BTC: { name: "Bitcoin", assetClass: "Store of Value" },
  ETH: { name: "Ethereum", assetClass: "Smart Contract" },
  XRP: { name: "XRP", assetClass: "Payments" },
  SOL: { name: "Solana", assetClass: "Smart Contract" },
  DOGE: { name: "Dogecoin", assetClass: "Payments" },
  ADA: { name: "Cardano", assetClass: "Smart Contract" },
  TRX: { name: "TRON", assetClass: "Payments" },
  AVAX: { name: "Avalanche", assetClass: "Smart Contract" },
  LINK: { name: "Chainlink", assetClass: "Infrastructure" },
  DOT: { name: "Polkadot", assetClass: "Interoperability" },
  SUI: { name: "Sui", assetClass: "Smart Contract" },
  NEAR: { name: "NEAR Protocol", assetClass: "Smart Contract" },
  APT: { name: "Aptos", assetClass: "Smart Contract" },
  ETC: { name: "Ethereum Classic", assetClass: "Smart Contract" },
  CASH: { name: "Fund Cash Buffer", assetClass: "Cash" },
};

function AssetMark({ asset }: { asset: BasketAsset }) {
  return <span className={`detail-asset-mark mark-${asset.iconKey}`} aria-hidden="true">{asset.ticker.slice(0, 1)}</span>;
}

function ProductTabs({ active, onChange }: { active: ProductTab; onChange: (tab: ProductTab) => void }) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, current: ProductTab) => {
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

function useLocalDialogFocus(onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    getFocusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);
  return dialogRef;
}

function SimulationReviewDialog({ etf, amountKrw, nav, submitting, error, onCancel, onConfirm }: {
  etf: Etf;
  amountKrw: string;
  nav: string;
  submitting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const copyId = useId();
  const dialogRef = useLocalDialogFocus(onCancel);
  const navValue = asNumber(nav) / 1_000_000 || asNumber(etf.nav.replace("$", ""));
  const estimatedShares = navValue > 0 ? asNumber(amountKrw) / navValue : 0;
  return (
    <div className="confirm-backdrop simulation-review-backdrop" role="presentation" onMouseDown={(event) => { if (!submitting && event.currentTarget === event.target) onCancel(); }}>
      <section ref={dialogRef} className="simulation-review-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={copyId} aria-busy={submitting}>
        <span>STEP 02 / REVIEW ESTIMATE</span>
        <h2 id={titleId}>Review your paper allocation.</h2>
        <p id={copyId}>You are simulating {formatKrw(amountKrw)} in {etf.ticker}. No order will be placed and no funds will be transferred.</p>
        <dl><div><dt>STRATEGY</dt><dd>{etf.name}</dd></div><div><dt>SAMPLE AMOUNT</dt><dd>{formatKrw(amountKrw)}</dd></div><div><dt>INDICATIVE VALUE / SHARE</dt><dd>{formatNav(nav, etf.nav)}</dd></div><div><dt>ESTIMATED PAPER SHARES</dt><dd>{estimatedShares.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</dd></div><div><dt>ANNUAL MANAGEMENT FEE</dt><dd>{etf.fee}</dd></div></dl>
        <div className="simulation-review-warning"><i /> TEST ENVIRONMENT · NO ECONOMIC ASSET IS ISSUED ON {DEFAULT_SETTLEMENT_CHAIN.label}</div>
        {error && <p className="simulation-review-error" role="alert">{error}</p>}
        <footer><button type="button" disabled={submitting} onClick={onCancel}>EDIT AMOUNT</button><button type="button" className="is-primary" disabled={submitting} aria-busy={submitting} onClick={onConfirm}>{submitting ? "SAVING SIMULATION…" : "SAVE TO PAPER PORTFOLIO"}</button></footer>
      </section>
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
  const amountHelpId = useId();
  const amountErrorId = useId();
  const amountError = !amountKrw ? "Enter a sample amount to continue." : asNumber(amountKrw) < 100_000 ? "Enter at least ₩100,000 to continue." : "";
  return (
    <div className="product-overview-panel">
      <div className="product-overview-main">
        <article className="product-information-card objective-card">
          <span>INVESTMENT OBJECTIVE</span>
          <h3>What this strategy is designed to do</h3>
          <p>{etf.description}</p>
          <div className="objective-points">
            <div><b>RULES-BASED</b><p>Transparent selection and weighting methodology.</p></div>
            <div><b>DIVERSIFIED</b><p>{liveProduct?.targets?.length || etf.assetCount} eligible assets across the strategy universe.</p></div>
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
            <div><dt>Minimum subscription</dt><dd>{etf.minimum}</dd></div>
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
            <li>Displayed performance may not include taxes, spreads or all execution costs.</li>
          </ul>
        </article>
      </div>

      <aside className="product-order-card" aria-label="ETF allocation simulation" aria-busy={submitting}>
        <div className="order-card-heading" tabIndex={-1}><span>ALLOCATION SIMULATOR</span><b>{engineMode === "live" ? "LIVE CONTROLLED" : "PAPER / TESTNET"}</b></div>
        <ol className="subscription-steps" aria-label="Simulation steps"><li className={!hasRequest ? "is-active" : ""}><b>01</b><span>CHOOSE AMOUNT</span></li><li><b>02</b><span>REVIEW ESTIMATE</span></li><li className={hasRequest ? "is-active" : ""}><b>03</b><span>SAVE SIMULATION</span></li></ol>
        <p>Try a sample amount using the latest indicative value. No real order is placed and no money moves.</p>
        <label className="subscription-amount">
          <span>SAMPLE AMOUNT / KRW</span>
          <input type="number" min="100000" step="100000" inputMode="numeric" value={amountKrw} onChange={(event) => onAmountChange(event.target.value)} aria-invalid={Boolean(amountError)} aria-describedby={`${amountHelpId}${amountError ? ` ${amountErrorId}` : ""}`} />
        </label>
        <p className="amount-help" id={amountHelpId}>Minimum ₩100,000 · this is a paper estimate only.</p>
        {amountError && <p className="amount-error" id={amountErrorId}>{amountError}</p>}
        <div className="amount-presets" aria-label="Quick amount selection"><button type="button" aria-pressed={amountKrw === "500000"} onClick={() => onAmountChange("500000")}>₩500,000</button><button type="button" aria-pressed={amountKrw === "1000000"} onClick={() => onAmountChange("1000000")}>₩1,000,000</button><button type="button" aria-pressed={amountKrw === "5000000"} onClick={() => onAmountChange("5000000")}>₩5,000,000</button></div>
        <dl>
          <div><dt>SAMPLE AMOUNT</dt><dd>{formatKrw(amountKrw)}</dd></div>
          <div><dt>{liveProduct?.nav ? "INDICATIVE VALUE / SHARE" : "REFERENCE VALUE / SHARE"}</dt><dd>{formatNav(liveProduct?.nav?.navPerShareMicros, etf.nav)}</dd></div>
          <div><dt>ESTIMATED PAPER SHARES</dt><dd>{estimatedShares.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</dd></div>
          <div><dt>ANNUAL MANAGEMENT FEE</dt><dd>{etf.fee}</dd></div>
        </dl>
        <div className="order-environment"><span><i /> SIMULATION ONLY</span><p>No economic asset is issued on {DEFAULT_SETTLEMENT_CHAIN.name}.</p></div>
        <button type="button" disabled={submitting || Boolean(amountError)} aria-busy={submitting} className={`product-add-button${hasRequest ? " is-added" : ""}`} onClick={onSubscribe}>{submitting ? "SAVING SIMULATION…" : hasRequest ? "VIEW PAPER PORTFOLIO" : "REVIEW SIMULATION"}</button>
        {subscriptionStatus && <div className="subscription-success" role="status"><b>SIMULATION SAVED.</b><p>No real order was placed. Review the allocation in your paper portfolio.</p></div>}
        {orderError && <p className="subscription-error" role="alert">{orderError}</p>}
        <WalletConnect />
        <small>Test wallet connection is optional. Share estimates can change with the next indicative valuation.</small>
      </aside>
    </div>
  );
}

function PerformancePanel({ etf }: { etf: Etf }) {
  const months = ["AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"];
  return (
    <div className="performance-panel">
      <div className="model-data-banner"><span>MODEL DATA</span><p>Illustrative strategy history · not an administrator-verified track record</p></div>
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

function HoldingsPanel({ etf, liveProduct }: { etf: Etf; liveProduct: LiveProduct | null }) {
  const liveBasket: BasketAsset[] = (liveProduct?.targets ?? []).map((target, index) => {
    const metadata = assetMetadata[target.symbol] ?? { name: target.symbol, assetClass: "Digital Asset" };
    return {
      rank: index + 1,
      ticker: target.symbol,
      name: metadata.name,
      weight: target.target_weight_bps / 100,
      assetClass: metadata.assetClass,
      description: target.rationale,
      iconKey: target.symbol.toLowerCase(),
    };
  });
  const targetWeightBps = (liveProduct?.targets ?? []).reduce((sum, target) => sum + target.target_weight_bps, 0);
  if (liveBasket.length && targetWeightBps < 10_000) {
    liveBasket.push({ rank: liveBasket.length + 1, ticker: "CASH", name: "Fund Cash Buffer", weight: (10_000 - targetWeightBps) / 100, assetClass: "Cash", description: "Mandate-level liquidity and operating cash buffer.", iconKey: "cash" });
  }
  const basket = liveBasket.length ? liveBasket : etf.basket;
  const stops = basket.map((asset, index) => {
    const start = basket.slice(0, index).reduce((sum, preceding) => sum + preceding.weight, 0);
    return `${shades[index % shades.length]} ${start}% ${start + asset.weight}%`;
  }).join(",");
  const maximum = Math.max(...basket.map((asset) => asset.weight));

  return (
    <div className="holdings-panel-v2">
      <div className="basket-visual-v2">
        <div className="allocation-donut" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={`${etf.name} basket allocation`}><span><b>100</b><small>% ALLOCATED</small></span></div>
        <div><span>BASKET COMPOSITION</span><h3>{basket.length} positions, 100% allocated</h3><p>{liveBasket.length ? "Latest engine-approved target allocation, including the mandate cash buffer." : `Holdings are reviewed at each ${etf.rebalanceFrequency.toLowerCase()} rebalance and may change without notice.`}</p></div>
      </div>
      <div className="holdings-table-v2" role="table" aria-label="ETF basket holdings">
        <div className="holding-row-v2 holding-head-v2" role="row"><span>#</span><span>ASSET</span><span>CLASS</span><span>ROLE</span><span>ALLOCATION</span><span>WEIGHT</span></div>
        {basket.map((asset) => (
          <div className="holding-row-v2" role="row" key={asset.ticker}>
            <span>{String(asset.rank).padStart(2, "0")}</span>
            <span className="holding-asset-v2"><AssetMark asset={asset} /><b>{asset.ticker}</b><small>{asset.name}</small></span>
            <span>{asset.assetClass}</span>
            <span>{asset.description}</span>
            <span className="holding-progress"><i><b style={{ width: `${asset.weight / maximum * 100}%` }} /></i></span>
            <span><b>{formatWeight(asset.weight)}%</b></span>
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
    ["PRODUCT SUMMARY", "Key product facts, objective, costs and risks", "DRAFT / PRE-LAUNCH"],
    ["INDEX METHODOLOGY", "Selection, weighting and rebalancing rules", "DRAFT / V2.1"],
    ["RISK DISCLOSURE", "Digital asset, liquidity, custody and testnet risks", "DRAFT / PRE-LAUNCH"],
    ["HOLDINGS REPORT", `Current ${etf.assetCount}-asset model basket composition`, "MODEL PORTFOLIO"],
  ];
  return (
    <div className="documents-panel">
      <section>
        <span>PRODUCT DOCUMENTS</span>
        <h3>Review before adding a strategy</h3>
        {documents.map(([name, description, version], index) => (
          <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{name}</b><p>{description}</p></div><small>{version}</small><button type="button" disabled title="Approved downloadable document not yet available">COMING SOON</button></article>
        ))}
      </section>
      <aside id="risk-disclosure">
        <span>IMPORTANT INFORMATION</span>
        <h3>Controlled product launch</h3>
        <p>The strategy, NAV, order, rebalance, investor and audit services are implemented as an operating system. Public offering remains disabled until the fund, custody, transfer-agent, venue and distribution approvals are configured.</p>
        <p>{DEFAULT_SETTLEMENT_CHAIN.name} is the current share-settlement rail. Testnet assets have no economic value and the relayer remains isolated from fund custody.</p>
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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [simulatorVisible, setSimulatorVisible] = useState(false);
  const totalWeight = useMemo(() => etf.basket.reduce((sum, asset) => sum + asset.weight, 0), [etf.basket]);
  const liveTargetWeightBps = (liveProduct?.targets ?? []).reduce((sum, target) => sum + target.target_weight_bps, 0);
  const livePositionCount = (liveProduct?.targets?.length ?? 0) + (liveTargetWeightBps > 0 && liveTargetWeightBps < 10_000 ? 1 : 0);

  const openSubscription = () => {
    setActiveTab("overview");
    window.setTimeout(() => {
      const simulator = document.querySelector<HTMLElement>(".product-order-card");
      if (!simulator) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      simulator.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      simulator.querySelector<HTMLElement>(".order-card-heading")?.focus({ preventScroll: true });
    }, 50);
  };

  const openMethodology = () => {
    setActiveTab("methodology");
    window.setTimeout(() => document.getElementById("product-tab-methodology")?.focus(), 0);
  };

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
      } catch {
        if (!cancelled) setOrderError("We couldn’t refresh the latest indicative data. Reference values are shown; no action is required.");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [etf.id]);

  useEffect(() => {
    const simulator = document.querySelector<HTMLElement>(".product-order-card");
    if (!simulator || activeTab !== "overview") {
      const reset = window.setTimeout(() => setSimulatorVisible(false), 0);
      return () => window.clearTimeout(reset);
    }
    const observer = new IntersectionObserver(([entry]) => setSimulatorVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(simulator);
    return () => observer.disconnect();
  }, [activeTab]);

  const subscribe = async (): Promise<boolean> => {
    if (subscriptionStatus) {
      window.location.assign("/?app=portfolio");
      return true;
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
      return true;
    } catch {
      setOrderError("Your simulation was not saved. No order was placed and no funds moved. Please try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={`product-detail-page ganymede-v4 product-${etf.id}`}>
      <header className="detail-topbar product-detail-topbar">
        <button type="button" className="detail-brand" onClick={() => window.location.assign("/")} aria-label="Ganymede Index overview"><span>G</span><strong>GANYMEDE INDEX<small>DIGITAL-ASSET STRATEGIES</small></strong></button>
        <p>ETF PRODUCTS <i>/</i> {etf.ticker}</p>
        <WalletConnect compact />
      </header>

      <div className="chain-testnet-notice"><span><i /> PRE-LAUNCH TEST ENVIRONMENT</span><p>{DEFAULT_SETTLEMENT_CHAIN.name} · Chain ID {DEFAULT_SETTLEMENT_CHAIN.chainId} · Simulated fund-share registry</p><a href={DEFAULT_SETTLEMENT_CHAIN.explorerUrl} target="_blank" rel="noreferrer">OPEN EXPLORER ↗</a></div>

      <section className="product-detail-hero" aria-labelledby="detail-product-name">
        <div className="product-detail-copy">
          <button className="detail-back" type="button" onClick={() => window.location.assign("/?app=select")}>← ALL ETF PRODUCTS</button>
          <span className="product-signature">{etf.signature}</span>
          <div className="product-detail-labels"><span>{etf.roleName} / {etf.ticker}</span><b className={`strategy-style-badge strategy-${etf.strategyStyle}`}>{etf.strategyStyle.toUpperCase()}</b><b className={`risk-badge risk-${etf.risk.toLowerCase()}`}>{etf.risk} RISK</b></div>
          <h1 id="detail-product-name">{etf.name}</h1>
          <h2>{etf.tagline}</h2>
          <p>{etf.description}</p>
          <div className="product-fit-strip"><div><span>WHY CHOOSE IT</span><p>{etf.whyChoose}</p></div><div><span>BEST FOR</span><p>{etf.bestFor}</p></div><div><span>MAY NOT SUIT</span><p>{etf.notFor}</p></div></div>
          <div className="product-hero-actions"><button type="button" onClick={subscriptionStatus ? () => window.location.assign("/?app=portfolio") : openSubscription}>{subscriptionStatus ? "VIEW PAPER PORTFOLIO" : "TRY A SAMPLE AMOUNT"}</button><button type="button" onClick={openMethodology}>SEE HOW IT WORKS</button></div>
          <dl className="product-hero-facts"><div><dt>FEE</dt><dd>{etf.fee}</dd></div><div><dt>RISK</dt><dd>{etf.risk}</dd></div><div><dt>REBALANCE</dt><dd>{etf.rebalanceFrequency}</dd></div></dl>
        </div>

        <div className="product-hero-visual" aria-label={`${etf.name} animated ASCII product planet`}><MiniAsciiCelestial variant={etf.visual} /></div>

        <aside className="product-market-data">
          <span>INDICATIVE FUND DATA / {liveProduct?.nav?.quality?.toUpperCase() ?? "INITIALIZING"}</span>
          <div className="product-nav"><small>INDICATIVE NAV</small><b>{formatNav(liveProduct?.nav?.navPerShareMicros, etf.nav)}</b><em>{liveProduct?.status?.toUpperCase() ?? "BOOTSTRAPPING"}</em></div>
          <p className="product-nav-time">AS OF {liveProduct?.nav?.asOf ? new Date(liveProduct.nav.asOf).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "AWAITING DATA"}</p>
          <dl><div><dt>FUND AUM</dt><dd>{liveProduct?.nav ? formatKrw(liveProduct.nav.netAssetValueKrw) : etf.aum}</dd></div><div><dt>MODEL 1Y</dt><dd>+{etf.oneYearReturn}</dd></div><div><dt>EXPENSE RATIO</dt><dd>{etf.fee}</dd></div><div><dt>BASKET</dt><dd>{liveProduct?.targets?.length ? `100% / ${livePositionCount}` : `${totalWeight}% / ${etf.assetCount}`}</dd></div></dl>
        </aside>
      </section>

      <ProductTabs active={activeTab} onChange={setActiveTab} />

      <section key={activeTab} id={`product-panel-${activeTab}`} role="tabpanel" aria-labelledby={`product-tab-${activeTab}`} className="product-tab-panel is-entering">
        {activeTab === "overview" && <OverviewPanel etf={etf} liveProduct={liveProduct} engineMode={engineMode} amountKrw={amountKrw} subscriptionStatus={subscriptionStatus} submitting={submitting} orderError={orderError} onAmountChange={(value) => { setAmountKrw(value); setOrderError(""); }} onSubscribe={subscriptionStatus ? () => { void subscribe(); } : () => setReviewOpen(true)} />}
        {activeTab === "performance" && <PerformancePanel etf={etf} />}
        {activeTab === "holdings" && <HoldingsPanel etf={etf} liveProduct={liveProduct} />}
        {activeTab === "methodology" && <MethodologyPanel etf={etf} />}
        {activeTab === "documents" && <DocumentsPanel etf={etf} />}
      </section>

      <button type="button" className={`mobile-allocation-cta${simulatorVisible ? " is-hidden" : ""}`} onClick={subscriptionStatus ? () => window.location.assign("/?app=portfolio") : openSubscription}><span>{subscriptionStatus ? "PAPER PORTFOLIO" : "REVIEW SAMPLE"}</span><b>{subscriptionStatus ? "VIEW SAVED ALLOCATION" : formatKrw(amountKrw)}</b></button>

      {reviewOpen && <SimulationReviewDialog etf={etf} amountKrw={amountKrw} nav={liveProduct?.nav?.navPerShareMicros ?? ""} submitting={submitting} error={orderError} onCancel={() => { if (!submitting) setReviewOpen(false); }} onConfirm={() => { void subscribe().then((saved) => { if (saved) setReviewOpen(false); }); }} />}

      <footer className="product-detail-footer"><span>GANYMEDE INDEX / {etf.ticker}</span><p>Subscriptions remain subject to KYC, approved offering documents, funding and operational acceptance.</p><span>{DEFAULT_SETTLEMENT_CHAIN.label} / {DEFAULT_SETTLEMENT_CHAIN.chainId}</span></footer>
    </main>
  );
}
