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

function PortfolioView({ etf, onChange }: { etf: Etf; onChange: () => void }) {
  return (
    <main className="portfolio-page">
      <section className="portfolio-summary">
        <p className="section-kicker">SELECTED ETF / {etf.ticker}</p>
        <h1>{etf.name}</h1>
        <p className="portfolio-strategy">{etf.tagline}</p>
        <AsciiPlanet variant={etf.visual} />
        <dl className="portfolio-metrics">
          <div><dt>1Y RETURN</dt><dd>{etf.oneYearReturn}</dd></div>
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
          {etf.basket.map((holding, index) => (
            <li key={holding.ticker}>
              <span className="allocation-rank">{String(index + 1).padStart(2, "0")}</span>
              <strong>{holding.ticker}</strong>
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

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const returningToSelection = query.get("app") === "select";
    const savedFilter = sessionStorage.getItem("ganymede-etf-filter") as Filter | null;
    const savedSelection = sessionStorage.getItem("ganymede-etf-selection");

    if (returningToSelection) setAppOpen(true);
    if (savedFilter && filters.some((filter) => filter.id === savedFilter)) setActiveFilter(savedFilter);
    if (savedSelection && etfs.some((etf) => etf.id === savedSelection)) setSelectedEtfId(savedSelection);

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
                  onSelect={openEtfDetail}
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
