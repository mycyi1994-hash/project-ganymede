"use client";

import { useState } from "react";
import { changedPriceCopy } from "@/lib/xstocks/proof-experiment";
import { verifyComposition } from "@/lib/xstocks/proof";
import type { OnchainNav } from "@/lib/xstocks/onchain";
import { formatRecordTime } from "@/lib/nav-status";
import { formatUsdMicros } from "@/lib/nav-display";

type Result = Awaited<ReturnType<typeof verifyComposition>>;

export default function ProofExperiment({ canonical, record }: { canonical: string; record: OnchainNav }) {
  const [result, setResult] = useState<{ mode: "original" | "changed"; checks: Result } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const changed = changedPriceCopy(canonical);
  const run = async (mode: "original" | "changed") => {
    setBusy(true); setError("");
    try {
      const checks = await verifyComposition(mode === "changed" ? changed.canonical : canonical, record);
      setResult({ mode, checks });
    } catch {
      setResult(null); setError("This browser could not run the checks. Try again; no record was changed.");
    } finally { setBusy(false); }
  };
  return <section className="proof-section proof-experiment" aria-labelledby="experiment-title">
    <header><p className="proof-kicker">Test a copy of this report</p><h2 id="experiment-title">What happens if one price changes?</h2><p>Add $1 to {changed.symbol} in a local copy. The reported holding values and chain record stay unchanged, so the checks should detect the difference.</p></header>
    <p className="proof-footnote">Verified snapshot effective {formatRecordTime(record.effectiveAt)}. This experiment stays on that snapshot while a refresh is in progress.</p>
    <div className="experiment-prices"><div><span>Published {changed.symbol} price</span><strong>{formatUsdMicros(changed.originalPrice, 4)}</strong></div><span aria-hidden="true">→</span><div><span>{result?.mode === "changed" ? "Price in your edited copy" : "Price in your original copy"}</span><strong>{formatUsdMicros(result?.mode === "changed" ? changed.changedPrice : changed.originalPrice, 4)}</strong></div></div>
    <div className="experiment-actions"><button type="button" className="button is-primary" onClick={() => void run("changed")} disabled={busy}>Change price by $1 & verify</button><button type="button" className="button" onClick={() => void run("original")} disabled={busy}>{result?.mode === "changed" ? "Restore original & verify" : "Verify original copy"}</button></div>
    <div className="experiment-outcome" role="status" aria-live="polite" aria-atomic="true" aria-busy={busy}>
      {busy ? <p>Recalculating the hash and NAV in your browser…</p> : error ? <p>{error}</p> : result ? <><h3>{result.mode === "changed" ? "Edited copy: actual verification results" : "Original document: actual verification results"}</h3><dl>{[{ label: "Document fingerprint", evidence: result.checks.hash }, { label: "NAV calculation", evidence: result.checks.nav }].map(({label, evidence}) => {
        return <div key={String(label)} className={`experiment-check is-${evidence.state}`}><dt>{String(label)}</dt><dd><strong>{evidence.state === "pass" ? "Matched" : evidence.state === "fail" ? "Mismatch detected" : "Not yet checked"}</strong><p>{evidence.detail}</p></dd></div>;
      })}</dl></> : <p>The original report passed verification before this experiment opened. Change its price to test whether the same checks detect an edited copy.</p>}
    </div>
    <p className="proof-footnote">Runs entirely in this browser. No transaction, upload or change to published data. A newly loaded record resets this experiment. These checks do not establish asset backing or price accuracy.</p>
  </section>;
}
