"use client";

import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import GanymedeScene from "./GanymedeScene";
import MiniAsciiCelestial from "./MiniAsciiCelestial";
import { DEFAULT_SETTLEMENT_CHAIN } from "@/lib/chains";
import WalletConnect from "./WalletConnect";
import { etfs, type Etf, type Filter } from "./data/etfs";

type View = "select" | "portfolio" | "operations";

type MarketProduct = {
  id: string;
  slug: string;
  ticker: string;
  name: string;
  strategyStyle: "passive" | "active";
  status: string;
  nav: null | {
    navPerShareMicros: string;
    netAssetValueKrw: string;
    sharesOutstandingMicros: string;
    asOf: string;
    quality: string;
  };
  targets: Array<{ symbol: string; target_weight_bps: number; rationale: string; effective_at: string }>;
  lastRebalance: null | Record<string, unknown>;
};

type MarketOverview = {
  products: MarketProduct[];
  lastCycle: null | {
    cycleId: string;
    mode: "paper" | "live";
    completedAt: string;
    marketDataQuality: "live" | "reference" | "mixed";
    ordersCreated: number;
    warnings: string[];
  };
  updatedAt: string | null;
};

type PortfolioPosition = {
  productId: string;
  slug: string;
  ticker: string;
  name: string;
  strategyStyle: "passive" | "active";
  sharesMicros: string;
  costBasisKrw: string;
  currentValueKrw: string;
  unrealizedPnlKrw: string;
  returnBps: number;
  navPerShareMicros: string;
  navAsOf: string;
};

type PortfolioData = {
  investor: null | { id: string; kycStatus: string; walletAddress: string | null };
  positions: PortfolioPosition[];
  subscriptions: Array<Record<string, unknown>>;
  redemptions: Array<Record<string, unknown>>;
};

type OperationsData = {
  actor?: string;
  error?: string;
  lastCycle: MarketOverview["lastCycle"];
  lastCycleAt: string | null;
  counts: {
    operational_products?: number;
    open_orders?: number;
    open_subscriptions?: number;
    open_redemptions?: number;
    pending_settlements?: number;
  };
  recentOrders: Array<Record<string, unknown>>;
  recentRebalances: Array<Record<string, unknown>>;
  recentSettlements: Array<Record<string, unknown>>;
};

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "ALL · 4" },
  { id: "passive", label: "PASSIVE · 2" },
  { id: "active", label: "ACTIVE · 2" },
];

const emptyPortfolio: PortfolioData = { investor: null, positions: [], subscriptions: [], redemptions: [] };

function asNumber(value: string | number | bigint | null | undefined): number {
  try {
    return Number(BigInt(value ?? 0));
  } catch {
    return 0;
  }
}

function formatKrw(value: string | number | bigint): string {
  return `₩${asNumber(value).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`;
}

function formatNav(value: string): string {
  return `₩${(asNumber(value) / 1_000_000).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShares(value: string): string {
  return (asNumber(value) / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function displayTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function currentWalletAddress(): Promise<string | null> {
  if (!window.ethereum) return null;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
    return accounts[0] ?? null;
  } catch {
    return null;
  }
}

function AsciiPlanet({ variant }: { variant: Etf["visual"] }) {
  return <div className={`ascii-planet ascii-planet-${variant}`} aria-hidden="true"><MiniAsciiCelestial variant={variant} /></div>;
}

function EtfCard({ etf, liveProduct, onOpen, onNavigate }: {
  etf: Etf;
  liveProduct?: MarketProduct;
  onOpen: (id: string) => void;
  onNavigate: (id: string, direction: number) => void;
}) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      onNavigate(etf.id, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      onNavigate(etf.id, -1);
    }
  };
  const allTargetHoldings = liveProduct?.targets?.length ? liveProduct.targets : etf.basket.map((holding) => ({ symbol: holding.ticker, target_weight_bps: holding.weight * 100 }));
  const targetHoldings = allTargetHoldings.slice(0, 3);
  return (
    <article className={`etf-card etf-product-card product-${etf.id}`}>
      <a id={`etf-card-${etf.id}`} className="etf-card-hit" href={`/etfs/${etf.slug}`} aria-label={`View ${etf.name}, ${etf.roleName}, ${etf.risk.toLowerCase()} risk, product details`} onClick={(event) => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(etf.id); }} onKeyDown={handleKeyDown} />
      <div className="product-card-index" aria-hidden="true"><span>{String(etfs.findIndex((candidate) => candidate.id === etf.id) + 1).padStart(2, "0")}</span><i /></div>
      <div className="etf-card-hero">
        <div className="etf-card-copy">
          <span className="product-role-name">{etf.roleName}</span>
          <div className="product-card-labels">
            <span className="etf-ticker">{etf.ticker}</span>
            <span className={`strategy-style-badge strategy-${etf.strategyStyle}`}>{etf.strategyStyle.toUpperCase()}</span>
            <span className={`risk-badge risk-${etf.risk.toLowerCase()}`} data-risk={etf.risk}>{etf.risk} RISK</span>
          </div>
          <h2>{etf.name}</h2>
          <p>{etf.tagline}</p>
          <div className="product-best-for"><span>BEST FOR</span><b>{etf.bestFor}</b></div>
          <small>{etf.strategyStyle === "passive" ? "RULES-BASED INDEX" : "SYSTEMATIC ACTIVE"} · {liveProduct?.targets?.length || etf.assetCount} ASSETS · {etf.rebalanceFrequency}</small>
        </div>
        <AsciiPlanet variant={etf.visual} />
      </div>
      <dl className="etf-metrics product-card-metrics">
        <div><dt>{liveProduct?.nav ? "INDICATIVE NAV" : "REFERENCE NAV"}</dt><dd>{liveProduct?.nav ? formatNav(liveProduct.nav.navPerShareMicros) : etf.nav}<small>{liveProduct?.nav?.quality?.toUpperCase() ?? "MODEL"}</small></dd></div>
        <div><dt>MODEL 1Y</dt><dd>+{etf.oneYearReturn}</dd></div>
        <div><dt>EXPENSE RATIO</dt><dd>{etf.fee}</dd></div>
        <div><dt>TARGET ASSETS</dt><dd>{liveProduct?.targets?.length || etf.assetCount}<small>{etf.rebalanceFrequency}</small></dd></div>
      </dl>
      <div className="etf-card-actions">
        <div className="holding-chips" aria-label="Top target holdings">
          {targetHoldings.map((holding) => <span key={holding.symbol}>{holding.symbol} <b>{(holding.target_weight_bps / 100).toFixed(1)}%</b></span>)}
          {allTargetHoldings.length > 3 && <span className="holding-more">+{allTargetHoldings.length - 3}</span>}
        </div>
        <span className="select-etf-button" aria-hidden="true">VIEW STRATEGY <span>↗</span></span>
      </div>
    </article>
  );
}

function AppNav({ view, onOverview, onViewChange }: { view: View; onOverview: () => void; onViewChange: (view: View) => void }) {
  return (
    <header className="app-topbar platform-topbar">
      <button className="app-identity" type="button" onClick={onOverview}><span>G</span><strong>GANYMEDE INDEX<small>DIGITAL-ASSET STRATEGIES</small></strong></button>
      <nav className="app-menu investor-menu" aria-label="Primary navigation">
        <button type="button" onClick={onOverview}>OVERVIEW</button>
        <button className={view === "select" ? "is-active" : ""} type="button" aria-current={view === "select" ? "page" : undefined} onClick={() => onViewChange("select")}>FUNDS</button>
        <button className={view === "portfolio" ? "is-active" : ""} type="button" aria-current={view === "portfolio" ? "page" : undefined} onClick={() => onViewChange("portfolio")}>MY PORTFOLIO</button>
      </nav>
      <div className="app-utility-zone"><WalletConnect compact /></div>
    </header>
  );
}

function PortfolioView({ data, loading, error, onBrowse, onRedeem, onOpen }: {
  data: PortfolioData;
  loading: boolean;
  error: string;
  onBrowse: () => void;
  onRedeem: (position: PortfolioPosition) => Promise<void>;
  onOpen: (position: PortfolioPosition) => void;
}) {
  if (loading) return <main className="portfolio-page portfolio-empty-page" aria-busy="true"><section className="portfolio-empty"><p className="section-kicker">PAPER PORTFOLIO / LOADING</p><h1>Preparing your simulated portfolio…</h1><p>We are applying the latest indicative values. No real funds are moving.</p></section></main>;
  if (!data.positions.length) {
    return (
      <main className="portfolio-page portfolio-empty-page">
        <section className="portfolio-empty">
          <p className="section-kicker">PAPER PORTFOLIO / {data.subscriptions.length ? "PREPARING" : "EMPTY"}</p>
          <h1>{data.subscriptions.length ? "We’re adding your simulated allocation." : "Your paper portfolio is empty."}</h1>
          <p>{error || (data.subscriptions.length ? "No real funds are moving. Your saved allocation will appear here when the paper ledger is ready." : "Choose a strategy and save a sample allocation to see how the funds could work together.")}</p>
          <button type="button" onClick={onBrowse}>CHOOSE A STRATEGY</button>
        </section>
      </main>
    );
  }

  const invested = data.positions.reduce((sum, position) => sum + asNumber(position.costBasisKrw), 0);
  const currentValue = data.positions.reduce((sum, position) => sum + asNumber(position.currentValueKrw), 0);
  const gain = currentValue - invested;
  const totalReturnBps = invested > 0 ? Math.round(gain / invested * 10_000) : 0;
  const best = [...data.positions].sort((a, b) => b.returnBps - a.returnBps)[0];

  return (
    <main className="portfolio-page holdings-portfolio-page">
      <header className="portfolio-header">
        <div><p className="section-kicker">PAPER PORTFOLIO / SIMULATED</p><h1>Your strategies, in one orbit.</h1><p>See how your selected strategies could work together. No real assets are held and no money has moved.</p></div>
        <div className="portfolio-header-actions"><span><i /> PAPER MODE</span><button type="button" className="is-primary" onClick={onBrowse}>ADD STRATEGY</button></div>
      </header>
      <section className="portfolio-constellation" aria-label="Portfolio performance overview">
        <div className="portfolio-constellation-copy"><span>MODEL RETURN · SINCE FIRST SIMULATION</span><strong>{gain >= 0 ? "+" : ""}{(totalReturnBps / 100).toFixed(2)}%</strong><p>Based on the latest indicative values, not investor-earned performance</p></div>
        <div className="portfolio-signal" aria-hidden="true"><i /><i /><i /><i /><span /></div>
        <span className="portfolio-period-label">SINCE FIRST SAVED ALLOCATION</span>
      </section>
      <dl className="portfolio-kpis">
        <div><dt>SIMULATED VALUE</dt><dd>{formatKrw(currentValue)}</dd><small>Sample amount {formatKrw(invested)}</small></div>
        <div><dt>MODEL RETURN</dt><dd className={gain >= 0 ? "positive-value" : ""}>{gain >= 0 ? "+" : ""}{(totalReturnBps / 100).toFixed(2)}%</dd><small>{gain >= 0 ? "+" : ""}{formatKrw(gain)} illustrative</small></div>
        <div><dt>STRATEGIES</dt><dd>{String(data.positions.length).padStart(2, "0")}</dd><small>Saved paper allocations</small></div>
        <div><dt>TOP MODEL CONTRIBUTOR</dt><dd>{best.ticker.replace("GMD ", "")}</dd><small>{best.returnBps >= 0 ? "+" : ""}{(best.returnBps / 100).toFixed(2)}%</small></div>
      </dl>
      <section className="portfolio-positions" aria-labelledby="positions-title">
        <header><div><p className="section-kicker">SAVED STRATEGIES</p><h2 id="positions-title">Paper allocations</h2></div><span>SIMULATED · INDICATIVE VALUES</span></header>
        <div className="position-table" role="table" aria-label="ETF fund share positions">
          <div className="position-row position-head" role="row"><span>PRODUCT</span><span>SHARES</span><span>COST BASIS</span><span>NAV VALUE / RETURN</span><span>STYLE</span><span>ACTION</span></div>
          {data.positions.map((position) => (
            <div className="position-row" role="row" key={position.productId}>
              <button type="button" className="position-product" onClick={() => onOpen(position)}><span className="position-orbit" aria-hidden="true"><i /></span><span><b>{position.ticker}</b><small>{position.name}</small></span></button>
              <span><b>{formatShares(position.sharesMicros)}</b><small>fund shares</small></span>
              <span><b>{formatKrw(position.costBasisKrw)}</b><small>settled cash</small></span>
              <span className="position-return"><b>{formatKrw(position.currentValueKrw)} · {position.returnBps >= 0 ? "+" : ""}{(position.returnBps / 100).toFixed(2)}%</b><i style={{ width: `${Math.min(100, Math.max(3, Math.abs(position.returnBps) / 30))}%` }} /></span>
              <span>{position.strategyStyle.toUpperCase()}</span>
              <button type="button" className="position-remove" onClick={() => onRedeem(position)} aria-label={`Remove ${position.name} from this simulation`}>REMOVE</button>
            </div>
          ))}
        </div>
        <footer><p>All values and returns are simulated. This is not a brokerage account, and connecting a {DEFAULT_SETTLEMENT_CHAIN.name} test wallet is optional.</p><WalletConnect /></footer>
      </section>
    </main>
  );
}

function OperationsView({ data, loading, error, onRun }: { data: OperationsData | null; loading: boolean; error: string; onRun: () => Promise<void> }) {
  const cycle = data?.lastCycle;
  const rows = data?.recentOrders ?? [];
  return (
    <main className="portfolio-page operations-page">
      <header className="portfolio-header operations-header">
        <div><p className="section-kicker">AUTHORIZED CONTROL ROOM / PAPER ENVIRONMENT</p><h1>Fund operations observatory</h1><p>Exception-first monitoring for strategy, NAV, rebalance, order, settlement and audit cycles.</p></div>
        <button type="button" className="portfolio-browse-button" disabled={loading} onClick={onRun}>{loading ? "RUNNING…" : "RUN CONTROLLED CYCLE"}</button>
      </header>
      <dl className="portfolio-kpis operations-kpis">
        <div><dt>ENGINE MODE</dt><dd>{cycle?.mode?.toUpperCase() ?? "PAPER"}</dd><small>{cycle?.marketDataQuality?.toUpperCase() ?? "WAITING FOR DATA"}</small></div>
        <div><dt>PRODUCTS</dt><dd>{String(data?.counts?.operational_products ?? 4).padStart(2, "0")}</dd><small>02 passive · 02 active</small></div>
        <div><dt>OPEN ORDERS</dt><dd>{String(data?.counts?.open_orders ?? 0).padStart(2, "0")}</dd><small>{cycle?.ordersCreated ?? 0} created last cycle</small></div>
        <div><dt>SETTLEMENT QUEUE</dt><dd>{String(data?.counts?.pending_settlements ?? 0).padStart(2, "0")}</dd><small>Mint · burn · NAV · rebalance</small></div>
      </dl>
      <section className="operations-workspace">
        <article className="operations-cycle-card">
          <span>LAST ENGINE CYCLE</span>
          <h2>{cycle ? "Cycle completed" : "Awaiting first cycle"}</h2>
          <dl>
            <div><dt>COMPLETED</dt><dd>{displayTime(cycle?.completedAt ?? data?.lastCycleAt)}</dd></div>
            <div><dt>STRATEGIES</dt><dd>{cycle ? "04 EVALUATED" : "—"}</dd></div>
            <div><dt>ORDERS</dt><dd>{cycle?.ordersCreated ?? 0}</dd></div>
            <div><dt>AUTHORITY</dt><dd>{data?.actor ?? "PRIVATE OPERATOR"}</dd></div>
          </dl>
          <p>{error || data?.error || cycle?.warnings?.[0] || "No engine warnings were recorded in the latest cycle."}</p>
        </article>
        <article className="operations-order-card">
          <header><div><span>RECENT VENUE ORDERS</span><h2>Execution ledger</h2></div><b>UPBIT</b></header>
          <div className="operations-order-table">
            <div className="operations-order-row is-head"><span>PRODUCT</span><span>ASSET</span><span>SIDE</span><span>NOTIONAL</span><span>STATE</span></div>
            {rows.length ? rows.slice(0, 8).map((row) => <div className="operations-order-row" key={String(row.id)}><span>{String(row.product_id)}</span><span>{String(row.symbol)}</span><span>{String(row.side).toUpperCase()}</span><span>{formatKrw(String(row.requested_notional_krw ?? 0))}</span><span>{String(row.status).toUpperCase()}</span></div>) : <p className="operations-empty-log">No orders recorded yet. The first approved rebalance will populate this ledger.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}

function useDialogFocus(onClose: () => void) {
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
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
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

function ChoiceGuide({ onClose, onOpen }: { onClose: () => void; onOpen: (id: string) => void }) {
  const titleId = useId();
  const copyId = useId();
  const dialogRef = useDialogFocus(onClose);
  const options = [
    ["core-20", "BUILD A CORE POSITION", "Start with GMD CORE", "A rules-based foundation for broad digital-asset exposure."],
    ["digital-income", "REDUCE VOLATILITY", "Start with GMD YIELD", "A lower-risk stabilizer designed for steadier participation."],
    ["tech-leaders", "TARGET INFRASTRUCTURE GROWTH", "Start with GMD TECH", "Focused exposure to networks building digital infrastructure."],
    ["next-frontier", "EXPLORE EMERGING NETWORKS", "Start with GMD ALPHA", "A higher-risk strategy for early-stage network growth."],
  ];
  return (
    <div className="confirm-backdrop choice-guide-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section ref={dialogRef} className="choice-guide-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={copyId}>
        <header><div><span>20-SECOND STRATEGY FINDER</span><h2 id={titleId}>What should this strategy do in your portfolio?</h2><p id={copyId}>Choose one goal. You can still compare all four strategies at any time.</p></div><button type="button" className="choice-guide-close" onClick={onClose} aria-label="Close strategy finder">×</button></header>
        <div className="choice-guide-options">
          {options.map(([id, goal, title, copy], index) => <button key={id} type="button" className={`product-${id}`} onClick={() => onOpen(id)}><i>{String(index + 1).padStart(2, "0")}</i><span>{goal}</span><b>{title}</b><small>{copy}</small><em>VIEW STRATEGY ↗</em></button>)}
        </div>
        <div className="plain-language-guide"><span>TERMS, MADE SIMPLE</span><dl><div><dt>PASSIVE</dt><dd>Follows published rules and changes holdings at scheduled reviews.</dd></div><div><dt>ACTIVE</dt><dd>Uses systematic signals to adjust holdings within fixed limits.</dd></div><div><dt>INDICATIVE NAV</dt><dd>An estimate of one fund share’s value, not an independently verified price.</dd></div><div><dt>MODEL RETURN</dt><dd>A simulated result, not money earned by investors.</dd></div></dl></div>
        <footer><button type="button" onClick={onClose}>COMPARE ALL FOUR</button><p>PAPER MODE means no real order is placed and no money moves.</p></footer>
      </section>
    </div>
  );
}

function ConfirmDialog({ eyebrow, title, copy, confirmLabel, danger = false, onCancel, onConfirm }: {
  eyebrow: string;
  title: string;
  copy: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const copyId = useId();
  const dialogRef = useDialogFocus(onCancel);
  return (
    <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onCancel(); }}>
      <section ref={dialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={copyId}>
        <span>{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
        <p id={copyId}>{copy}</p>
        <div><button type="button" onClick={onCancel}>KEEP IT</button><button type="button" className={danger ? "is-danger" : "is-primary"} onClick={onConfirm}>{confirmLabel}</button></div>
      </section>
    </div>
  );
}

export default function Home() {
  const [appOpen, setAppOpen] = useState(false);
  const [view, setView] = useState<View>("select");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData>(emptyPortfolio);
  const [operations, setOperations] = useState<OperationsData | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [marketError, setMarketError] = useState("");
  const [portfolioError, setPortfolioError] = useState("");
  const [operationsError, setOperationsError] = useState("");
  const [pendingRedeem, setPendingRedeem] = useState<PortfolioPosition | null>(null);
  const [confirmCycle, setConfirmCycle] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  const openView = useCallback((nextView: View) => {
    setAppOpen(true);
    setView(nextView);
    window.history.pushState({ ganymedeView: nextView }, "", `/?app=${nextView}`);
  }, []);

  const openOverview = useCallback(() => {
    setAppOpen(false);
    window.history.pushState({ ganymedeView: "overview" }, "", "/");
  }, []);

  const visibleEtfs = useMemo(() => activeFilter === "all" ? etfs : etfs.filter((etf) => etf.strategyStyle === activeFilter), [activeFilter]);
  const marketById = useMemo(() => new Map((market?.products ?? []).map((product) => [product.id, product])), [market]);

  const refreshMarket = useCallback(async () => {
    try {
      const response = await fetch("/api/market", { cache: "no-store" });
      const payload = await response.json() as MarketOverview & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Market engine is unavailable");
      setMarket(payload);
      setMarketError("");
    } catch (error) {
      setMarketError(error instanceof Error ? error.message : "Market engine is unavailable");
    }
  }, []);

  const refreshPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const walletAddress = await currentWalletAddress();
      const response = await fetch("/api/portfolio", { cache: "no-store", headers: walletAddress ? { "x-ganymede-wallet": walletAddress } : undefined });
      const payload = await response.json() as PortfolioData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Portfolio ledger is unavailable");
      setPortfolio(payload);
      setPortfolioError("");
    } catch (error) {
      setPortfolioError(error instanceof Error ? error.message : "Portfolio ledger is unavailable");
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  const refreshOperations = useCallback(async () => {
    setOperationsLoading(true);
    try {
      const response = await fetch("/api/operations/status", { cache: "no-store" });
      const payload = await response.json() as OperationsData;
      if (!response.ok) throw new Error(payload.error || "Operations authorization is required");
      setOperations(payload);
      setOperationsError("");
    } catch (error) {
      setOperationsError(error instanceof Error ? error.message : "Operations are unavailable");
    } finally {
      setOperationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const query = new URLSearchParams(window.location.search);
      const appView = query.get("app");
      if (appView === "select" || appView === "portfolio" || appView === "operations") {
        setAppOpen(true);
        setView(appView);
      }
      const savedFilter = sessionStorage.getItem("ganymede-etf-filter") as Filter | null;
      if (savedFilter && filters.some((filter) => filter.id === savedFilter)) setActiveFilter(savedFilter);
    }, 0);
    return () => window.clearTimeout(initialize);
  }, []);

  useEffect(() => {
    const restoreFromUrl = () => {
      const appView = new URLSearchParams(window.location.search).get("app");
      if (appView === "select" || appView === "portfolio" || appView === "operations") {
        setAppOpen(true);
        setView(appView);
      } else {
        setAppOpen(false);
      }
    };
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  useEffect(() => {
    if (!appOpen) return;
    const initial = window.setTimeout(() => void refreshMarket(), 0);
    const timer = window.setInterval(refreshMarket, 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [appOpen, refreshMarket]);

  useEffect(() => {
    if (!appOpen) return;
    const initial = window.setTimeout(() => {
      if (view === "portfolio") void refreshPortfolio();
      if (view === "operations") void refreshOperations();
    }, 0);
    return () => window.clearTimeout(initial);
  }, [appOpen, view, refreshOperations, refreshPortfolio]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(""), 7000);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  const openEtfDetail = (id: string) => {
    const etf = etfs.find((candidate) => candidate.id === id);
    if (!etf) return;
    sessionStorage.setItem("ganymede-etf-filter", activeFilter);
    window.location.assign(`/etfs/${etf.slug}`);
  };

  const navigateCards = (id: string, direction: number) => {
    const currentIndex = visibleEtfs.findIndex((etf) => etf.id === id);
    const nextIndex = (currentIndex + direction + visibleEtfs.length) % visibleEtfs.length;
    requestAnimationFrame(() => document.getElementById(`etf-card-${visibleEtfs[nextIndex].id}`)?.focus());
  };

  const redeemPosition = async (position: PortfolioPosition) => {
    setPortfolioLoading(true);
    try {
      const walletAddress = await currentWalletAddress();
      const response = await fetch("/api/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(walletAddress ? { "x-ganymede-wallet": walletAddress } : {}) },
        body: JSON.stringify({ productId: position.productId, sharesMicros: position.sharesMicros, walletAddress, clientReference: crypto.randomUUID() }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Redemption request failed");
      await refreshPortfolio();
      setActionNotice("Paper allocation removed. No real shares or funds were affected.");
    } catch (error) {
      setPortfolioError(error instanceof Error ? error.message : "Redemption request failed");
      setPortfolioLoading(false);
    }
  };

  const runOperationsCycle = async () => {
    setOperationsLoading(true);
    try {
      const response = await fetch("/api/operations/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Engine cycle failed");
      await Promise.all([refreshOperations(), refreshMarket()]);
      setActionNotice("Paper engine cycle completed and the indicative data was refreshed.");
    } catch (error) {
      setOperationsError(error instanceof Error ? error.message : "Engine cycle failed");
      setOperationsLoading(false);
    }
  };

  if (appOpen) {
    const totalAum = (market?.products ?? []).reduce((sum, product) => sum + asNumber(product.nav?.netAssetValueKrw), 0);
    return (
      <div className="app-shell etf-platform-shell ganymede-v4">
        <AppNav view={view} onOverview={openOverview} onViewChange={openView} />
        {view === "select" ? (
          <main className="etf-select-page product-market-page">
            <header className="etf-page-intro product-market-intro">
              <div><p className="section-kicker">CHOOSE BY PORTFOLIO ROLE / PRIVATE PRE-LAUNCH</p><h1>Build your orbit.</h1><p>Start with a foundation, a stabilizer, focused growth or frontier growth—then compare the mandate behind each strategy.</p><div className="market-truth-badges"><span><i /> PAPER MODE</span><span>MODEL PERFORMANCE</span><span>{DEFAULT_SETTLEMENT_CHAIN.label}</span></div></div>
              <div className="portfolio-role-map" aria-label="Four portfolio roles">
                {etfs.map((etf, index) => <span key={etf.id} className={`product-${etf.id}`}><i>{String(index + 1).padStart(2, "0")}</i><b>{etf.portfolioRole}</b><small>{etf.ticker} · {etf.risk} RISK</small></span>)}
              </div>
            </header>
            <div className="product-market-toolbar">
              <div className="etf-filters strategy-filters" role="group" aria-label="Filter ETF strategies">{filters.map((filter) => <button key={filter.id} type="button" className={activeFilter === filter.id ? "is-active" : ""} aria-pressed={activeFilter === filter.id} onClick={() => { setActiveFilter(filter.id); sessionStorage.setItem("ganymede-etf-filter", filter.id); }}>{filter.label}</button>)}</div>
              <div className="market-toolbar-status"><button type="button" className="choice-guide-trigger" onClick={() => setGuideOpen(true)}>HELP ME CHOOSE <span>?</span></button><p aria-live="polite" aria-atomic="true"><b>{String(visibleEtfs.length).padStart(2, "0")} {activeFilter === "all" ? "STRATEGIES" : `${activeFilter.toUpperCase()} STRATEGIES`}</b>{market?.updatedAt ? ` · Indicative NAV ${displayTime(market.updatedAt)}` : marketError ? " · REFERENCE DATA SHOWN" : totalAum ? ` · Reference universe ${formatKrw(totalAum)}` : " · Preparing strategy data…"}{marketError && <button type="button" onClick={() => void refreshMarket()}>TRY AGAIN</button>}</p></div>
            </div>
            <section key={activeFilter} className="etf-card-grid is-filtered" aria-label="ETF products">{visibleEtfs.map((etf) => <EtfCard key={etf.id} etf={etf} liveProduct={marketById.get(etf.id)} onOpen={openEtfDetail} onNavigate={navigateCards} />)}</section>
          </main>
        ) : view === "portfolio" ? (
          <PortfolioView data={portfolio} loading={portfolioLoading} error={portfolioError} onBrowse={() => openView("select")} onOpen={(position) => window.location.assign(`/etfs/${position.slug}`)} onRedeem={async (position) => setPendingRedeem(position)} />
        ) : (
          <OperationsView data={operations} loading={operationsLoading} error={operationsError} onRun={async () => setConfirmCycle(true)} />
        )}
        <footer className="app-disclaimer"><span>PRE-LAUNCH / SIMULATION</span><p>Returns are modelled and NAV is indicative. Public issuance remains disabled until licensed fund, custody, administration and distribution controls are active.</p><button type="button" onClick={() => openView("operations")}>SYSTEM STATUS ↗</button></footer>
        {pendingRedeem && <ConfirmDialog eyebrow="PAPER PORTFOLIO / REVIEW" title={`Remove ${pendingRedeem.ticker} from this simulation?`} copy="This removes the saved paper allocation only. No real shares, assets or funds will be affected." confirmLabel="REMOVE" danger onCancel={() => setPendingRedeem(null)} onConfirm={() => { const position = pendingRedeem; setPendingRedeem(null); void redeemPosition(position); }} />}
        {confirmCycle && <ConfirmDialog eyebrow="CONTROL ROOM / PAPER MODE" title="Run one controlled engine cycle?" copy="The paper engine will evaluate four strategies, refresh indicative NAV, create any simulated rebalance orders and append the results to the audit ledger." confirmLabel="RUN PAPER CYCLE" onCancel={() => setConfirmCycle(false)} onConfirm={() => { setConfirmCycle(false); void runOperationsCycle(); }} />}
        {guideOpen && <ChoiceGuide onClose={() => setGuideOpen(false)} onOpen={(id) => { setGuideOpen(false); openEtfDetail(id); }} />}
        {actionNotice && <div className="action-toast" role="status"><i>✓</i><p>{actionNotice}</p><button type="button" onClick={() => setActionNotice("")} aria-label="Dismiss notification">×</button></div>}
      </div>
    );
  }

  return (
    <main className="ganymede-launch etf-platform-launch ganymede-v4" aria-labelledby="hero-title">
      <GanymedeScene />
      <header className="platform-launch-nav"><div className="launch-wordmark"><span>G</span><b>GANYMEDE INDEX<small>CELESTIAL ASSET OBSERVATORY</small></b></div><nav className="launch-nav" aria-label="Landing navigation"><button type="button" onClick={() => openView("select")}>STRATEGIES</button><button type="button" onClick={() => openView("portfolio")}>PORTFOLIO</button><a href="/proof">PROOF OF NAV</a></nav><WalletConnect compact /></header>
      <section className="launch-copy etf-launch-copy">
        <div className="launch-status-line"><span><i /> PRIVATE PRE-LAUNCH</span><b>PAPER MODE · {DEFAULT_SETTLEMENT_CHAIN.label}</b></div>
        <p>PASSIVE + ACTIVE DIGITAL-ASSET STRATEGIES</p>
        <h1 id="hero-title"><span>FOUR STRATEGIES.</span><span>ONE CLEAR ORBIT.</span></h1>
        <p className="launch-description">Choose a foundation, a stabilizer, focused growth or frontier growth—then inspect every rule, holding and risk before launch.</p>
        <div className="launch-actions"><button className="launch-app" type="button" onClick={() => openView("select")}>COMPARE STRATEGIES <span aria-hidden="true">↗</span></button><button className="launch-portfolio" type="button" onClick={() => setGuideOpen(true)}>HELP ME CHOOSE</button></div>
        <div className="launch-assurance"><span>METHODOLOGY PUBLISHED</span><span>HOLDINGS DISCLOSED</span><span>LIMITS ENFORCED</span></div>
      </section>
      <aside className="launch-fund-index" aria-label="Fund universe">
        <span className="launch-fund-index-label">FUND UNIVERSE / 04</span>
        {etfs.map((etf, index) => <button key={etf.id} type="button" className={`product-${etf.id}`} onClick={() => { setActiveFilter(etf.strategyStyle); openView("select"); }}><i>{String(index + 1).padStart(2, "0")}</i><span><b>{etf.ticker.replace("GMD ", "")}</b><small>{etf.roleName}</small></span><em>{etf.fee} FEE</em></button>)}
      </aside>
      <p className="launch-disclosure"><span>PRIVATE PRE-LAUNCH</span> No public offering is active. Model, reference and indicative figures are not administrator-verified.</p>
      {guideOpen && <ChoiceGuide onClose={() => setGuideOpen(false)} onOpen={(id) => { setGuideOpen(false); openEtfDetail(id); }} />}
    </main>
  );
}
