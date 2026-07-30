# Ganymede GIWA settlement relayer

Signs and submits the engine's settlement intents to GIWA. **This is the only
component in the system that holds an EVM private key** — the application never
accepts one, which is why the relayer is deployed separately.

## API

Exactly the contract `lib/engine/giwa.ts` already expects:

| Endpoint | Purpose |
| --- | --- |
| `POST /v1/settlements` | Submit a settlement. Bearer auth + `Idempotency-Key`. |
| `GET /v1/dojang/verified-address/{address}` | Wallet eligibility check. |
| `GET /v1/health` | RPC reachability, configured contracts, signer presence. Unauthenticated. |

## How a settlement becomes a transaction

```
engine → POST /v1/settlements → Worker (auth, validate, replay check)
                              → Submitter Durable Object (nonce queue, sign, send)
                              → GIWA Sepolia
```

Three properties matter:

**Nonce serialisation.** One engine cycle emits several settlements — a NAV
publication per product, plus rebalance evidence and fund flows. Signing those
concurrently hands the same nonce to several transactions and all but one fail.
Every submission funnels through a single Durable Object instance, so nonces are
issued in order. A drifted nonce triggers a resync rather than poisoning the queue.

**Idempotency, three deep.** Keyed on `entityType:entityId:action` — the same
string the engine already sends as its `Idempotency-Key`.

1. The relayer's D1 ledger returns the first result for a repeat request.
2. `simulateContract` runs before spending gas, so a doomed call never becomes a
   transaction.
3. The contracts' own `processedSettlement` / `publishedPayload` guards are the
   final backstop.

The settlement id is derived from `entityType:entityId:action` and deliberately
**not** from the request payload hash — the payload carries `effectiveAt`, which
changes between retries, so keying on it would mint the same subscription twice.
`relayer/src/ids.ts` is the single source of that derivation, and the contract
tests in `onchain/test` import the same module.

**Reverts that mean "already done".** `SettlementAlreadyProcessed`,
`DuplicatePayload` and `StalePublication` are recorded as `confirmed`, not
failures. Returning an error would make the engine retry forever against a guard
that will never let it through.

Other reverts map to actionable responses: `TransferRestricted` →
`409 investor_not_allowlisted`, `ContractPaused` → `503`, `Unauthorized` →
`500 role_misconfigured` (the relayer key lost its issuer/publisher role).

## Setup

```bash
cd relayer
npm install
npm run typecheck

npm run db:create          # note the returned database_id
# put it in wrangler.jsonc, replacing PLACEHOLDER_RUN_WRANGLER_D1_CREATE
npm run db:migrate

npx wrangler secret put RELAYER_API_TOKEN         # shared with the app
npx wrangler secret put RELAYER_PRIVATE_KEY       # hot key, issuer + publisher
npx wrangler secret put GIWA_FUND_SHARE_ADDRESS   # from onchain deploy
npx wrangler secret put GIWA_NAV_REGISTRY_ADDRESS

npm run deploy
curl https://<worker>.workers.dev/v1/health
```

Then point the application at it:

```
GIWA_RELAYER_URL=https://<worker>.workers.dev
GIWA_RELAYER_TOKEN=<RELAYER_API_TOKEN>
GIWA_FUND_SHARE_ADDRESS=0x...
GIWA_NAV_REGISTRY_ADDRESS=0x...
```

No application code changes are needed — `lib/engine/giwa.ts` already branches on
these being present. With them unset every settlement stays `simulated`.

Trigger a cycle and the contracts start receiving real traffic:

```bash
curl -X POST -H "Authorization: Bearer $OPERATOR_TOKEN" \
     -H "Content-Type: application/json" -d '{"force":true}' \
     https://<app>/api/operations/run
```

## Dojang verification is a testnet stub

GIWA Sepolia carries no real Upbit Korea Verified Address attestation, so
`/v1/dojang/verified-address/{address}` checks `DOJANG_TESTNET_ALLOWLIST` and
always reports `"source": "testnet-stub"` so a caller cannot mistake it for a
real attestation. Mainnet replaces it with a read against the Dojang scroll
(`0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9`).

## Operational notes

- Keep the relayer key funded with GIWA Sepolia ETH — an unfunded signer fails
  every submission.
- Rotating the hot key needs no redeploy: `setIssuer` / `setPublisher` from the
  admin key, then update the Worker secret.
- The relayer cannot allowlist an investor. That is the transfer agent's job,
  held by the cold key (`cd onchain && WALLETS=0x... npm run allowlist`).
