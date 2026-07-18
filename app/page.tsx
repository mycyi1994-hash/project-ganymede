"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import GanymedeScene from "./GanymedeScene";
import MiniAsciiCelestial from "./MiniAsciiCelestial";
import { etfs, type Etf, type Filter } from "./data/etfs";

type View = "select" | "portfolio";

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
          <p>{etf.tagline}</p>
        </div>
        <AsciiPlanet variant={etf.visual} />
      </div>

      <dl className="etf-metrics">
        <div><dt>1Y RETURN</dt><dd>{etf.oneYearReturn}</dd></div>
        <div><dt>FEE</dt><dd>{etf.fee}</dd></div>
        <div><dt>RISK</dt><dd>{etf.risk}</dd></div>
      </dl>

      <div className="etf-card-actions">
        <div className="holding-chips" aria-label="Top holdings">
          {etf.basket.slice(0, 2).map((holding) => (
            <span key={holding.ticker}>{holding.ticker} <b>{holding.weight}%</b></span>
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

function PortfolioView({ products, onChange, onRemove }: {
  products: Etf[];
  onChange: () => void;
  onRemove: (etf: Etf) => void;
}) {
  const [syncLabel, setSyncLabel] = useState("REBALANCE MODEL");
  const strategyWeight = 100 / products.length;
  const palette = ["#eeede8", "#aaa9a4", "#777671", "#4d4c49"];
  const blendedReturn = products.reduce((sum, product) => sum + Number.parseFloat(product.oneYearReturn), 0) / products.length;
  const blendedFee = products.reduce((sum, product) => sum + Number.parseFloat(product.fee), 0) / products.length;
  const riskScore = products.reduce((sum, product) => sum + ({ LOW: 1, MEDIUM: 2, HIGH: 3 }[product.risk]), 0) / products.length;
  const blendedRisk = riskScore >= 2.45 ? "HIGH" : riskScore >= 1.55 ? "MEDIUM" : "LOW";
  const uniqueAssets = new Set(products.flatMap((product) => product.basket.map((holding) => holding.ticker))).size;

  const exposures = Array.from(products.reduce((map, product) => {
    product.basket.forEach((holding) => {
      const current = map.get(holding.ticker) ?? { ticker: holding.ticker, name: holding.name, weight: 0 };
      current.weight += holding.weight / products.length;
      map.set(holding.ticker, current);
    });
    return map;
  }, new Map<string, { ticker: string; name: string; weight: number }>()).values())
    .sort((a, b) => b.weight - a.weight);

  let cursor = 0;
  const ringStops = products.map((product, index) => {
    const start = cursor;
    cursor += strategyWeight;
    return `${palette[index]} ${start}% ${cursor}%`;
  }).join(",");

  return (
    <main className="portfolio-page">
      <header className="portfolio-header">
        <div>
          <p className="section-kicker">PORTFOLIO CONTROL / MODEL 01</p>
          <h1>Mission portfolio</h1>
          <p>A live model combining your selected Ganymede strategies.</p>
        </div>
        <div className="portfolio-header-actions">
          <span><i /> MODEL ONLINE</span>
          <button type="button" onClick={onChange}>ADD STRATEGY</button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              setSyncLabel("MODEL SYNCED");
              window.setTimeout(() => setSyncLabel("REBALANCE MODEL"), 1800);
            }}
          >{syncLabel}</button>
        </div>
      </header>

      <dl className="portfolio-kpis">
        <div><dt>MODEL VALUE</dt><dd>$100,000</dd><small>Illustrative capital</small></div>
        <div><dt>BLENDED 1Y</dt><dd>+{blendedReturn.toFixed(1)}%</dd><small>Weighted strategy return</small></div>
        <div><dt>WEIGHTED FEE</dt><dd>{blendedFee.toFixed(2)}%</dd><small>Annual expense ratio</small></div>
        <div><dt>RISK SIGNAL</dt><dd>{blendedRisk}</dd><small>{uniqueAssets} unique assets</small></div>
      </dl>

      <div className="portfolio-workspace">
        <section className="portfolio-strategies" aria-labelledby="portfolio-title">
          <header>
            <div>
              <p className="section-kicker">STRATEGY ALLOCATION</p>
              <h2 id="portfolio-title">Selected ETFs</h2>
            </div>
            <strong>{products.length.toString().padStart(2, "0")} / 04</strong>
          </header>
          <div className="portfolio-strategy-body">
            <div className="portfolio-ring" style={{ background: `conic-gradient(${ringStops})` }} role="img" aria-label={`${products.length} equally weighted ETF strategies`}>
              <span><b>100</b><small>% DEPLOYED</small></span>
            </div>
            <ol className="portfolio-strategy-list">
              {products.map((product, index) => (
                <li key={product.id}>
                  <i style={{ background: palette[index] }} />
                  <span><b>{product.ticker}</b><small>{product.name}</small></span>
                  <strong>{strategyWeight.toFixed(1)}%</strong>
                  <button type="button" onClick={() => onRemove(product)} aria-label={`Remove ${product.name}`}>×</button>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="portfolio-exposure" aria-labelledby="exposure-title">
          <header>
            <div>
              <p className="section-kicker">LOOK-THROUGH EXPOSURE</p>
              <h2 id="exposure-title">Underlying assets</h2>
            </div>
            <strong>{uniqueAssets.toString().padStart(2, "0")} ASSETS</strong>
          </header>
          <ol>
            {exposures.slice(0, 8).map((holding, index) => (
              <li key={holding.ticker}>
                <span className="allocation-rank">{String(index + 1).padStart(2, "0")}</span>
                <strong>{holding.ticker}</strong>
                <span className="exposure-name">{holding.name}</span>
                <span className="allocation-track"><i style={{ width: `${Math.min(100, holding.weight * 2.25)}%` }} /></span>
                <b>{holding.weight.toFixed(1)}%</b>
              </li>
            ))}
          </ol>
          <p className="portfolio-note">Combined exposure is calculated from the current model weights. OTHER may include additional qualifying assets.</p>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  const [appOpen, setAppOpen] = useState(false);
  const [view, setView] = useState<View>("select");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [selectedEtfId, setSelectedEtfId] = useState("next-frontier");
  const [portfolioEtfIds, setPortfolioEtfIds] = useState<string[]>([]);

  const visibleEtfs = useMemo(
    () => activeFilter === "all" ? etfs : etfs.filter((etf) => etf.category === activeFilter),
    [activeFilter],
  );

  const selectedEtf = etfs.find((etf) => etf.id === selectedEtfId) ?? etfs[0];
  const portfolioEtfs = (portfolioEtfIds.length
    ? portfolioEtfIds.map((id) => etfs.find((etf) => etf.id === id)).filter((etf): etf is Etf => Boolean(etf))
    : [selectedEtf]);

  const refreshPortfolio = () => {
    let savedIds: string[] = [];
    try {
      savedIds = JSON.parse(localStorage.getItem("ganymede-portfolio-ids") ?? "[]");
    } catch {
      savedIds = [];
    }
    const validIds = etfs
      .filter((etf) => savedIds.includes(etf.id) || localStorage.getItem(`ganymede-portfolio-${etf.slug}`) === "added")
      .map((etf) => etf.id);
    setPortfolioEtfIds(validIds);
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const returningToSelection = query.get("app") === "select";
    const savedFilter = sessionStorage.getItem("ganymede-etf-filter") as Filter | null;
    const savedSelection = sessionStorage.getItem("ganymede-etf-selection");

    if (returningToSelection) setAppOpen(true);
    if (savedFilter && filters.some((filter) => filter.id === savedFilter)) setActiveFilter(savedFilter);
    if (savedSelection && etfs.some((etf) => etf.id === savedSelection)) setSelectedEtfId(savedSelection);
    refreshPortfolio();

    if (returningToSelection) {
      requestAnimationFrame(() => {
        const savedScroll = Number(sessionStorage.getItem("ganymede-etf-scroll") ?? 0);
        document.querySelector<HTMLElement>(".etf-select-page")?.scrollTo({ top: savedScroll });
      });
    }
  }, []);

  const changeFilter = (filter: Filter) => {
    setActiveFilter(filter);
    sessionStorage.setItem("ganymede-etf-filter", filter);
    if (filter !== "all" && selectedEtf.category !== filter) {
      const firstMatch = etfs.find((etf) => etf.category === filter);
      if (firstMatch) setSelectedEtfId(firstMatch.id);
    }
  };

  const openEtfDetail = (id: string) => {
    const etf = etfs.find((candidate) => candidate.id === id);
    if (!etf) return;
    const selectionPage = document.querySelector<HTMLElement>(".etf-select-page");
    sessionStorage.setItem("ganymede-etf-filter", activeFilter);
    sessionStorage.setItem("ganymede-etf-selection", id);
    sessionStorage.setItem("ganymede-etf-scroll", String(selectionPage?.scrollTop ?? 0));
    window.location.assign(`/etfs/${etf.slug}`);
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
          onViewChange={(nextView) => {
            if (nextView === "portfolio") refreshPortfolio();
            setView(nextView);
          }}
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
                  onSelect={openEtfDetail}
                  onNavigate={navigateCards}
                />
              ))}
            </section>
          </main>
        ) : (
          <PortfolioView
            products={portfolioEtfs}
            onChange={() => setView("select")}
            onRemove={(product) => {
              localStorage.removeItem(`ganymede-portfolio-${product.slug}`);
              const nextIds = portfolioEtfIds.filter((id) => id !== product.id);
              localStorage.setItem("ganymede-portfolio-ids", JSON.stringify(nextIds));
              setPortfolioEtfIds(nextIds);
            }}
          />
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
