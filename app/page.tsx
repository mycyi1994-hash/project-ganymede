"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import GanymedeScene from "./GanymedeScene";
import MiniAsciiCelestial from "./MiniAsciiCelestial";

type Filter = "all" | "core" | "growth" | "income";
type View = "select" | "portfolio";
type Risk = "LOW" | "MEDIUM" | "HIGH";

type Holding = {
  symbol: string;
  weight: number;
};

type Etf = {
  id: string;
  name: string;
  ticker: string;
  category: Exclude<Filter, "all">;
  strategy: string;
  return1y: string;
  fee: string;
  risk: Risk;
  visual: "core" | "tech" | "income" | "alpha";
  holdings: Holding[];
};

const etfs: Etf[] = [
  {
    id: "core-20",
    name: "GANYMEDE CORE 20",
    ticker: "GMD CORE",
    category: "core",
    strategy: "Balanced exposure to leading digital assets.",
    return1y: "18.4%",
    fee: "0.35%",
    risk: "MEDIUM",
    visual: "core",
    holdings: [
      { symbol: "BTC", weight: 42 },
      { symbol: "ETH", weight: 28 },
      { symbol: "SOL", weight: 10 },
      { symbol: "BNB", weight: 8 },
      { symbol: "XRP", weight: 6 },
      { symbol: "OTHER", weight: 6 },
    ],
  },
  {
    id: "tech-leaders",
    name: "TECH LEADERS",
    ticker: "GMD TECH",
    category: "growth",
    strategy: "Growth-focused leaders in blockchain infrastructure.",
    return1y: "24.7%",
    fee: "0.48%",
    risk: "HIGH",
    visual: "tech",
    holdings: [
      { symbol: "ETH", weight: 36 },
      { symbol: "SOL", weight: 18 },
      { symbol: "BNB", weight: 14 },
      { symbol: "LINK", weight: 12 },
      { symbol: "HYPE", weight: 10 },
      { symbol: "OTHER", weight: 10 },
    ],
  },
  {
    id: "digital-income",
    name: "DIGITAL INCOME",
    ticker: "GMD YIELD",
    category: "income",
    strategy: "A diversified strategy designed for steady income.",
    return1y: "11.2%",
    fee: "0.40%",
    risk: "LOW",
    visual: "income",
    holdings: [
      { symbol: "USDC", weight: 32 },
      { symbol: "ETH", weight: 24 },
      { symbol: "BTC", weight: 18 },
      { symbol: "TRX", weight: 12 },
      { symbol: "BNB", weight: 8 },
      { symbol: "OTHER", weight: 6 },
    ],
  },
  {
    id: "next-frontier",
    name: "NEXT FRONTIER",
    ticker: "GMD ALPHA",
    category: "growth",
    strategy: "Emerging networks selected for long-term growth.",
    return1y: "29.1%",
    fee: "0.55%",
    risk: "HIGH",
    visual: "alpha",
    holdings: [
      { symbol: "SOL", weight: 26 },
      { symbol: "LINK", weight: 17 },
      { symbol: "HYPE", weight: 15 },
      { symbol: "SUI", weight: 13 },
      { symbol: "AVAX", weight: 11 },
      { symbol: "OTHER", weight: 18 },
    ],
  },
];

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "ALL" },
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

type EtfCardProps = {
  etf: Etf;
  selected: boolean;
  onSelect: (id: string) => void;
  onNavigate: (id: string, direction: number) => void;
};

function EtfCard({ etf, selected, onSelect, onNavigate }: EtfCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(etf.id);
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
      className={`etf-card${selected ? " is-selected" : ""}`}
      role="radio"
      aria-checked={selected}
      aria-label={`${etf.name}, ${etf.ticker}`}
      tabIndex={0}
      onClick={() => onSelect(etf.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="etf-card-hero">
        <div className="etf-card-copy">
          <h2>{etf.name}</h2>
          <span className="etf-ticker">{etf.ticker}</span>
          <p>{etf.strategy}</p>
        </div>
        <AsciiPlanet variant={etf.visual} />
      </div>

      <dl className="etf-metrics">
        <div><dt>1Y RETURN</dt><dd>{etf.return1y}</dd></div>
        <div><dt>FEE</dt><dd>{etf.fee}</dd></div>
        <div><dt>RISK</dt><dd>{etf.risk}</dd></div>
      </dl>

      <div className="etf-card-actions">
        <div className="holding-chips" aria-label="Top holdings">
          {etf.holdings.slice(0, 2).map((holding) => (
            <span key={holding.symbol}>{holding.symbol} <b>{holding.weight}%</b></span>
          ))}
        </div>
        <button
          type="button"
          className="select-etf-button"
          aria-label={`${selected ? "Selected" : "Select"} ${etf.name}`}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(etf.id);
          }}
        >
          {selected ? "SELECTED" : "SELECT"}
        </button>
      </div>
    </article>
  );
}

type AppNavProps = {
  view: View;
  onOverview: () => void;
  onViewChange: (view: View) => void;
};

function AppNav({ view, onOverview, onViewChange }: AppNavProps) {
  return (
    <header className="app-topbar">
      <button className="app-identity" type="button" onClick={onOverview}>
        <span>G</span>
        <strong>GANYMEDE INDEX</strong>
      </button>

      <nav className="app-menu" aria-label="Primary navigation">
        <button type="button" onClick={onOverview}>OVERVIEW</button>
        <button
          className={view === "select" ? "is-active" : ""}
          type="button"
          aria-current={view === "select" ? "page" : undefined}
          onClick={() => onViewChange("select")}
        >
          SELECT ETF
        </button>
        <button
          className={view === "portfolio" ? "is-active" : ""}
          type="button"
          aria-current={view === "portfolio" ? "page" : undefined}
          onClick={() => onViewChange("portfolio")}
        >
          PORTFOLIO
        </button>
      </nav>

      <span className="app-system-status"><i /> INDEX ONLINE</span>
    </header>
  );
}

function PortfolioView({ etf, onChange }: { etf: Etf; onChange: () => void }) {
  return (
    <main className="portfolio-page">
      <section className="portfolio-summary">
        <p className="section-kicker">SELECTED ETF / {etf.ticker}</p>
        <h1>{etf.name}</h1>
        <p className="portfolio-strategy">{etf.strategy}</p>
        <AsciiPlanet variant={etf.visual} />
        <dl className="portfolio-metrics">
          <div><dt>1Y RETURN</dt><dd>{etf.return1y}</dd></div>
          <div><dt>FEE</dt><dd>{etf.fee}</dd></div>
          <div><dt>RISK</dt><dd>{etf.risk}</dd></div>
        </dl>
        <button type="button" className="change-etf-button" onClick={onChange}>CHANGE ETF</button>
      </section>

      <section className="portfolio-allocation" aria-labelledby="portfolio-title">
        <header>
          <div>
            <p className="section-kicker">CURRENT ALLOCATION</p>
            <h2 id="portfolio-title">Portfolio</h2>
          </div>
          <strong>100.00%</strong>
        </header>
        <ol>
          {etf.holdings.map((holding, index) => (
            <li key={holding.symbol}>
              <span className="allocation-rank">{String(index + 1).padStart(2, "0")}</span>
              <strong>{holding.symbol}</strong>
              <span className="allocation-track"><i style={{ width: `${holding.weight}%` }} /></span>
              <b>{holding.weight.toFixed(2)}%</b>
            </li>
          ))}
        </ol>
        <p className="portfolio-note">Illustrative allocation. Holdings and weights may change at rebalance.</p>
      </section>
    </main>
  );
}

export default function Home() {
  const [appOpen, setAppOpen] = useState(false);
  const [view, setView] = useState<View>("select");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [selectedEtfId, setSelectedEtfId] = useState("next-frontier");

  const visibleEtfs = useMemo(
    () => activeFilter === "all" ? etfs : etfs.filter((etf) => etf.category === activeFilter),
    [activeFilter],
  );

  const selectedEtf = etfs.find((etf) => etf.id === selectedEtfId) ?? etfs[0];

  const changeFilter = (filter: Filter) => {
    setActiveFilter(filter);
    if (filter !== "all" && selectedEtf.category !== filter) {
      const firstMatch = etfs.find((etf) => etf.category === filter);
      if (firstMatch) setSelectedEtfId(firstMatch.id);
    }
  };

  const navigateCards = (id: string, direction: number) => {
    const currentIndex = visibleEtfs.findIndex((etf) => etf.id === id);
    const nextIndex = (currentIndex + direction + visibleEtfs.length) % visibleEtfs.length;
    const nextEtf = visibleEtfs[nextIndex];
    setSelectedEtfId(nextEtf.id);
    requestAnimationFrame(() => document.getElementById(`etf-card-${nextEtf.id}`)?.focus());
  };

  if (appOpen) {
    return (
      <div className="app-shell">
        <AppNav
          view={view}
          onOverview={() => setAppOpen(false)}
          onViewChange={setView}
        />

        {view === "select" ? (
          <main className="etf-select-page">
            <header className="etf-page-intro">
              <div>
                <p className="section-kicker">GANYMEDE STRATEGIES / 04</p>
                <h1>Choose your ETF</h1>
                <p>Compare four strategies and select one for your portfolio.</p>
              </div>
              <div className="etf-filters" role="group" aria-label="Filter ETF strategies">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={activeFilter === filter.id ? "is-active" : ""}
                    aria-pressed={activeFilter === filter.id}
                    onClick={() => changeFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </header>

            <section className="etf-card-grid" role="radiogroup" aria-label="ETF products">
              {visibleEtfs.map((etf) => (
                <EtfCard
                  key={etf.id}
                  etf={etf}
                  selected={selectedEtfId === etf.id}
                  onSelect={setSelectedEtfId}
                  onNavigate={navigateCards}
                />
              ))}
            </section>
          </main>
        ) : (
          <PortfolioView etf={selectedEtf} onChange={() => setView("select")} />
        )}

        <footer className="app-disclaimer">Returns are illustrative. Review the prospectus before investing.</footer>
      </div>
    );
  }

  return (
    <main className="ganymede-launch" aria-labelledby="hero-title">
      <GanymedeScene />
      <div className="launch-wordmark" aria-hidden="true"><span>G</span> PROJECT GANYMEDE</div>

      <section className="launch-copy">
        <p>A NEW ORBIT BEGINS</p>
        <h1 id="hero-title"><span>PROJECT</span><span>GANYMEDE</span></h1>
        <div className="launch-actions">
          <button
            className="launch-app"
            type="button"
            onClick={() => {
              setView("select");
              setAppOpen(true);
            }}
          >
            Launch App <span aria-hidden="true">&#8599;</span>
          </button>
        </div>
      </section>
    </main>
  );
}
