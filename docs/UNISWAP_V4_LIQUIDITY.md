# USTX liquidity on Uniswap v4

USTX has a fair price that is not discovered in any pool: the NAV recorded every five minutes from
the xStocks' prices. `GanymedeUstxPool`, the constant-product market, moves only when someone trades
in it, so every NAV record leaves its price behind, and the first trade after a record, often the
arbitrage keeper's, buys from or sells to its liquidity providers at the old price. That loss grows
with the square of the NAV's move and is the main cost of providing liquidity to a tokenized asset.

`contracts/GanymedeRwaLiquidityHook.sol` is a Uniswap v4 hook that runs a USTX/dUSD pool around the
NAV instead, and is the vault of the liquidity providers who fund it. It is written for any ERC-20
asset with a price feed in Chainlink's `AggregatorV3Interface`; on X Layer Testnet that is USTX with
`GanymedeNavFeed`. It is tested on a local v4 pool manager and on a fork of X Layer Testnet, and it
is not deployed.

## How it works

**One pool, owned liquidity.** The hook opens its pool in its constructor: USTX and dUSD sorted by
address, a dynamic fee, tick spacing 10, at the price the NAV gives. The pool manager does not call a
hook back for the hook's own calls, and the hook refuses every other pool (`beforeInitialize`) and all
liquidity it does not add itself (`beforeAddLiquidity`). So the hook is the pool's only liquidity
provider, and it issues ERC-20 shares (`USTX-V4LP`, 6 decimals) to the people who fund it.

**Deposits and withdrawals.** The first deposit takes both tokens in full, needs a fresh NAV and mints
their value at the NAV in dollar units, less 1,000 shares locked for good; a first deposit must be
worth at least $10. Later deposits name the most of each token they will pay and a minimum number of
shares; they get the most shares those amounts buy at the ratio the hook holds the two tokens, and pay
each token's share of the holdings rounded up. A deposit waits as an ERC-6909 claim in the pool
manager until the next NAV record puts it to work, so liquidity cannot be added just in time around a
known trade. A withdrawal pays the shares' part of the ranges and of the idle claims, fees included,
rounded down, at any time and with any NAV, stale or missing.

**Ranges.** The liquidity sits in two ranges. The base range covers 200 ticks (about 2%) on each side
of the NAV and is as large as the holdings allow; whichever token it cannot use goes into a one-sided
range 300 ticks wide next to the NAV, on the side where that token sells. After buyers have taken USTX
the pool is long dollars, which then bid for USTX just below the NAV; after sellers it is long USTX,
offered just above it. Deep liquidity at the NAV and inventory that leans back toward balance are what
a market maker in a tokenized fund aims for.

**Re-peg.** At each new NAV record, before the first swap that follows it (or when anyone calls
`repeg()`), the hook takes both ranges out, fees included, moves the pool's price to the new NAV and
puts everything back around it. With the hook's liquidity out the pool is empty, and moving the price
of an empty pool exchanges nothing: the same tokens go back in around the new price. The liquidity
providers keep the value they had at the new NAV, less a few base units of rounding, instead of
selling the difference to an arbitrageur.

**Fee and limits.** Between records the pool trades on Uniswap's concentrated-liquidity curve. The
fee is 0.30% with a fresh NAV and rises linearly to 1.00% at an hour, because an older NAV is a less
certain price. Past an hour swaps stop, as the fund's orders and the lending market's loans do, until
a new record arrives. No swap may leave the price more than 500 ticks (about 5%) from the NAV. The
hook has no owner, no pause and nothing to configure.

**Around it.** `contracts/GanymedeV4Router.sol` swaps on a v4 pool where no Uniswap router serves it:
exact input with a minimum output or exact output with a maximum input, a deadline, and quotes that
run the same swap and revert with the result (call them with `eth_call`). A swap that fills less than
asked reverts. The pool manager reads a hook's permissions from the low 14 bits of its address, so the
hook is deployed with CREATE2 through the deterministic deployment proxy
(`0x4e59b44847b379578588920ca78fbf26c0b4956c`, present on X Layer Testnet) at a salt mined for
exactly its four permissions (`onchain/scripts/_v4.ts`).

**Pool manager.** Uniswap has deployed v4 on X Layer mainnet, with its PoolManager at
[`0x360e68faccca8ca495c1b759fd9eee466db9fb32`](https://web3.okx.com/explorer/x-layer/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32),
but not on X Layer Testnet. The tests and scripts deploy the PoolManager from `@uniswap/v4-core`
1.0.2 as Uniswap built it (solc 0.8.26, via IR, Cancun). `npm run fork:v4` first checks that this is
the code running at Uniswap's X Layer mainnet address, apart from the one immutable that holds the
contract's own address. X Layer Testnet runs the Cancun opcodes the pool manager needs (`TSTORE`,
`MCOPY`, `PUSH0`).

## What the tests show

`onchain/test/GanymedeRwaLiquidityHook.test.ts`, 19 tests on the canonical pool manager with the
real fund, demo dollar, NAV registry and NAV feed contracts:

- the pool opens at the NAV, the hook's address carries its permissions, and no one else can open a
  pool with the hook, add liquidity to its pool or call its callbacks;
- NAVs from $0.0001 to $1,000,000,000 a share map to exactly the pool price computed off chain, with
  USTX as either of the pool's two currencies;
- the first deposit mints its value at the NAV and centres the ranges on it; later deposits pay their
  share of the holdings rounded up and match `previewDeposit` exactly; withdrawals match
  `previewWithdraw` exactly, include fees and work with a stale NAV;
- the fee is 0.30% plus the NAV's age (0.65% at half an hour, 1.00% at an hour) and swaps stop after
  an hour; a buy and a sell back leave the providers about 0.3% of each leg richer;
- **with the NAV recorded 5% higher, an arbitrageur takes $2.689195 from $10,000 in the
  constant-product pool, exactly what its providers lose, while the hooked pool re-pegs with a zero
  swap and its providers lose less than a tenth of a cent**; afterwards buying USTX in the hooked pool
  and redeeming it at the fund loses money;
- swaps that would take the price more than 5% from the NAV revert; what the base range cannot use is
  placed on the side where it sells, in both token orders;
- with USTX as the pool's second currency (negative ticks), and with a $1.00 NAV that lands exactly on
  tick 0, where the pool manager leaves its tick at -1 after moving down onto it, the books still
  balance;
- a seeded random run of 120 steps of deposits, withdrawals, trades and NAV records checks after each
  one that the hook's ERC-6909 claims equal its idle balances and that every holder could withdraw;
  at the end everyone does, and less than ten cents stays with the locked shares;
- donations to the pool reach the providers; tokens sent to the hook directly are ignored;
- the router fills exact input and exact output within the trader's limits, and refuses a partial fill.

The tests deploy through the same routine as the scripts (`deployRwaLiquidity` in
`onchain/scripts/_v4.ts`). The existing contracts, deployed ones included, compile to the same
bytecode as before.

## The fork run on 30 September 2026

`npm run fork:v4` (in `onchain/`) forks X Layer Testnet into memory, deploys the pool manager, the
hook (against the live USTX fund, dUSD and `GanymedeNavFeed`) and the router, and walks one cycle with
local test accounts. It uses no key and broadcasts nothing.

```text
Uniswap's PoolManager on X Layer mainnet (0x360e68faccca8ca495c1b759fd9eee466db9fb32) runs the same code as the one deployed below, apart from its own address
forked X Layer Testnet at block 42278119 (in memory only)

live USTX NAV $97.886159 from 0x292c56c5290cc7b73e3ee33c2c2688eb3e04c3c8, recorded 44 s before the fork's latest block

deploying on the fork...
  deploy PoolManager         0x9dc93854096a120623c90ac429fa9d340d6c3132fd24908ee32f9b14e924bc67  gas 5243607
  hook address 0x8160B5ad24AF058Dd346C2220e284E15E5b668c0 (salt 0x0000000000000000000000000000000000000000000000000000000000000568)
  deploy hook (CREATE2)      0x06f2598047b174555134364ff57e5891c641f27995761aafc080b4b652e81272  gas 4794667
  deploy GanymedeV4Router    0x45bbb84b541a0cb9282cbee453b91b1510d7c75b0ef5f89d9bcc70083dfe9044  gas 1031183
pool 0xade0fce3b0319ccccb7b95f22291856153ee9e72790d47eecd08e184dbc8c39b: USTX is currency0, opened at $97.8862

provider bought 51.079744 USTX for $5,000 at the fund and deposited it with $5,000: 9999.998942 LP shares
  base range $95.9447 to $99.9600 around the NAV; holdings worth $9,999.999842 at the NAV

trader bought 10.162071 USTX for $1,000 ($98.405138 each, fee 0.3206%); pool price now $98.2936
trader sold half of it back; pool price $98.0902

publisher (impersonated) records a NAV 1% higher: $98.86502
  live constant-product pool price $98.059785, -0.81% from the new NAV
  an arbitrage bought its USTX below the NAV and redeemed it at the fund for $0.033322; its providers ($9,964.469187 at the new NAV) lost $0.033323
  hooked pool: the next swap moved it to the new NAV before trading; price after the $10 swap $98.8693
  providers' holdings at the new NAV $10,050.347417 before, $10,050.377767 after (the $10 swap's fee included)

provider withdrew 45.897861 USTX and $5,512.683874: $10,050.376819 at the new NAV (holding the deposit instead: $10,049.999912)

gas used
  deploy PoolManager   5,243,607
  deploy hook          4,794,667
  deploy router        1,031,183
  first deposit        547,311
  swap                 185,253
  swap                 163,047
  swap that re-pegs    670,472
  withdraw             320,124

Nothing was broadcast; the fork is discarded when this process exits.
```

The live constant-product pool sat 0.18% above the old NAV, inside its 0.3% fee, so a 1% record
opened only a small arbitrage there; the tests' 5% record shows the difference more plainly. The
provider in the hooked pool ended $0.38 ahead of holding the deposit, from the trader's fees.

## Deploying

`npm run deploy:v4` (in `onchain/`) deploys on X Layer Testnet with `ADMIN_PRIVATE_KEY`: the pool
manager, owned by the administrator, whose only power over it is to appoint who may switch on
Uniswap's protocol fee (at most 0.1% of a swap); the hook; and the router. Each transaction carries
its own nonce and gas limit. The script then seeds the pool from the
administrator wallet (claim 10,000 dUSD, invest $5,000 at the fund, deposit the USTX with $5,000). It
reads the wiring back at the seeding block and records the three addresses, the CREATE2 salt and the
pool ID in `deployments/xlayer-testnet.json`. Deploying needs the user's approval. After deploying,
`npm run verify:export` includes the hook and the router, and a keeper can call `repeg()` after each
NAV record so traders do not pay for it.

## What this does not cover

- **The NAV's latency.** A record prices the xStocks a few minutes earlier, and the prices are public
  before the record lands. Someone who knows the next NAV can trade at the current one until it does.
  The fee, its rise with the NAV's age and the curve's slippage bound this, but a move larger than the
  fee between two records is still an opening. The testnet fund's own orders fill at the recorded NAV
  with no fee, a wider version of the same gap.
- **Standard ERC-20 tokens only.** The pool manager credits what actually arrives, so a token that
  delivers less than it is asked to send leaves it unsettled and the call reverts. xStocks can arrive a
  base unit short ([the in-kind vault record](IN_KIND_VAULT.md)); a pool of xStocks would hold
  `GanymedeBasketVault` shares, which are standard, rather than the xStocks themselves.
- **When it stops.** Swaps stop while the NAV is over an hour old or maps outside the tick range, and a
  paused USTX stops swaps, deposits and withdrawals until it is unpaused. Deposits earn from the next
  NAV record. The first swap after a record pays about 500,000 more gas for the re-peg unless someone
  calls `repeg()` first.
- **Status.** Not deployed and not audited. The app does not show the pool yet; after a deployment it
  would read `totalAmounts`, `previewDeposit`, `previewWithdraw` and the router's quotes. The pool
  manager is Uniswap's BUSL-1.1 code, deployed here only on a testnet; the hook and router import
  v4-core's MIT-licensed interfaces and libraries. Demo dollars and USTX have no value.
