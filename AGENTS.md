# Ganymede development and release

## Product and scope

The public UI presents USTX as a fund product built on verification: Markets,
USTX detail (demo investing, the fund overview and look-through holdings),
Portfolio (the demo account looked through to each xStock, and read-only
valuation of any wallet's xStocks on X Layer mainnet) and Verify (the
transparency page with the tamper experiment and the evidence download, which
`npm run verify:evidence` re-checks). Partner surfaces are `/issuers`,
`/developers`, the `/embed/ustx` badge and the public `GET /api/v1/ustx`. The
GMDCORE test ledger page (`/activity`) and the paper Lab are earlier work and
stay out of the primary navigation. Production is the `ganymede-xlayer` Worker;
the settlement relayer is `ganymede-settlement-relayer`.
`docs/PRODUCT_RELEASE.md` records the current source and Worker version.

Demo investing (`lib/demo/`, `app/api/demo/`) uses demo dollars in the D1 demo
ledger. It never moves real money and never issues shares on chain; each NAV
record carries the demo shares outstanding. Real deposits, withdrawals, custody,
settlement tokens and payment destinations are out of scope. Never create or
name an address that would receive real funds, and keep the demo, testnet and
simulation labels. `lib/product-contract.ts` keeps `canSubscribe`, `canRedeem`,
`settlementAsset` and `custodyAddress` closed: demo orders are not real
subscriptions.

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
