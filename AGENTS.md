# Ganymede development and release

## Product and scope

The public UI presents USTX as a live fund service, laid out like a production
DeFi app: one testnet notice and the network and "Connect OKX Wallet" in the
header; Markets (with the market's latest activity and its 24-hour figures, a countdown to the next NAV record, and a detail panel for each xStock); the USTX page (order panel with wallet and demo-balance investing, wallet orders routed to the fund or the pool at the better price, borrowing against USTX, fund
overview with the price oracle and the pool's market price, market activity from the contracts' events, factsheet holdings, About); Portfolio (the demo
balance and the wallet's USTX, including any posted as lending collateral with its loan, looked through to each xStock, and valuation of
any wallet's xStocks on X Layer mainnet); and Transparency (the customer proof page). Keep pitch and developer
material out of those screens: the technical checks, the tamper experiment and
the evidence download (re-checked by `npm run verify:evidence`) live on
`/developers`, which with `/issuers`, the `/embed/ustx` badge (and `/embed/basket` for a basket
defined by a file under `public/baskets/`, such as the MAG3 demo in its own registry) and the public
`GET /api/v1/ustx` (with `GET /api/v1/ustx/activity`) forms the partner surface linked from the footer. The
GMDCORE test ledger page (`/activity`) and the paper Lab are earlier work and
stay out of the navigation. Production is the `ganymede-xlayer` Worker; the
settlement relayer is `ganymede-settlement-relayer`, and the arbitrage keeper is
`ganymede-arbitrage-keeper` (`relayer/wrangler.keeper.jsonc`). The app Worker has two
crons: the USTX NAV record every five minutes (`runUstxNavCycle`; the earlier engine's
paper strategies run only through the operator API, so the record stays small in CPU time),
and the market activity index (`lib/xstocks/activity-index.ts`) four minutes past, apart so
it never holds up the NAV. The fund and the lending market refuse a NAV older than one hour,
so a stalled record stops wallet orders and loans; check the cron's outcome after each deploy.
`docs/PRODUCT_RELEASE.md` records the current source and Worker version.

Investing uses demo dollars with no value, in two ways. Wallet investing
(`lib/xstocks/fund.ts`, `app/product-ui/WalletInvest.tsx`) runs on X Layer
Testnet only: anyone can claim `GanymedeDemoDollar` (dUSD), and
`GanymedeBasketFund` issues USTX only when a wallet invests at the latest NAV in
the registry and redeems at that NAV, holding no assets. Demo-balance investing
(`lib/demo/`, `app/api/demo/`) keeps a D1 ledger per browser and issues nothing
on chain. Each NAV record carries the shares outstanding in wallets plus demo
balances. `GanymedeNavFeed` serves the registry's USTX NAV to other contracts in
the Chainlink `AggregatorV3Interface`; it has no owner. USTX also trades on
`GanymedeUstxPool` (USTX/dUSD, constant product), and `GanymedeNavArbitrage`
closes the pool's gap to the NAV through the fund in one transaction; the keeper
checks every five minutes and sends that trade when it earns at least a cent.
`GanymedeLendingMarket` (dUSD loans against USTX) is live on X Layer Testnet
(`0xae2f54ae3d0370295de18510d56de92afb8843c7`), activated with the user's approval; the USTX page's
Borrow section (`app/product-ui/Lending.tsx`, `lib/xstocks/lending.ts`) deposits
USTX, borrows, repays, withdraws and lends through it. Pausing it again or any
other administrator action needs the user's approval.
`GanymedeBasketVault` (in-kind creation and redemption) runs only on a fork (`npm run fork:vault` in
`onchain/`); deploying it anywhere needs the user's approval. `GanymedeRwaLiquidityHook` (a Uniswap
v4 hook that runs a USTX/dUSD pool around the NAV and holds its liquidity for depositors) and
`GanymedeV4Router` run only on a fork (`npm run fork:v4`); deploying them (`npm run deploy:v4`, which
also deploys Uniswap's PoolManager on X Layer Testnet) needs the user's approval. Real money stays out of scope: no mainnet deployment of these contracts, no real deposits, withdrawals, custody or payment destinations, and
no value for dUSD or USTX. Never create or name an address that would receive
real funds, and keep the demo, testnet and simulation labels.
`lib/product-contract.ts` keeps `canSubscribe`, `canRedeem`, `settlementAsset`
and `custodyAddress` closed for real-money subscriptions; testnet demo orders are
not real subscriptions.

## Branches

`main` holds the source that production runs. Start work from the latest `main`
on a feature branch and merge back through a pull request. Deploy only a commit
that contains the current `main`, so later design and security changes are never
dropped.

## Checks

Run `npm test` (typecheck, clean build and the full suite) and `npm run lint`
(0 errors). After relayer changes, also run `npm run typecheck` and `npm test` in
`relayer/`; after contract or script changes, run the checks in `onchain/`.

## Deploying

Before deploying, compare the currently deployed Worker (`npx wrangler
deployments list --name ganymede-xlayer`) against the proposed build. Build from
a clean tree (`rm -rf .vinext dist`) with `CLOUDFLARE_WORKER_NAME=ganymede-xlayer`,
`CLOUDFLARE_D1_DATABASE_NAME=ganymede-xlayer` and the existing
`CLOUDFLARE_D1_DATABASE_ID`. Then run `npx wrangler deploy -c dist/server/wrangler.json --keep-vars`.
Never reuse an older `dist`. Record the source commit and the prior version in
the deployment message, and add the new version to `docs/PRODUCT_RELEASE.md`.

After deploying, verify Markets, USTX, Transparency, Portfolio, Activity, Lab and
the legacy redirects on the public URL.

## Security rules that must stay

Public requests must not gain operator access from `oai-authenticated-user-email`
unless the deployment explicitly trusts an authenticating edge
(`IDENTITY_HEADER_TRUSTED`). Public GET requests must not write to the engine
database. Never print or commit secrets.

## Public submission repository

`project-ganymede-submission` is the public snapshot for reviewers. After a
release, refresh it as described in `docs/SUBMISSION_EXPORT.md`, keeping its
publication-only files and never exporting handoff notes, local outputs or
secrets.
