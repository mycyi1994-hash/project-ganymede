"use client";

import { useState } from "react";
import GanymedeScene from "./GanymedeScene";

const chestArt = String.raw`
                     .+============================+.
                 .+====================================+.
              .+==========================================+.
            .+==============================================+.
           /==================================================\
          /====================================================\
         |====+------------------------------------------+======|
         |====|                                          |======|
         |====|       .--------------------------.       |======|
         |====|      /   G A N Y M E D E  /  10   \      |======|
         |====|      '--------------------------'       |======|
         |====|                                          |======|
         |====+-------------------+----------------------+======|
         |========================|=============================|
         |=====================+--+--+==========================|
         |=====================| [G] |==========================|
         |=====================+--+--+==========================|
         |========================|=============================|
         |======================================================|
         |======================================================|
         |======================================================|
         +======================================================+
          \____________________________________________________/
             /__/                                      \__\
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

export default function Home() {
  const [appOpen, setAppOpen] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);

  if (appOpen) {
    return (
      <main className="fund-app" aria-label="Ganymede crypto ETF basket">
        <section className="basket-stage" aria-labelledby="basket-title">
          <div className="app-mark" aria-hidden="true">G / GMDE-10</div>
          <p className="basket-kicker">BASKET / 01</p>
          <h1 id="basket-title">Market Cap<br />Core Basket</h1>

          <button
            className={`ascii-chest${basketOpen ? " is-open" : ""}`}
            type="button"
            aria-pressed={basketOpen}
            onClick={() => setBasketOpen(true)}
          >
            <pre aria-hidden="true">{chestArt}</pre>
            <span>{basketOpen ? "BASKET OPEN / HOLDINGS REVEALED" : "CLICK BASKET TO REVEAL HOLDINGS"}</span>
          </button>
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

          {basketOpen ? (
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
          ) : (
            <div className="basket-locked">
              <span>[ BASKET LOCKED ]</span>
              <p>Select the ASCII basket to inspect its underlying digital assets.</p>
            </div>
          )}

          <footer className="method-note">
            <span>MARKET-CAP UNIVERSE SNAPSHOT / COINGECKO</span>
            <span>STABLECOINS, WRAPPERS &amp; DERIVATIVE TOKENS EXCLUDED</span>
            <small>Prototype composition only. Not investment advice.</small>
          </footer>
        </aside>
      </main>
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
