import { newId, sha256Hex, stableJson } from "./fixed";
import type { EngineEnv } from "./types";

export const GIWA_SEPOLIA = {
  chainId: 91342,
  rpcUrl: "https://sepolia-rpc.giwa.io",
  explorerUrl: "https://sepolia-explorer.giwa.io",
  dojangScroll: "0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9",
  upbitKoreaAttesterId: "0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034",
} as const;

export type GiwaSettlementRequest = {
  entityType: "nav" | "subscription" | "redemption" | "rebalance";
  entityId: string;
  action: "publish_nav" | "mint_subscription" | "burn_redemption" | "publish_rebalance";
  walletAddress?: string | null;
  productId: string;
  amount?: string;
  navPerShareMicros?: string;
  sharesMicros?: string;
  holdingsHash?: string;
  effectiveAt: string;
};

export type GiwaSettlementResult = {
  id: string;
  payloadHash: string;
  status: "queued" | "submitted" | "confirmed" | "failed" | "simulated";
  txHash: string | null;
  blockNumber: string | null;
  error: string | null;
};

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`GIWA RPC ${response.status}`);
  const payload = await response.json() as { result?: T; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message ?? "GIWA RPC error");
  if (payload.result === undefined) throw new Error("GIWA RPC returned no result");
  return payload.result;
}

export class GiwaSettlementClient {
  private readonly env: EngineEnv;
  readonly rpcUrl: string;

  constructor(env: EngineEnv) {
    this.env = env;
    this.rpcUrl = env.GIWA_RPC_URL || GIWA_SEPOLIA.rpcUrl;
  }

  async health(): Promise<{ configured: boolean; connected: boolean; blockNumber: string | null; chainId: number; relayer: boolean; error: string | null }> {
    try {
      const [blockHex, chainHex] = await Promise.all([
        rpc<string>(this.rpcUrl, "eth_blockNumber", []),
        rpc<string>(this.rpcUrl, "eth_chainId", []),
      ]);
      return {
        configured: Boolean(this.env.GIWA_FUND_SHARE_ADDRESS || this.env.GIWA_NAV_REGISTRY_ADDRESS),
        connected: true,
        blockNumber: BigInt(blockHex).toString(),
        chainId: Number(BigInt(chainHex)),
        relayer: Boolean(this.env.GIWA_RELAYER_URL && this.env.GIWA_RELAYER_TOKEN),
        error: null,
      };
    } catch (error) {
      return {
        configured: Boolean(this.env.GIWA_FUND_SHARE_ADDRESS || this.env.GIWA_NAV_REGISTRY_ADDRESS),
        connected: false,
        blockNumber: null,
        chainId: GIWA_SEPOLIA.chainId,
        relayer: Boolean(this.env.GIWA_RELAYER_URL && this.env.GIWA_RELAYER_TOKEN),
        error: error instanceof Error ? error.message : "Unknown GIWA RPC error",
      };
    }
  }

  async verifyAddress(walletAddress: string): Promise<{ verified: boolean; source: "relayer" | "unavailable"; reason: string | null }> {
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return { verified: false, source: "unavailable", reason: "Invalid EVM address" };
    if (!this.env.GIWA_RELAYER_URL || !this.env.GIWA_RELAYER_TOKEN) {
      return { verified: false, source: "unavailable", reason: "Dojang verification relayer is not configured" };
    }
    try {
      const response = await fetch(`${this.env.GIWA_RELAYER_URL.replace(/\/$/, "")}/v1/dojang/verified-address/${walletAddress}`, {
        headers: { Authorization: `Bearer ${this.env.GIWA_RELAYER_TOKEN}`, Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Relayer ${response.status}`);
      const payload = await response.json() as { verified?: boolean };
      return { verified: payload.verified === true, source: "relayer", reason: payload.verified ? null : "Wallet has no valid Upbit Korea Verified Address attestation" };
    } catch (error) {
      return { verified: false, source: "unavailable", reason: error instanceof Error ? error.message : "Verification failed" };
    }
  }

  async settle(request: GiwaSettlementRequest): Promise<GiwaSettlementResult> {
    const payloadHash = await sha256Hex(stableJson(request));
    const id = newId("giwa");
    if (!this.env.GIWA_RELAYER_URL || !this.env.GIWA_RELAYER_TOKEN) {
      return { id, payloadHash, status: "simulated", txHash: null, blockNumber: null, error: "GIWA relayer is not configured" };
    }
    try {
      const response = await fetch(`${this.env.GIWA_RELAYER_URL.replace(/\/$/, "")}/v1/settlements`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.env.GIWA_RELAYER_TOKEN}`, "Content-Type": "application/json", "Idempotency-Key": `${request.entityType}:${request.entityId}:${request.action}` },
        body: JSON.stringify({
          chainId: GIWA_SEPOLIA.chainId,
          shareContract: this.env.GIWA_FUND_SHARE_ADDRESS ?? null,
          navRegistry: this.env.GIWA_NAV_REGISTRY_ADDRESS ?? null,
          payloadHash,
          ...request,
        }),
      });
      if (!response.ok) throw new Error(`GIWA relayer ${response.status}: ${await response.text()}`);
      const payload = await response.json() as { status?: "queued" | "submitted" | "confirmed"; txHash?: string; blockNumber?: string };
      return { id, payloadHash, status: payload.status ?? "queued", txHash: payload.txHash ?? null, blockNumber: payload.blockNumber ?? null, error: null };
    } catch (error) {
      return { id, payloadHash, status: "failed", txHash: null, blockNumber: null, error: error instanceof Error ? error.message : "GIWA settlement failed" };
    }
  }
}
