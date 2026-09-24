"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "../DesignElements";
import { Icon } from "./Icons";
import { MarketProvider } from "./MarketProvider";
import "./product.css";

export type ProductSection = "markets" | "portfolio" | "activity";
export type DesignScreen = "markets" | "product" | "order" | "portfolio" | "holding" | "activity" | "transaction";
export function designLink(screen: DesignScreen, scenario?: string) { return `/design-preview?screen=${screen}${scenario ? `&scenario=${scenario}` : ""}`; }

function AccountControl() {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const provider = window.okxwallet ?? window.ethereum;
    let alive = true;
    if (!provider) return;
    void provider.request({ method: "eth_accounts" }).then(accounts => { if (alive) setAddress((accounts as string[])[0] ?? ""); }).catch(() => {});
    const changed = (...args: unknown[]) => { setAddress((args[0] as string[])[0] ?? ""); setMessage(""); };
    provider.on?.("accountsChanged", changed);
    return () => { alive = false; provider.removeListener?.("accountsChanged", changed); };
  }, []);
  async function connect() {
    const provider = window.okxwallet ?? window.ethereum;
    setMessage("");
    if (!provider) { setMessage("Open this page in your wallet browser, or install a browser wallet."); return; }
    setBusy(true);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      setAddress(accounts[0] ?? "");
      if (!accounts.length) setMessage("No account was shared. You can try again.");
    } catch (error) { setMessage((error as { code?: number }).code === 4001 ? "Connection cancelled. You can keep browsing." : "Your wallet could not connect. Try again."); }
    finally { setBusy(false); }
  }
  return <details className="gmd-account"><summary><Icon name="wallet" size={17} /><span>{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect wallet"}</span></summary><div className="gmd-account-popover"><strong>{address ? "Connected wallet" : "Your wallet"}</strong><p>{address || "Choose an account in your browser wallet. No signature or transaction is requested."}</p>{!address && <button className="gmd-button" disabled={busy} onClick={() => void connect()}>{busy ? "Connecting…" : "Connect browser wallet"}</button>}<p role="status">{message}</p>{message.startsWith("Open") && <a href="https://web3.okx.com/download" target="_blank" rel="noreferrer">Get OKX Wallet <Icon name="external" size={14} /></a>}{address && <p className="gmd-muted">Wallet connection does not create an investment account. Investing is not open yet.</p>}</div></details>;
}

export function ProductHeader({ section = "markets", preview }: { section?: ProductSection | null; preview?: DesignScreen }) {
  const links = [{ section: "markets", label: "Markets", href: "/", icon: "market" }, { section: "portfolio", label: "Portfolio", href: "/portfolio", icon: "portfolio" }, { section: "activity", label: "Activity", href: "/activity", icon: "activity" }] as const;
  return <header className="gmd-header"><div className="gmd-header-inner"><Link href={preview ? designLink("markets") : "/"} prefetch={false} className="gmd-brand" aria-label="Ganymede markets"><BrandMark /><span>Ganymede</span></Link><nav className="gmd-navigation" aria-label="Primary navigation">{links.map(link => <Link prefetch={false} key={link.section} href={preview ? designLink(link.section) : link.href} aria-current={section === link.section ? "page" : undefined}><Icon name={link.icon} size={18} /><span>{link.label}</span></Link>)}</nav><div className="gmd-header-end"><span className="gmd-environment"><i />Testnet</span>{preview ? <span className="gmd-example-account"><Icon name="wallet" size={17} />Example account</span> : <AccountControl />}</div></div></header>;
}

export function ProductShell({ children, section = "markets", preview }: { children: ReactNode; section?: ProductSection; preview?: DesignScreen }) {
  return <MarketProvider><div className="gmd-app">
    <a className="gmd-skip" href="#product-main">Skip to content</a>
    {preview && <div className="gmd-design-toolbar"><span><b>Design preview</b> Example account data. No transactions.</span><nav aria-label="Design screens">{(["markets", "product", "order", "portfolio", "transaction"] as const).map(screen => <Link prefetch={false} key={screen} href={designLink(screen)} aria-current={preview === screen ? "page" : undefined}>{({ markets: "Markets", product: "Product", order: "Order", portfolio: "Portfolio", transaction: "Transaction" })[screen]}</Link>)}</nav></div>}
    <ProductHeader section={section} preview={preview} />
    <main id="product-main" className="gmd-main">{children}</main>
    <footer className="gmd-footer"><div><b>Ganymede</b><span>Model basket · No public offering</span></div><nav aria-label="Resources"><Link prefetch={false} href="/products/ustx/transparency">Transparency</Link><Link prefetch={false} href="/methodology">Methodology</Link><Link prefetch={false} href="/limitations">Limitations</Link><Link prefetch={false} href="/lab">Lab</Link></nav></footer>
  </div></MarketProvider>;
}
