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

**Deposits are priced forward.** The first deposit takes both tokens in full, needs a fresh NAV,
mints their value at the NAV in dollar units, less 1,000 shares locked for good, and opens the
ranges; it must be worth at least $10. Every later deposit is priced the way a fund prices
subscriptions, at the next NAV: it names the most of each token it will pay, takes them at the ratio
the hook holds the two tokens, and waits as an ERC-6909 claim in the pool manager. At the next NAV
record the re-peg values the waiting deposits and everything the shares already own at that NAV,
mints the deposits' shares in that proportion (rounded down) and puts the tokens to work. The
depositor then claims the shares (`claimShares`, or the next `deposit` or `withdraw` does it) and can
cancel before, getting exactly the deposit back. A deposit therefore earns nothing from trades made
before its liquidity is in the pool: without this, a deposit made just before a known trade and
withdrawn just after would take a pro-rata part of that trade's fee and spread while its tokens sat
idle. A withdrawal pays the shares' part of the ranges and of the idle claims, fees included, rounded
down, at any time and with any NAV, stale or missing.

**Ranges.** The liquidity sits in two ranges. The base range covers 200 ticks (about 2%) on each side
of the NAV and is as large as the holdings allow; whichever token it cannot use goes into a one-sided
range 300 ticks wide next to the NAV, on the side where that token sells. After buyers have taken USTX
the pool is long dollars, which then bid for USTX just below the NAV; after sellers it is long USTX,
offered just above it. Deep liquidity at the NAV and inventory that leans back toward balance are what
a market maker in a tokenized fund aims for.

**Re-peg.** At each new NAV record, before the first swap that follows it (or when anyone calls
`repeg()`), the hook takes both ranges out, fees included, turns the waiting deposits into shares,
moves the pool's price to the new NAV and puts everything back around it. With the hook's liquidity
out the pool is empty, and moving the price of an empty pool exchanges nothing: the same tokens go
back in around the new price. The liquidity providers keep the value they had at the new NAV, less a
few base units of rounding, instead of selling the difference to an arbitrageur.

**Fee and limits.** Between records the pool trades on Uniswap's concentrated-liquidity curve. The
fee is 0.30% with a fresh NAV and rises linearly to 1.00% at an hour, because an older NAV is a less
certain price. Past an hour swaps stop, as the fund's orders and the lending market's loans do, until
a new record arrives; a record dated after the block is refused, since it would never age. No swap
may leave the price more than 500 ticks (about 5%) from the NAV. The hook has no owner, no pause and
nothing to configure.

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

`onchain/test/GanymedeRwaLiquidityHook.test.ts`, 22 tests on the canonical pool manager with the
real fund, demo dollar, NAV registry and NAV feed contracts:

- the pool opens at the NAV, the hook's address carries its permissions, and no one else can open a
  pool with the hook, add liquidity to its pool or call its callbacks;
- NAVs from $0.0001 to $1,000,000,000 a share map to exactly the pool price computed off chain, with
  USTX as either of the pool's two currencies;
- the first deposit mints its value at the NAV and centres the ranges on it; a later deposit takes its
  tokens at the holdings' ratio, waits without changing the ranges or what the shares own, and at the
  next record becomes shares worth its value at that NAV;
- **a deposit made just before a $2,000 trade gets none of that trade's gain**: cancelled, it returns
  exactly; left to convert, it is priced after the trade, and its shares are worth what it put in;
- withdrawals match `previewWithdraw` exactly, include fees, leave waiting deposits alone and work
  with a stale NAV;
- the fee is 0.30% plus the NAV's age (0.65% at half an hour, 1.00% at an hour) and swaps stop after
  an hour, or at once when a record is dated after the block; a buy and a sell back leave the
  providers about 0.3% of each leg richer;
- **with the NAV recorded 5% higher, an arbitrageur takes $2.689195 from $10,000 in the
  constant-product pool, exactly what its providers lose, while the hooked pool re-pegs with a zero
  swap and its providers lose less than a tenth of a cent**; afterwards buying USTX in the hooked pool
  and redeeming it at the fund loses money;
- the limit that remains: buying $1,500 of USTX at the old NAV before a record 2% higher lands, then
  redeeming it at the fund, still takes $20.69 from the providers;
- swaps that would take the price more than 5% from the NAV revert; what the base range cannot use is
  placed on the side where it sells, in both token orders;
- with USTX as the pool's second currency (negative ticks), and with a $1.00 NAV that lands exactly on
  tick 0, where the pool manager leaves its tick at -1 after moving down onto it, the books still
  balance;
- a seeded random run of 140 steps (24 deposits, 4 cancellations, 11 withdrawals, 34 trades, NAV
  records and 16 re-pegs with 9 conversions) checks after each one that the hook's ERC-6909 claims
  equal its idle balances and cover the waiting deposits, that the waiting deposits add up, and that
  every holder could withdraw; at the end everyone does, and less than ten cents stays behind;
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
forked X Layer Testnet at block 42280614 (in memory only)

live USTX NAV $97.884861 from 0x292c56c5290cc7b73e3ee33c2c2688eb3e04c3c8, recorded 439 s before the fork's latest block

deploying on the fork...
  deploy PoolManager         0x83a2a0576196f5d6f4437340e20cfd70b63204fa825cafbb145f95ed1c1e0b81  gas 5243607
  hook address 0xe29582d5E1C9083AB4D6C5e6d7c24b50Dd20E8c0 (salt 0x00000000000000000000000000000000000000000000000000000000000024c5)
  deploy hook (CREATE2)      0x10d159b16baaafaf6d18c350fbb1922b351250a5697cb9c95679fc7dce14edc1  gas 5462181
  deploy GanymedeV4Router    0xad9edbdcce9cfb8c60bcbb5cffdaeb30195013d4e5205c1685754562d87584d7  gas 1031183
pool 0xcbba53687e5afdee46a28aecf5976d231a4a38607d4215a26b827941912d3c1d: USTX is currency0, opened at $97.8849

provider bought 51.080421 USTX for $5,000 at the fund and deposited it with $5,000: 9999.998909 LP shares
  base range $95.9447 to $99.9600 around the NAV; holdings worth $9,999.999809 at the NAV

trader bought 10.154226 USTX for $1,000 ($98.481164 each, fee 0.3989%); pool price now $98.2922
trader sold half of it back; pool price $98.0890
second provider deposited 16.717943 USTX and $2,000.00 at the pool's ratio; it waits for the next NAV record

publisher (impersonated) records a NAV 1% higher: $98.863709
  live constant-product pool price $98.059785, -0.81% from the new NAV
  an arbitrage bought its USTX below the NAV and redeemed it at the fund for $0.033215; its providers ($9,964.40285 at the new NAV) lost $0.033215
  hooked pool: the next swap moved it to the new NAV before trading; price after the $10 swap $98.8669
  the first provider's shares at the new NAV: $10,051.521409 before, $10,051.543785 after (with their part of the $10 swap's fee)
  the waiting deposit, worth $3,652.797851 at the new NAV, became 3634.07414 shares

provider withdrew 45.929338 USTX and $5,510.799079: $10,051.543785 at the new NAV (holding the deposit instead: $10,049.999877)
second provider claimed its shares and withdrew 16.691063 USTX and $2,002.66546: $3,652.805855 at the new NAV

gas used
  deploy PoolManager   5,243,607
  deploy hook          5,462,181
  deploy router        1,031,183
  first deposit        578,718
  swap                 185,395
  swap                 163,225
  later deposit        394,402
  swap that re-pegs    706,062
  withdraw             329,308
  claim and withdraw   241,479

Nothing was broadcast; the fork is discarded when this process exits.
```

The live constant-product pool sat 0.18% above the old NAV, inside its 0.3% fee, so a 1% record
opened only a small arbitrage there; the tests' 5% record shows the difference more plainly. The
first provider in the hooked pool ended $1.54 ahead of holding the deposit, from the trader's fees.
The second provider's deposit waited through the trades and became shares at the new NAV, which it
withdrew for what it was worth then plus its part of the last swap's fee.

## Deploying

`npm run deploy:v4` (in `onchain/`) deploys on X Layer Testnet with `ADMIN_PRIVATE_KEY`: the pool
manager, owned by the administrator, whose only power over it is to appoint who may switch on
Uniswap's protocol fee (at most 0.1% of a swap); the hook; and the router. Each transaction carries
its own nonce and gas limit. The script then seeds the pool from the administrator wallet (claim
10,000 dUSD, invest $5,000 at the fund, deposit the USTX with $5,000), reads the wiring back at the
seeding block and records the three addresses, the CREATE2 salt and the pool ID in
`deployments/xlayer-testnet.json`. Deploying needs the user's approval. After deploying,
`npm run verify:export` includes the hook and the router, and a keeper can call `repeg()` after each
NAV record so traders do not pay for it.

## What this does not cover

- **The NAV's latency.** A record prices the xStocks a few minutes earlier, and the prices are public
  before the record lands. Someone who knows the next NAV can trade at the current one until it does:
  in the tests, $1,500 bought before a record 2% higher and redeemed at the fund after it takes $20.69
  from a $10,000 pool. The fee, its rise with the NAV's age and the curve's slippage bound this, but a
  move larger than the fee between two records is still an opening; records more often, a fee sized
  to the move expected between records, or a surcharge on trades that move the price far from the NAV
  would narrow it. The testnet fund's own orders fill at the recorded NAV with no fee, a wider version
  of the same gap.
- **Standard ERC-20 tokens only.** The pool manager credits what actually arrives, so a token that
  delivers less than it is asked to send leaves it unsettled and the call reverts. xStocks can arrive a
  base unit short ([the in-kind vault record](IN_KIND_VAULT.md)); a pool of xStocks would hold
  `GanymedeBasketVault` shares, which are standard, rather than the xStocks themselves.
- **When it stops.** Swaps stop while the NAV is over an hour old, dated after the block or maps
  outside the tick range, and a paused USTX stops swaps, deposits and withdrawals until it is
  unpaused. A deposit becomes shares only at the next NAV record, so while records stall it waits (it
  can be cancelled). The first swap after a record pays about 540,000 more gas for the re-peg unless
  someone calls `repeg()` first.
- **Status.** Not deployed and not audited; one independent review round changed deposits to forward
  pricing and added the future-date check. The app does not show the pool yet; after a deployment it
  would read `totalAmounts`, `previewDeposit`, `estimateShares`, `pendingOf`, `claimableShares`,
  `previewWithdraw` and the router's quotes. The pool manager is Uniswap's BUSL-1.1 code, deployed
  here only on a testnet; the hook and router import v4-core's MIT-licensed interfaces and
  libraries. Demo dollars and USTX have no value.
