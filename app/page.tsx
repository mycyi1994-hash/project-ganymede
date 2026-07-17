"use client";

import { useState } from "react";
import GanymedeScene from "./GanymedeScene";

const chestArt = (id: string) => String.raw`
                       .--------------------------.
                  _.-'============================'-._
             _.-'======================================='-._
          .-'==============================================='-.
         /=====================================================\
        /_______________________________________________________\
       /                                                  _.-'
      /_______________________________________________..-'
                 ||                              ||
                 ||   *   +   *   +   *          ||
       .---------''--------------------------------''---------.
      /       *       DIGITAL ASSET RESERVE       *          /|
     /_______________________________________________________/ |
    |                                                       | |
    |      .-----------------------------------------.      | |
    |      |              BASKET / ${id}              |      | |
    |      '-----------------------------------------'      | |
    |==========================+============================| |
    |=======================+--+--+=========================| |
    |=======================| [G] |=========================| /
    |=======================+-----+=========================|/
    +=======================================================+
     \_____________________________________________________/
`;

const holdings = [
  ["BTC", "Bitcoin"],
  ["ETH", "Ethereum"],
  ["BNB", "BNB"],
  ["XRP", "XRP"],
  ["SOL", "Solana"],
  ["TRX", "TRON"],
  ["HYPE", "Hyperliquid"],
  ["DOGE", "Dogecoin"],
  ["RAIN", "Rain"],
  ["LEO", "LEO Token"],
];

const baskets = [
  { id: "01", name: "Market Cap Core", meta: "10 ASSETS / EQUAL WEIGHT", status: "AVAILABLE" },
  { id: "02", name: "Smart Contract Leaders", meta: "INDEX DESIGN IN PROGRESS", status: "LOCKED" },
  { id: "03", name: "Digital Infrastructure", meta: "INDEX DESIGN IN PROGRESS", status: "LOCKED" },
  { id: "04", name: "Alpha Satellite", meta: "INDEX DESIGN IN PROGRESS", status: "LOCKED" },
];

export default function Home() {
  const [appOpen, setAppOpen] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState<number | null>(null);

  if (appOpen) {
    const showingBaskets = selectedBasket === null;

    return (
      <div className="app-shell">
        <header className="app-topbar">
          <button
            className="app-identity"
            type="button"
            onClick={() => {
              setSelectedBasket(null);
              setAppOpen(false);
            }}
          >
            <span>G</span>
            <strong>GANYMEDE INDEX</strong>
            <small>CRYPTO ETF SYSTEM</small>
          </button>

          <nav className="app-menu" aria-label="Application sections">
            <button
              type="button"
              onClick={() => {
                setSelectedBasket(null);
                setAppOpen(false);
              }}
            >
              <b>00</b> Overview
            </button>
            <button
              className={showingBaskets ? "is-active" : ""}
              type="button"
              aria-current={showingBaskets ? "page" : undefined}
              onClick={() => setSelectedBasket(null)}
            >
              <b>01</b> Baskets
            </button>
            <button
              className={showingBaskets ? "" : "is-active"}
              type="button"
              aria-current={showingBaskets ? undefined : "page"}
              onClick={() => setSelectedBasket(0)}
            >
              <b>02</b> Composition
            </button>
          </nav>

          <span className="app-system-status"><i /> INDEX ONLINE</span>
        </header>

        {showingBaskets ? (
          <main className="basket-grid" aria-label="Ganymede ETF basket selection">
            {baskets.map((basket, index) => (
              <button
                className={`basket-card${index === 0 ? " is-available" : " is-locked"}`}
                type="button"
                key={basket.id}
                disabled={index !== 0}
                onClick={() => setSelectedBasket(index)}
              >
                <span className="basket-card-index">BASKET / {basket.id}</span>
                <span className="basket-card-status"><i /> {basket.status}</span>
                <pre aria-hidden="true">{chestArt(basket.id)}</pre>
                <span className="basket-card-copy">
                  <strong>{basket.name}</strong>
                  <small>{basket.meta}</small>
                </span>
              </button>
            ))}
          </main>
        ) : (
          <main className="fund-detail" aria-label="Ganymede crypto ETF basket">
            <section className="detail-basket-panel" aria-labelledby="basket-title">
              <button className="back-to-baskets" type="button" onClick={() => setSelectedBasket(null)}>
                <span aria-hidden="true">&#8592;</span> All Baskets
              </button>
              <p className="basket-kicker">BASKET / 01</p>
              <h1 id="basket-title">Market Cap<br />Core Basket</h1>
              <div className="detail-chest">
                <pre aria-hidden="true">{chestArt("01")}</pre>
                <span>BASKET OPEN / HOLDINGS REVEALED</span>
              </div>
            </section>

            <aside className="holdings-panel" aria-live="polite">
              <header className="holdings-header">
                <div>
                  <p>GANYMEDE INDEX / GMDE-10</p>
                  <h2>Basket<br />Composition</h2>
                </div>
                <span className="fund-status"><i /> ACTIVE</span>
              </header>

              <div className="fund-metrics" aria-label="Basket methodology">
                <span><b>10</b> ASSETS</span>
                <span><b>10.0%</b> EACH</span>
                <span><b>0</b> STABLECOINS</span>
              </div>

              <ol className="holdings-list">
                {holdings.map(([symbol, name], index) => (
                  <li key={symbol}>
                    <span className="holding-rank">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{symbol}</strong>
                    <span className="holding-name">{name}</span>
                    <span className="holding-weight">10.00%</span>
                  </li>
                ))}
              </ol>

              <footer className="method-note">
                <span>MARKET-CAP UNIVERSE SNAPSHOT / COINGECKO</span>
                <span>STABLECOINS, WRAPPERS &amp; DERIVATIVE TOKENS EXCLUDED</span>
                <small>Prototype composition only. Not investment advice.</small>
              </footer>
            </aside>
          </main>
        )}

        <footer className="app-statusbar">
          <span>{showingBaskets ? "SELECT A TREASURE CHEST TO INSPECT ITS UNDERLYING ASSETS" : "MARKET CAP CORE / EQUAL-WEIGHT COMPOSITION"}</span>
          <span><b>01</b> AVAILABLE <i /> <b>03</b> IN DEVELOPMENT</span>
          <span>GMDE / INDEX PROTOCOL</span>
        </footer>
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
          <button className="launch-app" type="button" onClick={() => setAppOpen(true)}>
            Launch App <span aria-hidden="true">&#8599;</span>
          </button>
        </div>
      </section>
    </main>
  );
}
