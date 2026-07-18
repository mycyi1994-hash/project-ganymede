"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import GanymedeScene from "./GanymedeScene";
import MiniAsciiCelestial from "./MiniAsciiCelestial";
import WalletConnect from "./WalletConnect";
import { etfs, type Etf, type Filter } from "./data/etfs";

type View = "select" | "portfolio";

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "ALL PRODUCTS" },
  { id: "core", label: "CORE" },
  { id: "growth", label: "GROWTH" },
  { id: "income", label: "INCOME" },
];

function AsciiPlanet({ variant }: { variant: Etf["visual"] }) {
  return (
    <div className={`ascii-planet ascii-planet-${variant}`} aria-hidden="true">
      <MiniAsciiCelestial variant={variant} />
    </div>
  );
}

function EtfCard({ etf, onOpen, onNavigate }: {
  etf: Etf;
  onOpen: (id: string) => void;
  onNavigate: (id: string, direction: number) => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(etf.id);
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      onNavigate(etf.id, 1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      onNavigate(etf.id, -1);
    }
  };

  return (
    <article
      id={`etf-card-${etf.id}`}
      className="etf-card etf-product-card"
      tabIndex={0}
      aria-label={`View ${etf.name} product details`}
      onClick={() => onOpen(etf.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="etf-card-hero">
        <div className="etf-card-copy">
          <div className="product-card-labels">
            <span className="etf-ticker">{etf.ticker}</span>
            <span className={`risk-badge risk-${etf.risk.toLowerCase()}`}>{etf.risk} RISK</span>
          </div>
          <h2>{etf.name}</h2>
          <p>{etf.tagline}</p>
          <small>AUM {etf.aum} · {etf.assetCount} ASSETS</small>
        </div>
        <AsciiPlanet variant={etf.visual} />
      </div>

      <dl className="etf-metrics product-card-metrics">
        <div><dt>NAV</dt><dd>{etf.nav}<small>{etf.navChange}</small></dd></div>
        <div><dt>1Y RETURN</dt><dd>+{etf.oneYearReturn}</dd></div>
        <div><dt>EXPENSE RATIO</dt><dd>{etf.fee}</dd></div>
      </dl>

      <div className="etf-card-actions">
        <div className="holding-chips" aria-label="Top holdings">
          {etf.basket.slice(0, 2).map((holding) => (
            <span key={holding.ticker}>{holding.ticker} <b>{holding.weight}%</b></span>
          ))}
        </div>
        <button type="button" className="select-etf-button" onClick={(event) => { event.stopPropagation(); onOpen(etf.id); }}>
          VIEW PRODUCT <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}

function AppNav({ view, onOverview, onViewChange }: {
  view: View;
  onOverview: () => void;
  onViewChange: (view: View) => void;
}) {
  return (
    <header className="app-topbar platform-topbar">
      <button className="app-identity" type="button" onClick={onOverview}>
        <span>G</span>
        <strong>GANYMEDE INDEX<small>DIGITAL ASSET ETFs</small></strong>
      </button>

      <nav className="app-menu" aria-label="Primary navigation">
        <button type="button" onClick={onOverview}>OVERVIEW</button>
        <button className={view === "select" ? "is-active" : ""} type="button" aria-current={view === "select" ? "page" : undefined} onClick={() => onViewChange("select")}>ETF PRODUCTS</button>
        <button className={view === "portfolio" ? "is-active" : ""} type="button" aria-current={view === "portfolio" ? "page" : undefined} onClick={() => onViewChange("portfolio")}>PORTFOLIO</button>
      </nav>

      <WalletConnect compact />
    </header>
  );
}

function PortfolioView({ products, onBrowse, onRemove, onOpen }: {
  products: Etf[];
  onBrowse: () => void;
  onRemove: (etf: Etf) => void;
  onOpen: (etf: Etf) => void;
}) {
  if (!products.length) {
    return (
      <main className="portfolio-page portfolio-empty-page">
        <section className="portfolio-empty">
          <p className="section-kicker">PORTFOLIO / NO POSITIONS</p>
          <h1>Your tracked ETFs will appear here.</h1>
          <p>Add a product from its detail page to monitor its illustrative return and current model value.</p>
          <button type="button" onClick={onBrowse}>BROWSE ETF PRODUCTS</button>
        </section>
      </main>
    );
  }

  const capitalPerProduct = 10000;
  const positions = products.map((product) => {
    const returnRate = Number.parseFloat(product.oneYearReturn);
    const gain = capitalPerProduct * returnRate / 100;
    return { product, invested: capitalPerProduct, gain, value: capitalPerProduct + gain, returnRate };
  });
  const invested = positions.reduce((sum, position) => sum + position.invested, 0);
  const gain = positions.reduce((sum, position) => sum + position.gain, 0);
  const currentValue = invested + gain;
  const totalReturn = gain / invested * 100;
  const best = [...positions].sort((a, b) => b.returnRate - a.returnRate)[0];

  return (
    <main className="portfolio-page holdings-portfolio-page">
      <header className="portfolio-header">
        <div>
          <p className="section-kicker">TRACKED MODEL PORTFOLIO</p>
          <h1>My ETF portfolio</h1>
          <p>Products you added, with illustrative one-year performance applied to a $10,000 model position.</p>
        </div>
        <button type="button" className="portfolio-browse-button" onClick={onBrowse}>ADD ETF</button>
      </header>

      <dl className="portfolio-kpis">
        <div><dt>MODEL VALUE</dt><dd>${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</dd><small>Cost basis ${invested.toLocaleString()}</small></div>
        <div><dt>TOTAL RETURN</dt><dd className="positive-value">+{totalReturn.toFixed(1)}%</dd><small>+${gain.toLocaleString(undefined, { maximumFractionDigits: 0 })}</small></div>
        <div><dt>POSITIONS</dt><dd>{String(products.length).padStart(2, "0")}</dd><small>Ganymede strategies</small></div>
        <div><dt>TOP CONTRIBUTOR</dt><dd>{best.product.ticker.replace("GMD ", "")}</dd><small>+{best.returnRate.toFixed(1)}% over 1Y</small></div>
      </dl>

      <section className="portfolio-positions" aria-labelledby="positions-title">
        <header>
          <div><p className="section-kicker">POSITIONS</p><h2 id="positions-title">Tracked products</h2></div>
          <span>MODEL DATA · NOT LIVE HOLDINGS</span>
        </header>
        <div className="position-table" role="table" aria-label="Tracked ETF positions">
          <div className="position-row position-head" role="row">
            <span>PRODUCT</span><span>MODEL COST</span><span>CURRENT VALUE</span><span>1Y RETURN</span><span>FEE</span><span>ACTION</span>
          </div>
          {positions.map(({ product, invested: cost, value, gain: productGain, returnRate }) => (
            <div className="position-row" role="row" key={product.id}>
              <button type="button" className="position-product" onClick={() => onOpen(product)}>
                <span className="position-orbit" aria-hidden="true"><i /></span>
                <span><b>{product.ticker}</b><small>{product.name}</small></span>
              </button>
              <span>${cost.toLocaleString()}</span>
              <span><b>${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b><small>+${productGain.toLocaleString(undefined, { maximumFractionDigits: 0 })}</small></span>
              <span className="position-return"><b>+{returnRate.toFixed(1)}%</b><i style={{ width: `${Math.min(100, returnRate * 2.7)}%` }} /></span>
              <span>{product.fee}</span>
              <button type="button" className="position-remove" onClick={() => onRemove(product)} aria-label={`Remove ${product.name}`}>REMOVE</button>
            </div>
          ))}
        </div>
        <footer>
          <p>Returns and values are illustrative, based on each product&apos;s stated 1Y return. They are not wallet balances or investment advice.</p>
          <WalletConnect />
        </footer>
      </section>
    </main>
  );
}

export default function Home() {
  const [appOpen, setAppOpen] = useState(false);
  const [view, setView] = useState<View>("select");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [portfolioEtfIds, setPortfolioEtfIds] = useState<string[]>([]);

  const visibleEtfs = useMemo(() => activeFilter === "all" ? etfs : etfs.filter((etf) => etf.category === activeFilter), [activeFilter]);
  const portfolioEtfs = portfolioEtfIds.map((id) => etfs.find((etf) => etf.id === id)).filter((etf): etf is Etf => Boolean(etf));

  const refreshPortfolio = () => {
    let savedIds: string[] = [];
    try {
      const stored = JSON.parse(localStorage.getItem("ganymede-portfolio-ids") ?? "[]");
      savedIds = Array.isArray(stored) ? stored.filter((value): value is string => typeof value === "string") : [];
    } catch {
      savedIds = [];
    }
    const validIds = etfs.filter((etf) => savedIds.includes(etf.id) || localStorage.getItem(`ganymede-portfolio-${etf.slug}`) === "added").map((etf) => etf.id);
    setPortfolioEtfIds(validIds);
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const appView = query.get("app");
    if (appView === "select" || appView === "portfolio") {
      setAppOpen(true);
      setView(appView === "portfolio" ? "portfolio" : "select");
    }
    const savedFilter = sessionStorage.getItem("ganymede-etf-filter") as Filter | null;
    if (savedFilter && filters.some((filter) => filter.id === savedFilter)) setActiveFilter(savedFilter);
    refreshPortfolio();
  }, []);

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

  if (appOpen) {
    return (
      <div className="app-shell etf-platform-shell">
        <AppNav view={view} onOverview={() => setAppOpen(false)} onViewChange={(nextView) => { if (nextView === "portfolio") refreshPortfolio(); setView(nextView); }} />

        {view === "select" ? (
          <main className="etf-select-page product-market-page">
            <header className="etf-page-intro product-market-intro">
              <div>
                <p className="section-kicker">GANYMEDE ETF MARKET / 04 STRATEGIES</p>
                <h1>Digital asset ETFs</h1>
                <p>Compare transparent, rules-based strategies designed for distinct risk and return objectives.</p>
              </div>
              <div className="market-snapshot" aria-label="Product market snapshot">
                <span><small>MODEL AUM</small><b>$361.1M</b></span>
                <span><small>STRATEGIES</small><b>04</b></span>
                <span><small>NETWORK</small><b>GIWA TESTNET</b></span>
              </div>
            </header>

            <div className="product-market-toolbar">
              <div className="etf-filters" role="group" aria-label="Filter ETF strategies">
                {filters.map((filter) => (
                  <button key={filter.id} type="button" className={activeFilter === filter.id ? "is-active" : ""} aria-pressed={activeFilter === filter.id} onClick={() => { setActiveFilter(filter.id); sessionStorage.setItem("ganymede-etf-filter", filter.id); }}>{filter.label}</button>
                ))}
              </div>
              <p>Returns are illustrative · Values in USD</p>
            </div>

            <section className="etf-card-grid" aria-label="ETF products">
              {visibleEtfs.map((etf) => <EtfCard key={etf.id} etf={etf} onOpen={openEtfDetail} onNavigate={navigateCards} />)}
            </section>
          </main>
        ) : (
          <PortfolioView
            products={portfolioEtfs}
            onBrowse={() => setView("select")}
            onOpen={(product) => window.location.assign(`/etfs/${product.slug}`)}
            onRemove={(product) => {
              localStorage.removeItem(`ganymede-portfolio-${product.slug}`);
              const nextIds = portfolioEtfIds.filter((id) => id !== product.id);
              localStorage.setItem("ganymede-portfolio-ids", JSON.stringify(nextIds));
              setPortfolioEtfIds(nextIds);
            }}
          />
        )}

        <footer className="app-disclaimer">Illustrative model products only. GIWA Testnet tokens have no economic value. Review all risks before investing.</footer>
      </div>
    );
  }

  return (
    <main className="ganymede-launch etf-platform-launch" aria-labelledby="hero-title">
      <GanymedeScene />
      <header className="platform-launch-nav">
        <div className="launch-wordmark"><span>G</span><b>GANYMEDE INDEX<small>DIGITAL ASSET ETF PLATFORM</small></b></div>
        <WalletConnect compact />
      </header>

      <section className="launch-copy etf-launch-copy">
        <p>DIGITAL ASSET ETF STRATEGIES / GIWA TESTNET</p>
        <h1 id="hero-title"><span>INVEST WITH</span><span>A CLEAR ORBIT.</span></h1>
        <p className="launch-description">Research, compare and track rules-based digital asset ETFs through one institutional-grade interface.</p>
        <div className="launch-market-stats">
          <span><small>STRATEGIES</small><b>04</b></span>
          <span><small>MODEL AUM</small><b>$361.1M</b></span>
          <span><small>CHAIN</small><b>GIWA / 91342</b></span>
        </div>
        <div className="launch-actions">
          <button className="launch-app" type="button" onClick={() => { setView("select"); setAppOpen(true); }}>Explore ETFs <span aria-hidden="true">↗</span></button>
          <button className="launch-portfolio" type="button" onClick={() => { refreshPortfolio(); setView("portfolio"); setAppOpen(true); }}>View portfolio</button>
        </div>
      </section>

      <p className="launch-disclosure">Model products and performance are illustrative. Testnet assets have no monetary value.</p>
    </main>
  );
}
