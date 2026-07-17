"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import MiniAsciiCelestial from "../../MiniAsciiCelestial";
import type { BasketAsset, Etf } from "../../data/etfs";

type BasketTab = "allocation" | "assets" | "methodology";

const tabs: Array<{ id: BasketTab; label: string }> = [
  { id: "allocation", label: "ALLOCATION" },
  { id: "assets", label: "ASSET LIST" },
  { id: "methodology", label: "METHODOLOGY" },
];

const shades = ["#eeede8", "#aaa9a4", "#85847f", "#64635f", "#4d4c49", "#393936"];

function assetShade(index: number, ticker: string, highlighted: string | null) {
  if (!highlighted) return shades[index % shades.length];
  return highlighted === ticker ? "#ffffff" : ["#5a5955", "#474642", "#3c3b38", "#343330", "#2d2c2a", "#272624"][index % 6];
}

function AssetMark({ asset }: { asset: BasketAsset }) {
  return <span className={`detail-asset-mark mark-${asset.iconKey}`} aria-hidden="true">{asset.ticker.slice(0, 1)}</span>;
}

function BasketTabs({ active, onChange }: { active: BasketTab; onChange: (tab: BasketTab) => void }) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: BasketTab) => {
    if (!(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabs.findIndex((tab) => tab.id === current);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const next = tabs[nextIndex].id;
    onChange(next);
    requestAnimationFrame(() => document.getElementById(`basket-tab-${next}`)?.focus());
  };

  return (
    <div className="basket-tabs" role="tablist" aria-label="Basket details">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`basket-tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          aria-controls={`basket-panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          className={active === tab.id ? "is-active" : ""}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AllocationDonut({ basket, highlighted, onHighlight }: {
  basket: BasketAsset[];
  highlighted: string | null;
  onHighlight: (ticker: string | null) => void;
}) {
  let cursor = 0;
  const stops = basket.map((asset, index) => {
    const start = cursor;
    cursor += asset.weight;
    return `${assetShade(index, asset.ticker, highlighted)} ${start}% ${cursor}%`;
  });
  const label = basket.map((asset) => `${asset.name} ${asset.weight}%`).join(", ");

  return (
    <div className="allocation-visual">
      <div
        className="allocation-donut"
        role="img"
        aria-label={`ETF allocation: ${label}`}
        style={{ background: `conic-gradient(${stops.join(",")})` }}
      >
        <span><b>100</b><small>% ALLOCATED</small></span>
      </div>
      <ul className="allocation-legend" aria-label="Allocation legend">
        {basket.map((asset, index) => (
          <li key={asset.ticker}>
            <button
              type="button"
              className={highlighted === asset.ticker ? "is-highlighted" : ""}
              onMouseEnter={() => onHighlight(asset.ticker)}
              onMouseLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(asset.ticker)}
              onBlur={() => onHighlight(null)}
            >
              <i style={{ background: assetShade(index, asset.ticker, highlighted) }} />
              <strong>{asset.ticker}</strong>
              <span>{asset.name}</span>
              <em />
              <b>{asset.weight}%</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllocationStackedBar({ basket, highlighted, onHighlight }: {
  basket: BasketAsset[];
  highlighted: string | null;
  onHighlight: (ticker: string | null) => void;
}) {
  return (
    <div className="allocation-stack" aria-label="100% stacked allocation bar">
      {basket.map((asset, index) => (
        <button
          key={asset.ticker}
          type="button"
          style={{ width: `${asset.weight}%`, background: assetShade(index, asset.ticker, highlighted) }}
          aria-label={`${asset.name}, ${asset.weight}%`}
          onMouseEnter={() => onHighlight(asset.ticker)}
          onMouseLeave={() => onHighlight(null)}
          onFocus={() => onHighlight(asset.ticker)}
          onBlur={() => onHighlight(null)}
        >
          {asset.weight >= 7 ? `${asset.weight}%` : ""}
        </button>
      ))}
    </div>
  );
}

function HoldingsTable({ basket, highlighted, onHighlight }: {
  basket: BasketAsset[];
  highlighted: string | null;
  onHighlight: (ticker: string | null) => void;
}) {
  const maximum = Math.max(...basket.map((asset) => asset.weight));

  return (
    <div className="holdings-table" role="table" aria-label="ETF basket holdings">
      <div className="holding-row holding-head" role="row">
        <span role="columnheader">#</span><span role="columnheader">TICKER</span><span role="columnheader">ASSET</span><span role="columnheader">ALLOCATION</span><span role="columnheader">WEIGHT</span>
      </div>
      {basket.map((asset) => (
        <button
          className={`holding-row${highlighted === asset.ticker ? " is-highlighted" : ""}`}
          role="row"
          type="button"
          key={asset.ticker}
          onMouseEnter={() => onHighlight(asset.ticker)}
          onMouseLeave={() => onHighlight(null)}
          onFocus={() => onHighlight(asset.ticker)}
          onBlur={() => onHighlight(null)}
        >
          <span role="cell">{String(asset.rank).padStart(2, "0")}</span>
          <span role="cell" className="holding-ticker"><AssetMark asset={asset} /><b>{asset.ticker}</b></span>
          <span role="cell" className="holding-name">{asset.name}</span>
          <span role="cell" className="holding-progress"><i><b style={{ width: `${(asset.weight / maximum) * 100}%` }} /></i></span>
          <span role="cell" className="holding-weight">{asset.weight}%</span>
        </button>
      ))}
    </div>
  );
}

function SummaryCards({ etf }: { etf: Etf }) {
  const maximum = Math.max(...etf.basket.map((asset) => asset.weight));
  const assetClasses = new Set(etf.basket.map((asset) => asset.assetClass)).size;
  return (
    <aside className="basket-summary-cards" aria-label="Basket summary">
      <div><span className="summary-symbol">&#10244;</span><p>LARGEST POSITION</p><strong>{maximum}<small>%</small></strong></div>
      <div><span className="summary-symbol">&#11041;</span><p>ASSET CLASSES</p><strong>{String(assetClasses).padStart(2, "0")}</strong></div>
      <div><span className="summary-symbol">&#9638;</span><p>LAST REBALANCED</p><strong className="summary-date">{etf.lastRebalanced}</strong></div>
    </aside>
  );
}

function AllocationPanel({ etf }: { etf: Etf }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  return (
    <div className="allocation-panel">
      <AllocationDonut basket={etf.basket} highlighted={highlighted} onHighlight={setHighlighted} />
      <AllocationStackedBar basket={etf.basket} highlighted={highlighted} onHighlight={setHighlighted} />
      <div className="holdings-and-summary">
        <HoldingsTable basket={etf.basket} highlighted={highlighted} onHighlight={setHighlighted} />
        <SummaryCards etf={etf} />
      </div>
      <p className="basket-caveat"><span aria-hidden="true">i</span> Weights are illustrative and may change at each rebalance.</p>
    </div>
  );
}

function AssetListPanel({ etf }: { etf: Etf }) {
  return (
    <div className="asset-list-panel">
      <div className="asset-list-header"><span>RANK / ASSET</span><span>CLASS</span><span>ROLE IN BASKET</span><span>WEIGHT</span></div>
      {etf.basket.map((asset) => (
        <article key={asset.ticker} className="asset-list-row">
          <div><small>{String(asset.rank).padStart(2, "0")}</small><AssetMark asset={asset} /><p><b>{asset.ticker}</b><span>{asset.name}</span></p></div>
          <strong>{asset.assetClass}</strong>
          <p>{asset.description}</p>
          <em>{asset.weight}%</em>
        </article>
      ))}
    </div>
  );
}

function MethodologyPanel({ etf }: { etf: Etf }) {
  const items = [
    ["01 / SELECTION", etf.methodology.selection],
    ["02 / WEIGHTING", etf.methodology.weighting],
    ["03 / REBALANCING", etf.methodology.rebalance],
    ["04 / ELIGIBILITY", etf.methodology.eligibility],
    ["05 / POSITION LIMITS", etf.methodology.limits],
    ["06 / RISK NOTICE", etf.methodology.risk],
  ];
  return <div className="methodology-panel">{items.map(([label, copy]) => <article key={label}><span>{label}</span><p>{copy}</p></article>)}</div>;
}

export default function EtfDetailClient({ etf }: { etf: Etf }) {
  const [activeTab, setActiveTab] = useState<BasketTab>("allocation");
  const [added, setAdded] = useState(false);
  const totalWeight = useMemo(() => etf.basket.reduce((sum, asset) => sum + asset.weight, 0), [etf.basket]);

  useEffect(() => {
    setAdded(localStorage.getItem(`ganymede-portfolio-${etf.slug}`) === "added");
  }, [etf.slug]);

  const addToPortfolio = () => {
    localStorage.setItem(`ganymede-portfolio-${etf.slug}`, "added");
    setAdded(true);
  };

  const showMethodology = () => {
    setActiveTab("methodology");
    requestAnimationFrame(() => document.getElementById("basket-tab-methodology")?.focus());
  };

  return (
    <main className="etf-detail-shell">
      <header className="detail-topbar">
        <button type="button" className="detail-brand" onClick={() => window.location.assign("/")} aria-label="Ganymede Index overview"><span>G</span><strong>GANYMEDE INDEX</strong></button>
        <p>SELECT ETF <i>/</i> {etf.ticker}</p>
        <span className="detail-system"><i /> INDEX ONLINE</span>
      </header>

      <div className="etf-detail-layout">
        <section className="etf-identity-panel" aria-labelledby="detail-product-name">
          <button className="detail-back" type="button" onClick={() => window.location.assign("/?app=select")}>&larr; BACK TO ETF SELECTION</button>
          <div className="detail-identity-copy">
            <p className="detail-kicker">ETF / {etf.ticker}</p>
            <h1 id="detail-product-name">{etf.name}</h1>
            <h2>{etf.tagline}</h2>
            <p>{etf.description}</p>
          </div>

          <dl className="detail-metrics">
            <div><dt>1Y RETURN</dt><dd>{etf.oneYearReturn}</dd></div>
            <div><dt>FEE</dt><dd>{etf.fee}</dd></div>
            <div><dt>RISK</dt><dd>{etf.risk}</dd></div>
          </dl>

          <div className="detail-facts">
            <span><i aria-hidden="true">&#10248;</i><b>{etf.assetCount} ASSETS</b></span>
            <span><i aria-hidden="true">&#8635;</i><b>{etf.rebalanceFrequency} REBALANCING</b></span>
            <span><i aria-hidden="true">&#8857;</i><b>{etf.strategyType}</b></span>
          </div>

          <div className="detail-particle-visual" aria-label={`${etf.name} animated ASCII product planet`}><MiniAsciiCelestial variant={etf.visual} /></div>

          <div className="detail-actions">
            <button type="button" className="fact-sheet-action" onClick={showMethodology}>VIEW FACT SHEET <span aria-hidden="true">&#8599;</span></button>
            <button type="button" className={`portfolio-action${added ? " is-added" : ""}`} onClick={addToPortfolio} aria-pressed={added}>{added ? "ADDED TO PORTFOLIO" : "ADD TO PORTFOLIO"}</button>
          </div>
        </section>

        <section className="basket-composition-panel" aria-labelledby="basket-title">
          <header className="basket-header">
            <div><h2 id="basket-title">BASKET COMPOSITION</h2><p>{etf.assetCount} assets &middot; {totalWeight}% allocated</p></div>
            <span>ETF / {etf.ticker}</span>
          </header>
          <BasketTabs active={activeTab} onChange={setActiveTab} />
          <div id={`basket-panel-${activeTab}`} role="tabpanel" aria-labelledby={`basket-tab-${activeTab}`} className="basket-tab-panel">
            {activeTab === "allocation" && <AllocationPanel etf={etf} />}
            {activeTab === "assets" && <AssetListPanel etf={etf} />}
            {activeTab === "methodology" && <MethodologyPanel etf={etf} />}
          </div>
        </section>
      </div>
    </main>
  );
}
