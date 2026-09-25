import assert from "node:assert/strict";
import test from "node:test";
import { MIN_TRADE_MICROS, runKeeper, xlayerKeeperChain } from "../src/keeper.ts";

const USD = 1_000_000n;

/** A keeper chain answering from `state`; every write succeeds unless named in `state.revert`. */
function fakeChain(state) {
  const calls = [];
  const write = (name) => async (...args) => {
    calls.push([name, ...args]);
    return { hash: `0x${String(calls.length).padStart(64, "0")}`, success: state.revert !== name };
  };
  return {
    calls,
    chain: {
      quote: async () => {
        if (state.quoteError) throw state.quoteError;
        return state.quote;
      },
      dollarBalance: async () => state.balance ?? 0n,
      allowance: async () => state.allowance ?? 0n,
      nextClaimAt: async () => state.nextClaimAt ?? 0n,
      now: async () => state.now ?? 1_000n,
      claim: write("claim"),
      approve: write("approve"),
      arbitrage: write("arbitrage"),
    },
  };
}

const discount = { buyInPool: true, dollarsIn: 447_824_215n, dollarsOut: 491_800_048n };

test("does nothing while the pool is within its fee of the NAV", async () => {
  const { chain, calls } = fakeChain({ quote: { buyInPool: false, dollarsIn: 0n, dollarsOut: 0n }, balance: 10_000n * USD });
  assert.deepEqual(await runKeeper(chain), { action: "none", reason: "the pool is within its fee of the NAV" });
  assert.deepEqual(calls, []);
});

test("does nothing without a usable NAV", async () => {
  const { chain, calls } = fakeChain({ quoteError: new Error("NavTooOld(1790000000) at https://rpc.example/key") });
  const outcome = await runKeeper(chain);
  assert.equal(outcome.action, "none");
  assert.match(outcome.reason, /^no quote: NavTooOld/);
  assert.doesNotMatch(outcome.reason, /rpc\.example/);
  assert.deepEqual(calls, []);
});

test("closes a discount by buying in the pool and redeeming at the fund, keeping half the expected profit as a floor", async () => {
  const { chain, calls } = fakeChain({ quote: discount, balance: 10_000n * USD, allowance: 2n ** 256n - 1n });
  const outcome = await runKeeper(chain);
  assert.deepEqual(calls, [["arbitrage", true, discount.dollarsIn, (discount.dollarsOut - discount.dollarsIn) / 2n]]);
  assert.equal(outcome.action, "arbitrage");
  assert.equal(outcome.direction, "buyAndRedeem");
  assert.equal(outcome.dollarsIn, "447824215");
  assert.equal(outcome.success, true);
});

test("claims demo dollars and approves the arbitrage contract first when it needs to", async () => {
  const premium = { buyInPool: false, dollarsIn: 120n * USD, dollarsOut: 121n * USD };
  const { chain, calls } = fakeChain({ quote: premium, balance: 100n * USD, allowance: 0n, nextClaimAt: 900n, now: 1_000n });
  const outcome = await runKeeper(chain);
  assert.deepEqual(calls.map(([name]) => name), ["claim", "approve", "arbitrage"]);
  assert.deepEqual(calls[2], ["arbitrage", false, 120n * USD, USD / 2n]);
  assert.equal(outcome.direction, "investAndSell");
});

test("trades what it holds when it cannot claim yet, insisting only on no loss", async () => {
  const { chain, calls } = fakeChain({ quote: discount, balance: 200n * USD, allowance: 2n ** 256n - 1n, nextClaimAt: 5_000n, now: 1_000n });
  await runKeeper(chain);
  assert.deepEqual(calls, [["arbitrage", true, 200n * USD, 0n]]);
});

test("ignores a gap whose best trade is under $1, without claiming for it", async () => {
  const { chain, calls } = fakeChain({ quote: { buyInPool: true, dollarsIn: 673_602n, dollarsOut: 673_681n }, balance: 0n });
  const outcome = await runKeeper(chain);
  assert.equal(outcome.action, "none");
  assert.match(outcome.reason, /the gap calls for 673602/);
  assert.deepEqual(calls, []);
});

test("skips a trade below the minimum, including an investment under the fund's $10", async () => {
  const small = fakeChain({ quote: discount, balance: MIN_TRADE_MICROS - 1n, nextClaimAt: 5_000n, now: 1_000n });
  assert.equal((await runKeeper(small.chain)).action, "none");
  const invest = fakeChain({ quote: { buyInPool: false, dollarsIn: 12n * USD, dollarsOut: 12_100_000n }, balance: 5n * USD, nextClaimAt: 5_000n, now: 1_000n });
  const outcome = await runKeeper(invest.chain);
  assert.equal(outcome.action, "none");
  assert.match(outcome.reason, /below the 10000000 a trade needs/);
  assert.deepEqual([...small.calls, ...invest.calls], []);
});

test("stops when a claim or an approval reverts, and reports a reverted trade", async () => {
  const claim = fakeChain({ quote: discount, balance: 0n, revert: "claim" });
  assert.match((await runKeeper(claim.chain)).reason, /^claim reverted/);
  assert.deepEqual(claim.calls.map(([name]) => name), ["claim"]);

  const approve = fakeChain({ quote: discount, balance: 10_000n * USD, allowance: 0n, revert: "approve" });
  assert.match((await runKeeper(approve.chain)).reason, /^approve reverted/);
  assert.deepEqual(approve.calls.map(([name]) => name), ["approve"]);

  const trade = fakeChain({ quote: discount, balance: 10_000n * USD, allowance: 2n ** 256n - 1n, revert: "arbitrage" });
  assert.equal((await runKeeper(trade.chain)).success, false);
});

test("the Worker refuses to start without its key and addresses", () => {
  assert.throws(() => xlayerKeeperChain({}), /KEEPER_PRIVATE_KEY is not set/);
  const key = `0x${"1".repeat(64)}`;
  assert.throws(() => xlayerKeeperChain({ KEEPER_PRIVATE_KEY: key }), /ARBITRAGE_ADDRESS is not set/);
  assert.throws(() => xlayerKeeperChain({ KEEPER_PRIVATE_KEY: key, ARBITRAGE_ADDRESS: `0x${"a".repeat(40)}` }), /DOLLAR_ADDRESS is not set/);
});
