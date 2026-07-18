import { engineEnv, jsonError, noStoreJson } from "@/lib/engine/api-helpers";
import { EngineRepository } from "@/lib/engine/repository";
import { runEngineCycle } from "@/lib/engine/runner";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentEnv = engineEnv();
  const repo = new EngineRepository(currentEnv.DB);
  try {
    await repo.seed();
    let overview = await repo.marketOverview();
    if (!overview.lastCycle) {
      await runEngineCycle(currentEnv, "request", { force: true });
      overview = await repo.marketOverview();
    }
    return noStoreJson(overview);
  } catch (error) {
    return jsonError(error);
  }
}
