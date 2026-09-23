"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  onchain: { navPerShareMicros: string; effectiveAt: string | null } | null;
  registry: { chainName: string };
  onchainError: string | null;
};

export default function NavPreview() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/xstocks", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("NAV unavailable");
        setSnapshot(await response.json() as Snapshot);
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    };
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  const record = snapshot?.onchain?.effectiveAt ? snapshot.onchain : null;
  const status = unavailable || snapshot?.onchainError
    ? "Record unavailable"
    : record ? "Published on chain" : snapshot ? "Awaiting publication" : "Loading on-chain record";
  // Truncate like the proof page, so both show the same NAV rather than a rounded one.
  const micros = record ? BigInt(record.navPerShareMicros) : null;
  const nav = micros !== null ? `$${(micros / 1_000_000n).toLocaleString("en-US")}.${(micros % 1_000_000n).toString().padStart(6, "0").slice(0, 4)}` : "—";

  return (
    <section className="launch-proof-panel" aria-labelledby="preview-title">
      <div className="preview-heading"><span className="preview-eyebrow">TOKENIZED STOCKS / GMD USTX</span><span className="preview-network">TESTNET</span></div>
      <h2 id="preview-title">One basket. Every number traceable.</h2>
      <p>Six US tech xStocks. Inspect the composition behind the published NAV.</p>
      <div className="preview-reading" aria-live="polite" aria-atomic="true">
        <div><span>LAST ON-CHAIN NAV / USD</span><strong>{nav}</strong></div>
        <span className={`preview-state${record && !unavailable && !snapshot?.onchainError ? " is-published" : ""}`}><i />{status}</span>
      </div>
      <div className="preview-footer"><span>{record?.effectiveAt ? `${new Date(record.effectiveAt).toISOString().slice(11, 16)} UTC · ${snapshot?.registry.chainName}` : "X Layer Testnet · model basket"}</span><a href="/proof">Inspect proof <span aria-hidden="true">↗</span></a></div>
    </section>
  );
}
