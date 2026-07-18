"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import GanymedeScene from "./GanymedeScene";
import MiniAsciiCelestial from "./MiniAsciiCelestial";
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
  { id: "all", label: "ALL PRODUCTS" },
  { id: "passive", label: "PASSIVE" },
  { id: "active", label: "ACTIVE" },
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
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(etf.id);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      onNavigate(etf.id, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      onNavigate(etf.id, -1);
    }
  };
  const targetHoldings = liveProduct?.targets?.length ? liveProduct.targets.slice(0, 2) : etf.basket.slice(0, 2).map((holding) => ({ symbol: holding.ticker, target_weight_bps: holding.weight * 100 }));
  return (
    <article id={`etf-card-${etf.id}`} className="etf-card etf-product-card" tabIndex={0} aria-label={`View ${etf.name} product details`} onClick={() => onOpen(etf.id)} onKeyDown={handleKeyDown}>
      <div className="etf-card-hero">
        <div className="etf-card-copy">
          <div className="product-card-labels">
            <span className="etf-ticker">{etf.ticker}</span>
            <span className={`strategy-style-badge strategy-${etf.strategyStyle}`}>{etf.strategyStyle.toUpperCase()}</span>
            <span className={`risk-badge risk-${etf.risk.toLowerCase()}`}>{etf.risk} RISK</span>
          </div>
          <h2>{etf.name}</h2>
          <p>{etf.tagline}</p>
          <small>{etf.strategyStyle === "passive" ? "RULES-BASED INDEX" : "SYSTEMATIC ACTIVE"} · {etf.assetCount} ASSETS</small>
        </div>
        <AsciiPlanet variant={etf.visual} />
      </div>
      <dl className="etf-metrics product-card-metrics">
        <div><dt>LIVE NAV</dt><dd>{liveProduct?.nav ? formatNav(liveProduct.nav.navPerShareMicros) : etf.nav}<small>{liveProduct?.nav?.quality?.toUpperCase() ?? etf.navChange}</small></dd></div>
        <div><dt>1Y RETURN</dt><dd>+{etf.oneYearReturn}</dd></div>
        <div><dt>EXPENSE RATIO</dt><dd>{etf.fee}</dd></div>
      </dl>
      <div className="etf-card-actions">
        <div className="holding-chips" aria-label="Top target holdings">
          {targetHoldings.map((holding) => <span key={holding.symbol}>{holding.symbol} <b>{(holding.target_weight_bps / 100).toFixed(1)}%</b></span>)}
        </div>
        <button type="button" className="select-etf-button" onClick={(event) => { event.stopPropagation(); onOpen(etf.id); }}>VIEW PRODUCT <span aria-hidden="true">→</span></button>
      </div>
    </article>
  );
}

function AppNav({ view, onOverview, onViewChange }: { view: View; onOverview: () => void; onViewChange: (view: View) => void }) {
  return (
    <header className="app-topbar platform-topbar">
      <button className="app-identity" type="button" onClick={onOverview}><span>G</span><strong>GANYMEDE INDEX<small>ETF OPERATING SYSTEM</small></strong></button>
      <nav className="app-menu" aria-label="Primary navigation">
        <button type="button" onClick={onOverview}>OVERVIEW</button>
        <button className={view === "select" ? "is-active" : ""} type="button" aria-current={view === "select" ? "page" : undefined} onClick={() => onViewChange("select")}>ETF PRODUCTS</button>
        <button className={view === "portfolio" ? "is-active" : ""} type="button" aria-current={view === "portfolio" ? "page" : undefined} onClick={() => onViewChange("portfolio")}>PORTFOLIO</button>
        <button className={view === "operations" ? "is-active" : ""} type="button" aria-current={view === "operations" ? "page" : undefined} onClick={() => onViewChange("operations")}>OPERATIONS</button>
      </nav>
      <WalletConnect compact />
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
  if (loading) return <main className="portfolio-page portfolio-empty-page"><section className="portfolio-empty"><p className="section-kicker">PORTFOLIO / LOADING</p><h1>Reconciling fund positions.</h1><p>Reading settled shares and the latest official or indicative NAV from the fund ledger.</p></section></main>;
  if (!data.positions.length) {
    return (
      <main className="portfolio-page portfolio-empty-page">
        <section className="portfolio-empty">
          <p className="section-kicker">PORTFOLIO / {data.subscriptions.length ? "SUBSCRIPTION PENDING" : "NO POSITIONS"}</p>
          <h1>{data.subscriptions.length ? "Your subscription is in the settlement queue." : "Your ETF shares will appear here."}</h1>
          <p>{error || (data.subscriptions.length ? "KYC, funding, execution and GIWA issuance must complete before shares are shown." : "Select a passive or active ETF and submit a subscription request.")}</p>
          <button type="button" onClick={onBrowse}>BROWSE ETF PRODUCTS</button>
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
        <div><p className="section-kicker">SETTLED FUND SHARE LEDGER</p><h1>My ETF portfolio</h1><p>Cost basis, latest NAV, unrealized return and GIWA settlement state from the persistent fund ledger.</p></div>
        <div className="portfolio-header-actions"><span><i /> KYC {data.investor?.kycStatus?.toUpperCase() ?? "UNVERIFIED"}</span><button type="button" className="is-primary" onClick={onBrowse}>ADD ETF</button></div>
      </header>
      <dl className="portfolio-kpis">
        <div><dt>PORTFOLIO VALUE</dt><dd>{formatKrw(currentValue)}</dd><small>Cost basis {formatKrw(invested)}</small></div>
        <div><dt>TOTAL RETURN</dt><dd className={gain >= 0 ? "positive-value" : ""}>{gain >= 0 ? "+" : ""}{(totalReturnBps / 100).toFixed(2)}%</dd><small>{gain >= 0 ? "+" : ""}{formatKrw(gain)}</small></div>
        <div><dt>POSITIONS</dt><dd>{String(data.positions.length).padStart(2, "0")}</dd><small>Settled ETF share classes</small></div>
        <div><dt>TOP CONTRIBUTOR</dt><dd>{best.ticker.replace("GMD ", "")}</dd><small>{best.returnBps >= 0 ? "+" : ""}{(best.returnBps / 100).toFixed(2)}%</small></div>
      </dl>
      <section className="portfolio-positions" aria-labelledby="positions-title">
        <header><div><p className="section-kicker">POSITIONS</p><h2 id="positions-title">Issued ETF shares</h2></div><span>SERVER LEDGER · NAV MARKED</span></header>
        <div className="position-table" role="table" aria-label="ETF fund share positions">
          <div className="position-row position-head" role="row"><span>PRODUCT</span><span>SHARES</span><span>COST BASIS</span><span>NAV VALUE / RETURN</span><span>STYLE</span><span>ACTION</span></div>
          {data.positions.map((position) => (
            <div className="position-row" role="row" key={position.productId}>
              <button type="button" className="position-product" onClick={() => onOpen(position)}><span className="position-orbit" aria-hidden="true"><i /></span><span><b>{position.ticker}</b><small>{position.name}</small></span></button>
              <span><b>{formatShares(position.sharesMicros)}</b><small>fund shares</small></span>
              <span><b>{formatKrw(position.costBasisKrw)}</b><small>settled cash</small></span>
              <span className="position-return"><b>{formatKrw(position.currentValueKrw)} · {position.returnBps >= 0 ? "+" : ""}{(position.returnBps / 100).toFixed(2)}%</b><i style={{ width: `${Math.min(100, Math.max(3, Math.abs(position.returnBps) / 30))}%` }} /></span>
              <span>{position.strategyStyle.toUpperCase()}</span>
              <button type="button" className="position-remove" onClick={() => onRedeem(position)} aria-label={`Redeem ${position.name}`}>REDEEM</button>
            </div>
          ))}
        </div>
        <footer><p>Subscriptions and redemptions pass through KYC, funding, execution and GIWA settlement states. A pending request is not an issued fund share.</p><WalletConnect /></footer>
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
        <div><p className="section-kicker">FUND OPERATIONS / CONTROL PLANE</p><h1>Portfolio engine</h1><p>Five-minute strategy, NAV, rebalance, order, settlement and audit loop for passive and active mandates.</p></div>
        <button type="button" className="portfolio-browse-button" disabled={loading} onClick={onRun}>{loading ? "RUNNING…" : "RUN CONTROLLED CYCLE"}</button>
      </header>
      <dl className="portfolio-kpis operations-kpis">
        <div><dt>ENGINE MODE</dt><dd>{cycle?.mode?.toUpperCase() ?? "PAPER"}</dd><small>{cycle?.marketDataQuality?.toUpperCase() ?? "WAITING FOR DATA"}</small></div>
        <div><dt>PRODUCTS</dt><dd>{String(data?.counts?.operational_products ?? 4).padStart(2, "0")}</dd><small>02 passive · 02 active</small></div>
        <div><dt>OPEN ORDERS</dt><dd>{String(data?.counts?.open_orders ?? 0).padStart(2, "0")}</dd><small>{cycle?.ordersCreated ?? 0} created last cycle</small></div>
        <div><dt>GIWA QUEUE</dt><dd>{String(data?.counts?.pending_settlements ?? 0).padStart(2, "0")}</dd><small>Mint · burn · NAV · rebalance</small></div>
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
    } catch (error) {
      setOperationsError(error instanceof Error ? error.message : "Engine cycle failed");
      setOperationsLoading(false);
    }
  };

  if (appOpen) {
    const totalAum = (market?.products ?? []).reduce((sum, product) => sum + asNumber(product.nav?.netAssetValueKrw), 0);
    return (
      <div className="app-shell etf-platform-shell">
        <AppNav view={view} onOverview={() => setAppOpen(false)} onViewChange={setView} />
        {view === "select" ? (
          <main className="etf-select-page product-market-page">
            <header className="etf-page-intro product-market-intro">
              <div><p className="section-kicker">GANYMEDE ETF MARKET / PASSIVE + ACTIVE</p><h1>Digital asset ETFs</h1><p>Two transparent index mandates and two systematic active mandates, operated by one persistent portfolio engine.</p></div>
              <div className="market-snapshot" aria-label="Product market snapshot"><span><small>FUND AUM</small><b>{totalAum ? formatKrw(totalAum) : "INITIALIZING"}</b></span><span><small>STRATEGIES</small><b>02P / 02A</b></span><span><small>ENGINE</small><b>{market?.lastCycle ? `${market.lastCycle.mode.toUpperCase()} · ${market.lastCycle.marketDataQuality.toUpperCase()}` : marketError || "WAKING"}</b></span></div>
            </header>
            <div className="product-market-toolbar">
              <div className="etf-filters strategy-filters" role="group" aria-label="Filter ETF strategies">{filters.map((filter) => <button key={filter.id} type="button" className={activeFilter === filter.id ? "is-active" : ""} aria-pressed={activeFilter === filter.id} onClick={() => { setActiveFilter(filter.id); sessionStorage.setItem("ganymede-etf-filter", filter.id); }}>{filter.label}</button>)}</div>
              <p>{market?.updatedAt ? `Engine updated ${displayTime(market.updatedAt)}` : "Connecting to fund engine"}</p>
            </div>
            <section className="etf-card-grid" aria-label="ETF products">{visibleEtfs.map((etf) => <EtfCard key={etf.id} etf={etf} liveProduct={marketById.get(etf.id)} onOpen={openEtfDetail} onNavigate={navigateCards} />)}</section>
          </main>
        ) : view === "portfolio" ? (
          <PortfolioView data={portfolio} loading={portfolioLoading} error={portfolioError} onBrowse={() => setView("select")} onOpen={(position) => window.location.assign(`/etfs/${position.slug}`)} onRedeem={redeemPosition} />
        ) : (
          <OperationsView data={operations} loading={operationsLoading} error={operationsError} onRun={runOperationsCycle} />
        )}
        <footer className="app-disclaimer">ETF operating system · Upbit execution adapter · GIWA settlement ledger · Live mode remains disabled until licensed operations credentials are configured.</footer>
      </div>
    );
  }

  return (
    <main className="ganymede-launch etf-platform-launch" aria-labelledby="hero-title">
      <GanymedeScene />
      <header className="platform-launch-nav"><div className="launch-wordmark"><span>G</span><b>GANYMEDE INDEX<small>ETF OPERATING SYSTEM</small></b></div><WalletConnect compact /></header>
      <section className="launch-copy etf-launch-copy">
        <p>PASSIVE + ACTIVE DIGITAL ASSET ETF OPERATIONS / GIWA</p>
        <h1 id="hero-title"><span>INVEST WITH</span><span>A CLEAR ORBIT.</span></h1>
        <p className="launch-description">Index construction, systematic alpha, NAV, execution, rebalancing and GIWA fund-share settlement in one controlled operating system.</p>
        <div className="launch-market-stats"><span><small>PASSIVE</small><b>02 FUNDS</b></span><span><small>ACTIVE</small><b>02 FUNDS</b></span><span><small>ENGINE</small><b>5 MIN LOOP</b></span></div>
        <div className="launch-actions"><button className="launch-app" type="button" onClick={() => { setView("select"); setAppOpen(true); }}>Explore ETFs <span aria-hidden="true">→</span></button><button className="launch-portfolio" type="button" onClick={() => { setView("operations"); setAppOpen(true); }}>View operations</button></div>
      </section>
      <p className="launch-disclosure">Live issuance requires licensed fund, custody, transfer-agent and venue integrations. The deployed engine defaults to controlled paper mode.</p>
    </main>
  );
}
