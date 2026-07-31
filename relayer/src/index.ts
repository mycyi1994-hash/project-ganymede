/**
 * Ganymede GIWA settlement relayer.
 *
 * Implements exactly the API the engine already expects (lib/engine/giwa.ts):
 *
 *   POST /v1/settlements                        Bearer + Idempotency-Key
 *   GET  /v1/dojang/verified-address/{address}  Bearer
 *
 * This is the only component in the system that holds an EVM private key. It is
 * deployed separately from the application for that reason.
 */
import { createPublicClient, http } from "viem";
import { giwaSepolia } from "./chain";
import type { Env } from "./env";
import { RequestError, type SettlementRequest } from "./contracts";
import { idempotencyKey } from "./ids";
import { readSettlement } from "./store";

export { Submitter } from "./submitter";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function authorize(request: Request, env: Env): boolean {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  const expected = env.RELAYER_API_TOKEN ?? "";
  if (!expected || supplied.length !== expected.length) return false;
  // Constant-time compare — this token is the only thing gating share issuance.
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

const REQUIRED_FIELDS: Array<keyof SettlementRequest> = ["entityType", "entityId", "action", "productId", "effectiveAt"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/v1/health") {
      return handleHealth(env);
    }

    if (!authorize(request, env)) return unauthorized();

    if (url.pathname === "/v1/settlements" && request.method === "POST") {
      return handleSettlement(request, env);
    }

    const dojang = url.pathname.match(/^\/v1\/dojang\/verified-address\/(0x[a-fA-F0-9]{40})$/);
    if (dojang && request.method === "GET") {
      return handleDojang(dojang[1], env);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};

async function handleSettlement(request: Request, env: Env): Promise<Response> {
  let body: SettlementRequest;
  try {
    body = (await request.json()) as SettlementRequest;
  } catch {
    return Response.json({ error: "Body must be JSON", code: "invalid_json" }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
  if (missing.length > 0) {
    return Response.json({ error: `missing fields: ${missing.join(", ")}`, code: "invalid_request" }, { status: 400 });
  }

  const key = idempotencyKey(body.entityType, body.entityId, body.action);
  const headerKey = request.headers.get("idempotency-key");
  if (headerKey && headerKey !== key) {
    // The engine derives this header from the same three fields. A mismatch
    // means the body and header disagree about which settlement this is.
    return Response.json(
      { error: "Idempotency-Key does not match the request body", code: "idempotency_mismatch" },
      { status: 400 },
    );
  }

  // Fast path: already settled, no need to wake the submitter.
  const existing = await readSettlement(env.DB, key);
  if (existing && existing.status !== "failed") {
    return Response.json(toResponse(existing), { status: 200 });
  }

  // All submissions funnel through one Durable Object so nonces stay ordered.
  const id = env.SUBMITTER.idFromName("giwa-submitter-v1");
  const stub = env.SUBMITTER.get(id);
  const response = await stub.fetch("https://submitter/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return response;
  const record = (await response.json()) as Awaited<ReturnType<typeof readSettlement>>;
  return Response.json(toResponse(record!), { status: 200 });
}

function toResponse(record: NonNullable<Awaited<ReturnType<typeof readSettlement>>>) {
  return {
    status: record.status,
    txHash: record.txHash,
    blockNumber: record.blockNumber,
    note: record.note,
    explorer: record.txHash ? `${giwaSepolia.blockExplorers.default.url}/tx/${record.txHash}` : null,
  };
}

/**
 * Testnet Dojang stub.
 *
 * GIWA Sepolia carries no real Upbit Korea Verified Address attestation, so
 * there is nothing truthful to read. Returns an explicit `source` so a caller
 * can never mistake this for a real attestation check. Mainnet replaces this
 * with a read against the Dojang scroll.
 */
async function handleDojang(address: string, env: Env): Promise<Response> {
  const allowlist = (env.DOJANG_TESTNET_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const verified = allowlist.includes(address.toLowerCase());
  return Response.json({
    verified,
    source: "testnet-stub",
    reason: verified ? null : "not in the testnet Dojang allowlist",
  });
}

async function handleHealth(env: Env): Promise<Response> {
  const client = createPublicClient({
    chain: giwaSepolia,
    transport: http(env.GIWA_RPC_URL || giwaSepolia.rpcUrls.default.http[0]),
  });
  try {
    const [blockNumber, chainId] = await Promise.all([client.getBlockNumber(), client.getChainId()]);
    return Response.json({
      ready: true,
      chainId,
      blockNumber: blockNumber.toString(),
      contracts: {
        fundShare: env.GIWA_FUND_SHARE_ADDRESS ?? null,
        navRegistry: env.GIWA_NAV_REGISTRY_ADDRESS ?? null,
      },
      signerConfigured: /^0x[0-9a-fA-F]{64}$/.test(env.RELAYER_PRIVATE_KEY ?? ""),
    });
  } catch (error) {
    return Response.json(
      { ready: false, error: error instanceof Error ? error.message : "RPC unreachable" },
      { status: 503 },
    );
  }
}

export { RequestError };
