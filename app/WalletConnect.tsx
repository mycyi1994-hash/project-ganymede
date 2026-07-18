"use client";

import { useEffect, useId, useState } from "react";

type EthereumProvider = {
  isMetaMask?: boolean;
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const GIWA_CHAIN = {
  chainId: "0x164CE",
  chainIdDecimal: 91342,
  chainName: "GIWA Sepolia",
  rpcUrls: ["https://sepolia-rpc.giwa.io"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia-explorer.giwa.io"],
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletConnect({ compact = false }: { compact?: boolean }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [status, setStatus] = useState("CONNECT METAMASK");
  const [error, setError] = useState("");
  const [missingWallet, setMissingWallet] = useState(false);
  const errorId = useId();
  const statusId = useId();

  const onCorrectChain = chainId.toLowerCase() === GIWA_CHAIN.chainId.toLowerCase();

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;

    const syncWallet = async () => {
      try {
        const [accounts, currentChain] = await Promise.all([
          provider.request({ method: "eth_accounts" }) as Promise<string[]>,
          provider.request({ method: "eth_chainId" }) as Promise<string>,
        ]);
        setAddress(accounts[0] ?? "");
        setChainId(currentChain);
      } catch {
        setError("Wallet status could not be read.");
      }
    };

    const handleAccounts = (...args: unknown[]) => setAddress(((args[0] as string[]) ?? [])[0] ?? "");
    const handleChain = (...args: unknown[]) => setChainId(String(args[0] ?? ""));
    provider.on?.("accountsChanged", handleAccounts);
    provider.on?.("chainChanged", handleChain);
    syncWallet();

    return () => {
      provider.removeListener?.("accountsChanged", handleAccounts);
      provider.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  const ensureGiwaChain = async (provider: EthereumProvider) => {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: GIWA_CHAIN.chainId }],
      });
    } catch (switchError) {
      const code = (switchError as { code?: number }).code;
      if (code !== 4902) throw switchError;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [GIWA_CHAIN],
      });
    }
    setChainId(GIWA_CHAIN.chainId);
  };

  const connect = async () => {
    const provider = window.ethereum;
    setError("");
    setMissingWallet(false);

    if (!provider?.isMetaMask) {
      setMissingWallet(true);
      setError("MetaMask is not installed. You can continue without a wallet.");
      return;
    }

    setStatus("CONNECTING…");
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      setAddress(accounts[0] ?? "");
      const currentChain = await provider.request({ method: "eth_chainId" }) as string;
      if (currentChain.toLowerCase() !== GIWA_CHAIN.chainId.toLowerCase()) await ensureGiwaChain(provider);
      else setChainId(currentChain);
      setStatus("CONNECTED");
    } catch (walletError) {
      const code = (walletError as { code?: number }).code;
      setError(code === 4001 ? "Connection request was cancelled." : "Could not connect to GIWA Sepolia. Please try again.");
      setStatus("CONNECT METAMASK");
    }
  };

  return (
    <div className={`wallet-connect${compact ? " is-compact" : ""}`}>
      <button
        type="button"
        className={address && onCorrectChain ? "is-connected" : ""}
        onClick={connect}
        aria-describedby={`${statusId}${error ? ` ${errorId}` : ""}`}
        aria-label={address && onCorrectChain ? `${shortAddress(address)}, connected to GIWA Sepolia` : address ? "Switch wallet to GIWA Sepolia" : "Connect optional MetaMask test wallet"}
        disabled={status === "CONNECTING…"}
      >
        <span className="wallet-network-dot" />
        {address && onCorrectChain ? shortAddress(address) : address ? "SWITCH TO GIWA" : status}
      </button>
      {!compact && <span id={statusId} className="wallet-chain-label" aria-live="polite">OPTIONAL TEST WALLET · GIWA SEPOLIA 91342</span>}
      {compact && <span id={statusId} className="sr-only" aria-live="polite">Optional GIWA Sepolia test wallet</span>}
      {error && <small id={errorId} role="alert">{error}{missingWallet && !compact && <> <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">INSTALL METAMASK ↗</a></>}</small>}
    </div>
  );
}
