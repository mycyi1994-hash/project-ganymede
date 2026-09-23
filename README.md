# Ganymede ETF Operating System

Ganymede is a full-stack operating system for passive and systematic-active digital-asset ETF products. It combines the investor product surface with portfolio construction, market data, NAV, rebalancing, execution, subscriptions, redemptions, on-chain settlement evidence on X Layer and an append-only audit trail.

The deployed system defaults to `paper` mode. Live public issuance is deliberately gated until licensed fund, custody, transfer-agent, venue, administrator, distribution and approved offering-document integrations are configured.

## Product mandates

| Product | Style | Method |
| --- | --- | --- |
| GMD CORE | Passive | Liquidity-screened square-root float-market-cap index |
| GMD YIELD | Passive | Liquidity-screened inverse-volatility index with cash buffer |
| GMD TECH | Active | Momentum, liquidity and inverse-volatility composite |
| GMD ALPHA | Active | Higher-frequency emerging-network composite with tighter caps |

Stablecoins are excluded from the eligible investment universe. Every mandate enforces minimum history and liquidity, custody eligibility, position floors/caps, cash buffers and turnover limits.

## Operating loop

The Cloudflare Worker runs every five minutes and may also wake opportunistically on requests. A D1 lease prevents overlapping cycles.

1. Refresh Upbit tickers, order books and daily candles; use clearly labelled deterministic reference data if the venue is unavailable.
2. Process controlled subscription and redemption states.
3. Evaluate all passive and active mandates.
4. Validate eligibility, weights, turnover and rebalance cadence.
5. Create idempotent sell-before-buy order intents.
6. Execute through paper or explicitly enabled live Upbit adapters.
7. Reconcile positions and publish fixed-point NAV snapshots with holdings hashes.
8. Queue fund-share mint/burn and NAV/rebalance evidence on X Layer through an external relayer.
9. Persist engine state and tamper-evident audit hashes.

Monetary values and shares are stored as integer strings. No floating-point arithmetic is used for fund accounting or settlement.

## Data model

The migration in `drizzle/0000_giant_speedball.sql` creates 20 D1 tables covering products, assets, strategy configuration and signals, target allocations, prices, positions, NAVs, rebalances, orders, fills, investors, subscriptions, redemptions, investor positions, on-chain settlements (table `giwa_settlements`, named for the original rail), audit events, engine state and distributed leases.

Generate a new migration after schema changes:

```bash
npm run db:generate
```

## API surface

- `GET /api/market` — product NAV, target weights and latest engine cycle
- `GET /api/health` — D1, Upbit and settlement-chain readiness
- `GET|POST|DELETE /api/portfolio` — investor ledger, subscriptions and redemptions
- `GET /api/operations/status` — orders, rebalances, settlements and cycle counters
- `POST /api/operations/run` — authorized controlled cycle
- `POST /api/operations/actions` — KYC, funding, redemption and product pause/resume controls

Investor writes use the private Sites identity header or a browser wallet (OKX Wallet or any EIP-1193 wallet) in paper mode. Live mode requires authenticated investor identity. Operator writes require an allowlisted identity or bearer token.

## Settlement contracts on X Layer

`contracts/GanymedeFundShare.sol` implements a permissioned, pausable, six-decimal fund-share registry with idempotent subscription/redemption settlement. `contracts/GanymedeNavRegistry.sol` stores monotonic NAV and rebalance evidence hashes. Private keys are never accepted by the application; contract writes go through the configured external relayer and should be controlled by a multisig.

Settlement runs on **X Layer testnet** (chain ID 1952, gas in OKB) by default. `SETTLEMENT_CHAIN` selects the rail in both the app and the relayer:

| `SETTLEMENT_CHAIN` | Network | Chain ID | Explorer |
| --- | --- | --- | --- |
| `xlayer-testnet` (default) | X Layer Testnet | 1952 | https://www.okx.com/web3/explorer/xlayer-test |
| `giwa-sepolia` | GIWA Sepolia | 91342 | https://sepolia-explorer.giwa.io |

The chain registry lives in `lib/chains.ts` (app and wallet UI) and `relayer/src/chain.ts` (signer); keep them in step. Either rail is a settlement test rail, not proof of custody, licensing or a venue relationship.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm test
```

The Sites configuration provisions the `DB` D1 binding and the build registers the five-minute cron. Apply the bundled migration to a local or hosted database before exercising APIs.

## Environment and live activation

Copy `.env.example` into the appropriate secret store. Never commit credentials.

Live Upbit execution is enabled only when all three conditions are true:

1. `TRADING_MODE=live`
2. Valid `UPBIT_ACCESS_KEY` and `UPBIT_SECRET_KEY`
3. `LIVE_TRADING_CONFIRMATION=ENABLE_GANYMEDE_LIVE_UPBIT_ORDERS`

On-chain writes additionally require `SETTLEMENT_RELAYER_URL`/`SETTLEMENT_RELAYER_TOKEN` and deployed `FUND_SHARE_ADDRESS`/`NAV_REGISTRY_ADDRESS`. The application accepts no signing key.

Before live activation, complete legal classification, approved offering documents, fund administrator NAV sign-off, custody reconciliation, cash banking, venue whitelisting, transfer-agent controls, sanctions/KYC/AML workflows, disaster recovery, monitoring, key rotation, smart-contract audit and staged low-limit production testing.

## Verification

`npm test` builds the Cloudflare target and verifies server-rendered routes, fixed-point accounting, passive constraints, active turnover controls and rebalance cadence. A local integration run should also verify the complete D1 flow: initial engine cycle, subscription request, controlled settlement cycle and resulting investor position.
