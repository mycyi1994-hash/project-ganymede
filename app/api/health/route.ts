import { engineEnv, jsonError, noStoreJson } from "@/lib/engine/api-helpers";
import { GiwaSettlementClient } from "@/lib/engine/giwa";
import { EngineRepository } from "@/lib/engine/repository";
import { UpbitExecutionClient } from "@/lib/engine/upbit";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentEnv = engineEnv();
  try {
    const repo = new EngineRepository(currentEnv.DB);
    await repo.seed();
    const [upbit, giwa, database] = await Promise.all([
      new UpbitExecutionClient(currentEnv).health(),
      new GiwaSettlementClient(currentEnv).health(),
      repo.operationsStatus(),
    ]);
    const ready = Boolean(database) && upbit.configured && giwa.connected;
    return noStoreJson({ ready, mode: currentEnv.TRADING_MODE === "live" ? "live" : "paper", upbit, giwa, database: { connected: true, lastCycleAt: database.lastCycleAt ?? null } }, { status: ready ? 200 : 503 });
  } catch (error) {
    return jsonError(error, 503);
  }
}
