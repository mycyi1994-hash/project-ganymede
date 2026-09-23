/**
 * One xStocks pricing pass inside the engine cycle: price the basket from X
 * Layer, persist the composition, and publish NAV evidence through the
 * settlement relayer. Never throws into the main cycle; failures become
 * warnings and an unpublished state the proof page shows as-is.
 */
import { sha256Hex } from "../engine/fixed";
import type { EngineRepository } from "../engine/repository";
import type { SettlementClient, SettlementRequest, SettlementResult } from "../engine/settlement";
import type { EngineEnv } from "../engine/types";
import {
  constituentsWithAddresses,
  deserializeBasket,
  evaluateBasket,
  serializeBasket,
  XSTOCKS_PRODUCT,
  type Composition,
  type Evaluation,
} from "./basket";
import { fetchXStockQuotes, onchainOsCredentials } from "./prices";

export const STATE_BASKET = "xstocks:basket";
export const STATE_LATEST = "xstocks:latest";
export const STATE_HISTORY = "xstocks:history";
const HISTORY_LIMIT = 12;
/** OnchainOS stamps each quote with the response time, so this bounds the quote's age, not the last trade's. */
const DEFAULT_MAX_QUOTE_AGE_MINUTES = 360;

export type Publication = {
  asOf: string;
  navPerShareMicros: string;
  holdingsHash: string;
  canonical: string;
  status: SettlementResult["status"];
  txHash: string | null;
  error: string | null;
};

export type LatestState = {
  evaluatedAt: string;
  status: Evaluation["status"];
  blockers: string[];
  warnings: string[];
  composition: Composition | null;
  canonical: string | null;
  holdingsHash: string | null;
  publication: Publication | null;
};

export type XStocksCycleResult = { navsPublished: number; settlementsQueued: number; warnings: string[] };

function maxQuoteAgeMinutes(env: EngineEnv): number {
  const parsed = Number(env.XSTOCKS_MAX_QUOTE_AGE_MINUTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_QUOTE_AGE_MINUTES;
}

export async function runXStocksCycle(env: EngineEnv, repo: EngineRepository, settlementClient: SettlementClient, now = new Date().toISOString()): Promise<XStocksCycleResult> {
  const constituents = constituentsWithAddresses(env.XSTOCKS_ADDRESSES);
  const { quotes, warnings } = await fetchXStockQuotes(onchainOsCredentials(env), constituents);
  const previous = deserializeBasket((await repo.getState(STATE_BASKET))?.value);
  const evaluation = await evaluateBasket({ constituents, quotes, previous, now, maxQuoteAgeMinutes: maxQuoteAgeMinutes(env) });

  let settlementsQueued = 0;
  let navsPublished = 0;
  let publication: Publication | null = null;

  if (evaluation.publishable && evaluation.basket && evaluation.composition && evaluation.canonical && evaluation.holdingsHash) {
    await repo.setState(STATE_BASKET, serializeBasket(evaluation.basket));

    if (evaluation.rebalanced) {
      const request: SettlementRequest = {
        entityType: "rebalance",
        entityId: `${XSTOCKS_PRODUCT.id}:${evaluation.basket.fixedAt}`,
        action: "publish_rebalance",
        productId: XSTOCKS_PRODUCT.id,
        holdingsHash: await sha256Hex(serializeBasket(evaluation.basket)),
        effectiveAt: now,
      };
      await repo.saveSettlement(request, await settlementClient.settle(request));
      settlementsQueued += 1;
    }

    const request: SettlementRequest = {
      entityType: "nav",
      entityId: `${XSTOCKS_PRODUCT.id}:${now}`,
      action: "publish_nav",
      productId: XSTOCKS_PRODUCT.id,
      navPerShareMicros: evaluation.composition.navPerShareMicros,
      holdingsHash: evaluation.holdingsHash,
      effectiveAt: now,
    };
    const settlement = await settlementClient.settle(request);
    await repo.saveSettlement(request, settlement);
    settlementsQueued += 1;
    navsPublished += 1;
    publication = {
      asOf: now,
      navPerShareMicros: evaluation.composition.navPerShareMicros,
      holdingsHash: evaluation.holdingsHash,
      canonical: evaluation.canonical,
      status: settlement.status,
      txHash: settlement.txHash,
      error: settlement.error,
    };
    if (settlement.error) warnings.push(`${XSTOCKS_PRODUCT.ticker} NAV publication: ${settlement.error}`);

    const history = JSON.parse((await repo.getState(STATE_HISTORY))?.value ?? "[]") as Publication[];
    await repo.setState(STATE_HISTORY, JSON.stringify([publication, ...history].slice(0, HISTORY_LIMIT)));
  } else {
    warnings.push(...evaluation.blockers.map((blocker) => `${XSTOCKS_PRODUCT.ticker} not published: ${blocker}`));
  }

  const latest: LatestState = {
    evaluatedAt: now,
    status: evaluation.status,
    blockers: evaluation.blockers,
    warnings,
    composition: evaluation.composition,
    canonical: evaluation.canonical,
    holdingsHash: evaluation.holdingsHash,
    publication,
  };
  await repo.setState(STATE_LATEST, JSON.stringify(latest));
  return { navsPublished, settlementsQueued, warnings };
}
