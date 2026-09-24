import { engineEnv, jsonError, noStoreJson, readJson, requestIdentity } from "@/lib/engine/api-helpers";
import { asBigInt } from "@/lib/engine/fixed";
import { EngineRepository } from "@/lib/engine/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = requestIdentity(request);
  if (!identity) return noStoreJson({ error: "Authenticated investor identity required" }, { status: 401 });
  try {
    const repo = new EngineRepository(engineEnv().DB);
    return noStoreJson(await repo.portfolio(identity.subject));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJson<{ productId?: string; amountKrw?: string | number; walletAddress?: string; clientReference?: string }>(request);
    const identity = requestIdentity(request, payload.walletAddress);
    if (!identity) return noStoreJson({ error: "Authenticated investor identity required" }, { status: 401 });
    if (!payload.productId) return noStoreJson({ error: "productId is required" }, { status: 400 });
    const amountKrw = asBigInt(payload.amountKrw ?? "0");
    const repo = new EngineRepository(engineEnv().DB);
    await repo.seed();
    const subscription = await repo.createSubscription({
      subject: identity.subject,
      email: identity.email,
      walletAddress: identity.walletAddress,
      productId: payload.productId,
      amountKrw,
      clientReference: payload.clientReference?.trim() || crypto.randomUUID(),
    });
    return noStoreJson({ subscription }, { status: 201 });
  } catch (error) {
    return jsonError(error, error instanceof Error && /required|minimum|invalid|not open/i.test(error.message) ? 400 : 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await readJson<{ productId?: string; sharesMicros?: string; walletAddress?: string; clientReference?: string }>(request);
    const identity = requestIdentity(request, payload.walletAddress);
    if (!identity) return noStoreJson({ error: "Authenticated investor identity required" }, { status: 401 });
    if (!payload.productId || !payload.sharesMicros) return noStoreJson({ error: "productId and sharesMicros are required" }, { status: 400 });
    const repo = new EngineRepository(engineEnv().DB);
    await repo.seed();
    const redemption = await repo.createRedemption({
      subject: identity.subject,
      email: identity.email,
      walletAddress: identity.walletAddress,
      productId: payload.productId,
      sharesMicros: asBigInt(payload.sharesMicros),
      clientReference: payload.clientReference?.trim() || crypto.randomUUID(),
    });
    return noStoreJson({ redemption }, { status: 201 });
  } catch (error) {
    return jsonError(error, error instanceof Error && /required|positive|insufficient/i.test(error.message) ? 400 : 500);
  }
}
