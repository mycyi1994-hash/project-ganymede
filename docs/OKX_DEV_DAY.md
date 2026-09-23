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
| Refuse to publish when any price is missing or unreadable, or the price API fails. There is no fallback to reference prices | `evaluateBasket` |
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
  and source-verified on the OKX explorer (Standard JSON input from
  `npm run verify:export`).
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
  a publication gate on missing prices.
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
| Demo URL | https://ganymede-xlayer.gana003.workers.dev/proof |
| `GanymedeNavRegistry` (X Layer testnet) | [`0xf320d2a7f280b7ab61e24374986869d7be34289c`](https://web3.okx.com/explorer/x-layer-testnet/address/0xf320d2a7f280b7ab61e24374986869d7be34289c) |
| `GanymedeFundShare` (X Layer testnet) | [`0x68c4e8c904b3eddb1146ef52a76a0a2755a55b59`](https://web3.okx.com/explorer/x-layer-testnet/address/0x68c4e8c904b3eddb1146ef52a76a0a2755a55b59) |
| Example `publishNav` transaction | [`0xc3f3f6c4bd0f0c85c98ddfb8049a39560b11cb9dee59d58f21f095630c2a16ba`](https://web3.okx.com/explorer/x-layer-testnet/tx/0xc3f3f6c4bd0f0c85c98ddfb8049a39560b11cb9dee59d58f21f095630c2a16ba) (GMD US TECH x inception NAV, 2026-09-23 11:15:53 UTC) |
| Settlement relayer | https://ganymede-settlement-relayer.gana003.workers.dev/v1/health |

Constituents on X Layer mainnet (196), from the xStocks product list at
[xstocks.fi](https://xstocks.fi/us/products) and confirmed on chain with
`npm run xstocks:check -- verify` (symbol and 18 decimals). All six share one
proxy implementation.

| Token | Address |
| --- | --- |
| AAPLx | `0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a` |
| MSFTx | `0x5621737f42dae558b81269fcb9e9e70c19aa6b35` |
| NVDAx | `0xc845b2894dbddd03858fd2d643b4ef725fe0849d` |
| AMZNx | `0x3557ba345b01efa20a1bddc61f573bfd87195081` |
| METAx | `0x96702be57cd9777f835117a809c7124fe4ec989a` |
| TSLAx | `0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0` |

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
5. **(1:10)** "If any price is missing, nothing is published. No reference-price
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
- OnchainOS stamps each price with the time of the response, not of the last
  trade, so the quote-age limit cannot tell that a pool has stopped trading.
  Production would also require recent trades or a liquidity floor before
  publishing.
