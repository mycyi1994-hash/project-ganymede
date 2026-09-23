import { env } from "cloudflare:workers";
import { sha256Hex } from "./fixed";
import type { EngineEnv } from "./types";

export function engineEnv(): EngineEnv {
  return env as unknown as EngineEnv;
}

export type RequestIdentity = {
  subject: string;
  email: string | null;
  walletAddress: string | null;
};

function walletFromRequest(request: Request, payloadWallet?: unknown): string | null {
  const raw = typeof payloadWallet === "string" ? payloadWallet : request.headers.get("x-ganymede-wallet");
  return raw && /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw.toLowerCase() : null;
}

/**
 * A private Sites deployment sets oai-authenticated-user-email at its edge. Anywhere
 * else the header is whatever the client sent, so it only counts as an identity when
 * IDENTITY_HEADER_TRUSTED says the platform in front of the worker sets it.
 */
function authenticatedEmail(request: Request): string | null {
  const trusted = engineEnv().IDENTITY_HEADER_TRUSTED;
  if (trusted !== "true" && trusted !== "1") return null;
  return request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() || null;
}

export function requestIdentity(request: Request, payloadWallet?: unknown): RequestIdentity | null {
  const email = authenticatedEmail(request);
  const walletAddress = walletFromRequest(request, payloadWallet);
  if (email) return { subject: `email:${email}`, email, walletAddress };
  if (walletAddress && engineEnv().TRADING_MODE !== "live") return { subject: `paper-wallet:${walletAddress}`, email: null, walletAddress };
  if (engineEnv().TRADING_MODE !== "live") return { subject: "paper:private-site-owner", email: null, walletAddress: null };
  return null;
}

async function constantTimeTokenMatch(expected: string, supplied: string): Promise<boolean> {
  const [expectedHash, suppliedHash] = await Promise.all([sha256Hex(expected), sha256Hex(supplied)]);
  if (expectedHash.length !== suppliedHash.length) return false;
  let different = 0;
  for (let index = 0; index < expectedHash.length; index += 1) different |= expectedHash.charCodeAt(index) ^ suppliedHash.charCodeAt(index);
  return different === 0;
}

export async function operatorIdentity(request: Request): Promise<string | null> {
  const currentEnv = engineEnv();
  const authorization = request.headers.get("authorization");
  const suppliedToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (currentEnv.OPERATOR_TOKEN && suppliedToken && await constantTimeTokenMatch(currentEnv.OPERATOR_TOKEN, suppliedToken)) return "operator:token";

  const email = authenticatedEmail(request);
  const allowlist = (currentEnv.OPERATIONS_ALLOW_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (email && (allowlist.includes(email) || (currentEnv.TRADING_MODE !== "live" && allowlist.length === 0))) return `operator:${email}`;
  return null;
}

export function jsonError(error: unknown, status = 500): Response {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  const missingTable = /no such table|has no column|D1_ERROR/i.test(message);
  return Response.json({ error: missingTable ? "The ETF database is not initialized yet. Apply the bundled D1 migration and retry." : message }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new Error("Content-Type must be application/json");
  return await request.json() as T;
}

export function noStoreJson(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(value), { ...init, headers });
}
