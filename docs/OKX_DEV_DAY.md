# Ganymede × OKX Dev Day 2026

**Track:** X Layer (tokenized stocks / RWA): investor and issuer tooling.

**One line:** ETF-issuer operations for tokenized stocks. Ganymede prices a basket
of xStocks from live X Layer liquidity and anchors every NAV on chain as the hash
of its full composition, so anyone can verify the NAV in a browser without
trusting the issuer.

## The problem

Tokenized stocks are now liquid on X Layer, but a fund built from them still
publishes its NAV the old way: a number on a website. An investor cannot check
which tokens, how many units, or which prices produced that number.

## What Ganymede does

| Step | Where |
| --- | --- |
| Hold a fixed number of xStocks units per fund share (AAPLx, MSFTx, NVDAx, AMZNx, METAx, TSLAx), equal-weight, re-fixed quarterly at the prevailing NAV | `lib/xstocks/basket.ts` |
| Price each constituent from live X Layer liquidity through OKX OnchainOS (DEX market price, chainIndex 196) | `lib/xstocks/prices.ts` |
| Refuse to publish when any price is missing or stale. There is no fallback to reference prices | `evaluateBasket` |
| Publish `publishNav(productId, nav, holdingsHash, effectiveAt)` to `GanymedeNavRegistry` on X Layer through a key-isolated relayer, with `holdingsHash = sha256(canonical composition JSON)` | `lib/xstocks/cycle.ts`, `relayer/` |
| **Proof of NAV** page reads `latestNav` straight from the chain, re-hashes the composition in the browser, and checks the arithmetic | `app/proof` |

## How to verify (≈30 seconds)

1. Open `/proof` on the demo site.
2. All three checks run in your browser: on-chain record, composition hash and
   NAV arithmetic.
3. Click the transaction link to see the `publishNav` call on the X Layer explorer.
4. Optional: COPY JSON, run `sha256sum`, and compare with `latestNav` on the
   registry contract.

## OKX integrations

- **X Layer testnet (1952):** `GanymedeNavRegistry` + `GanymedeFundShare`, deployed
  and source-verified via OKLink.
- **xStocks on X Layer mainnet (196):** the basket's constituents.
- **OKX OnchainOS Market API:** live constituent prices (signed REST, HMAC-SHA256).
- **OKX Wallet:** the preferred injected wallet; adds X Layer testnet in one click.

## Built during the build period (Sep 17–25, 2026)

Ganymede began earlier as a digital-asset ETF operations engine (strategy,
fixed-point NAV, relayer and settlement contracts) targeting a different chain.
Existing projects are allowed; this is what was added for Dev Day:

- **X Layer settlement rail:** chain registry, relayer signing for X Layer, one
  nonce queue per chain, on-chain allowlist eligibility, Hardhat network, OKLink
  verification, network-aware deploy/status/allowlist scripts.
- **GMD US TECH x basket:** fixed-unit composition with WAD precision,
  inception fixing from live prices, quarterly re-fixing with NAV continuity, and
  a publication gate on stale or missing prices.
- **OnchainOS pricing adapter:** signed requests plus `npm run xstocks:check` to
  discover, verify and price constituents.
- **Proof of NAV page:** in-browser verification against the registry's
  `latestNav`.
- **OKX Wallet support** in the wallet connector.
- **Tests:** 10 new unit tests (basket math, publication gate, hash, decoding,
  signing). Also a local end-to-end run: local chain as 1952 → real deploy
  script → relayer → engine → `latestNav` → browser checks all passing.

See the commit history from `Move settlement rail to X Layer testnet` onward.

## Deployment record

| Item | Value |
| --- | --- |
| Demo URL | _fill in_ |
| `GanymedeNavRegistry` (X Layer testnet) | _fill in_ |
| `GanymedeFundShare` (X Layer testnet) | _fill in_ |
| Example `publishNav` transaction | _fill in_ |

## 90-second demo script

1. **(0:00)** "Tokenized stocks trade on X Layer, but a fund made from them still
   reports NAV as a number you have to trust."
2. **(0:15)** Open `/proof`. "This basket holds six xStocks. Here are the exact
   units per share and the live X Layer prices."
3. **(0:35)** Point at the three green checks. "Your browser just read the NAV
   registry on X Layer, hashed this composition itself, and matched it."
4. **(0:50)** Click the transaction. "Every five minutes the engine publishes a NAV
   and its composition hash on chain through a relayer that holds no admin
   rights."
5. **(1:10)** "If any price is stale, nothing is published. No reference-price
   fallback, no silent gaps."
6. **(1:20)** "The same rails run subscriptions and redemptions against a
   permissioned share ledger. This is issuer infrastructure for tokenized-stock
   funds."

## Honest limitations

- Test environment. No fund shares are offered, and the basket is a model
  portfolio: Ganymede does not hold or custody xStocks.
- The contracts are unaudited.
- Prices come from one source (OnchainOS DEX market price). Production would add a
  second source, such as Chainlink tokenized-equity feeds, and deviation checks.
