# Ganymede on-chain tooling

Deploys, verifies and inspects the GIWA settlement contracts in `../contracts`.

Requires Node.js `>=22.13.0`. Build output stays in this directory; the Solidity
sources stay in `contracts/`.

```bash
cd onchain
npm install
npm run build   # compile
npm test        # 14 tests, no network needed
```

## Keys

Two independent keys. This separation is the security model — do not collapse them.

| Key | Holds | Exposure |
| --- | --- | --- |
| `ADMIN_PRIVATE_KEY` | administrator on both contracts, transfer agent on the share ledger | cold, used only for deploy / allowlist / pause |
| `RELAYER_PRIVATE_KEY` | issuer on the share ledger, publisher on the NAV registry | hot, lives in the relayer Worker |

A leaked relayer key can mint, burn and publish. It cannot pause, reassign roles
or allowlist an investor. In production both roles move to independent multisigs
(`contracts/README.md`).

Generate them locally and keep them out of the repository:

```bash
cp .env.example .env
# then fill in ADMIN_PRIVATE_KEY and RELAYER_PRIVATE_KEY
```

Fund `ADMIN` and `RELAYER` with GIWA Sepolia ETH before deploying — both send
transactions.

## Deploy

```bash
npm run deploy
```

Deploys `GanymedeFundShare` and `GanymedeNavRegistry`, hands issuance to the
relayer key, asserts every role landed as intended, and writes
`deployments/giwa-sepolia.json`. It prints the two `hardhat verify` commands and
the `.env` lines for the application.

One NAV registry serves all four products — the product id is a `bytes32` key.
The share ledger carries one fund's name and symbol, so it is deployed for
`GMD CORE` first; the other three follow the same pattern when needed.

## Verify the sources

Source verification is what makes the contract readable on the explorer. Run the
two commands the deploy step printed:

```bash
npx hardhat verify --network giwaSepolia <fundShare> "Ganymede Core 20" "GMDCORE" <admin>
npx hardhat verify --network giwaSepolia <navRegistry> <admin> <relayer>
```

Verified sources appear under the `Contract` tab at
`https://sepolia-explorer.giwa.io/address/<address>`.

## Allowlist an investor

Minting to a wallet that is not allowlisted reverts with `TransferRestricted`.
Allowlisting runs under `ADMIN`, never the relayer:

```bash
WALLETS=0xabc...,0xdef... npm run allowlist
```

## Inspect

```bash
npm run status
```

Reads roles, total supply, pause state and the latest published NAV per product
straight off chain, and prints the explorer links.

## Generating on-chain activity

A deployed contract with no transactions does not demonstrate a working system.
Activity comes from the engine itself once the relayer is wired up — see
`../relayer/README.md`. Each engine cycle publishes a NAV per product plus
rebalance evidence, so the explorer fills with real settlement traffic rather
than hand-made demo transactions.

## Status

Source-verified on the explorer, **unaudited**. GIWA Sepolia is a settlement test
rail; it is not proof of custody, licensing or an Upbit mainnet relationship.
