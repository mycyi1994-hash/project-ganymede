"use client";

import { useEffect, useState } from "react";
import GanymedeScene from "./GanymedeScene";
import { formatUsdMicros } from "@/lib/nav-display";

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
    ? record ? "Last loaded record · refresh unavailable" : "Record unavailable"
    : record ? "Recorded on chain" : snapshot ? "Awaiting publication" : "Loading on-chain record";
  const nav = record ? formatUsdMicros(record.navPerShareMicros, 4) : "—";

  return (
    <section className="launch-proof-panel" aria-labelledby="preview-title">
      <div className="preview-heading"><span className="preview-eyebrow">THE NAV OBSERVATORY</span><span className="preview-network">TESTNET</span></div>
      <div className="preview-identity"><div><span>GMD USTX</span><h2 id="preview-title">US Tech<br />basket.</h2></div><div className="preview-orbit" aria-hidden="true"><GanymedeScene /></div></div>
      <div className="preview-reading" aria-live="polite" aria-atomic="true">
        <div><span>LAST ON-CHAIN NAV / USD</span><strong>{nav}</strong></div>
        <span className={`preview-state${record && !unavailable && !snapshot?.onchainError ? " is-published" : ""}`}><i />{status}</span>
      </div>
      <dl className="preview-facts"><div><dt>Record effective</dt><dd>{record?.effectiveAt ? new Date(record.effectiveAt).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—"}</dd></div><div><dt>Recorded on</dt><dd>{snapshot?.registry.chainName ?? "X Layer Testnet"}</dd></div></dl>
      <div className="preview-footer"><span>One model share · Last published value</span><a href="/proof">Open evidence <span aria-hidden="true">↗</span></a></div>
    </section>
  );
}
