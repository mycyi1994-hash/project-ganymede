import { engineEnv, jsonError, noStoreJson } from "@/lib/engine/api-helpers";
import { EngineRepository } from "@/lib/engine/repository";
import { SettlementClient } from "@/lib/engine/settlement";
import { constituentsWithAddresses, XSTOCKS_CHAIN, XSTOCKS_PRODUCT } from "@/lib/xstocks/basket";
import { STATE_HISTORY, STATE_LATEST, type LatestState, type Publication } from "@/lib/xstocks/cycle";
import { readLatestNav, type OnchainNav } from "@/lib/xstocks/onchain";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = engineEnv();
  try {
    const repo = new EngineRepository(env.DB);
    const settlement = new SettlementClient(env);
    const [latestRow, historyRow] = await Promise.all([repo.getState(STATE_LATEST), repo.getState(STATE_HISTORY)]);
    const latest = latestRow ? JSON.parse(latestRow.value) as LatestState : null;
    const history = historyRow ? JSON.parse(historyRow.value) as Publication[] : [];

    let onchain: OnchainNav | null = null;
    let onchainError: string | null = null;
    const registry = env.NAV_REGISTRY_ADDRESS ?? "";
    if (/^0x[a-fA-F0-9]{40}$/.test(registry)) {
      try {
        onchain = await readLatestNav(settlement.rpcUrl, registry);
      } catch (error) {
        onchainError = error instanceof Error ? error.message : "On-chain read failed";
      }
    } else {
      onchainError = "NAV_REGISTRY_ADDRESS is not configured";
    }

    return noStoreJson({
      product: {
        id: XSTOCKS_PRODUCT.id,
        ticker: XSTOCKS_PRODUCT.ticker,
        name: XSTOCKS_PRODUCT.name,
        benchmark: XSTOCKS_PRODUCT.benchmark,
        methodology: XSTOCKS_PRODUCT.methodology,
        inceptionNavMicros: XSTOCKS_PRODUCT.inceptionNavMicros.toString(),
      },
      pricing: { ...XSTOCKS_CHAIN, constituents: constituentsWithAddresses(env.XSTOCKS_ADDRESSES) },
      registry: {
        chain: settlement.chain.key,
        chainName: settlement.chain.name,
        chainId: settlement.chain.chainId,
        explorerUrl: settlement.chain.explorerUrl,
        address: registry || null,
      },
      latest,
      history,
      onchain,
      onchainError,
    });
  } catch (error) {
    return jsonError(error);
  }
}
