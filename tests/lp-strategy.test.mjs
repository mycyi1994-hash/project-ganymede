import assert from "node:assert/strict";
import test from "node:test";
import { allocateShares, constantProductRange, LP_STRATEGIES, planStrategy, strategyShape, strategyYear, workingNearNav } from "../lib/xstocks/lp-strategy.ts";

const NAV = 100_000_000n; // $100
const cp = { sharesMicros: 50_000_000n, dollarsMicros: 5_000_000_000n }; // 50 USTX, $5,000: at the NAV
const v4 = { sharesMicros: 30_000_000n, dollarsMicros: 7_000_000_000n }; // $3,000 of USTX, $7,000 of dUSD

test("a strategy splits the deposit between the pools, each part in its pool's ratio", () => {
  assert.deepEqual(LP_STRATEGIES.map(item => item.id), ["spot", "curve", "spot-curve", "custom"]);
  const plan = planStrategy(1_000_000_000n, 50, NAV, cp, v4);
  assert.ok(plan);
  // $500 to the constant-product pool at half USTX; $500 to the v4 pool at 30% USTX.
  assert.equal(plan.constantProduct.investMicros, 250_000_000n);
  assert.equal(plan.constantProduct.dollarsMicros, 250_000_000n);
  assert.equal(plan.v4.investMicros, 150_000_000n);
  assert.equal(plan.v4.dollarsMicros, 350_000_000n);
  assert.equal(plan.investMicros, 400_000_000n);
  assert.equal(plan.sharesMicros, 4_000_000n);
  const shares = allocateShares(plan, 3_999_999n);
  assert.equal(shares.constantProduct + shares.v4, 3_999_999n);
  assert.equal(shares.constantProduct, 2_499_999n);
  // All in one pool, and nothing without a NAV, an empty pool it needs, or under the fund's $10 minimum.
  assert.equal(planStrategy(1_000_000_000n, 0, NAV, cp, null).v4, null);
  assert.equal(planStrategy(1_000_000_000n, 100, NAV, null, v4).constantProduct, null);
  assert.equal(planStrategy(1_000_000_000n, 50, null, cp, v4), null);
  assert.equal(planStrategy(1_000_000_000n, 50, NAV, cp, null), null);
  assert.equal(planStrategy(20_000_000n, 100, NAV, cp, v4), null);
  assert.ok(planStrategy(40_000_000n, 100, NAV, cp, v4));
});

test("the shape puts a Curve deposit near the NAV and a Spot deposit across every price", () => {
  const constantProduct = { ranges: constantProductRange(cp), price: 100, valueMicros: 10_000_000_000n };
  // One range of ±2% around $100 holding the v4 pool's value.
  const lower = 98, upper = 102, sp = Math.sqrt(100);
  const liquidity = 10_000 / ((sp - Math.sqrt(lower)) + 100 * (1 / sp - 1 / Math.sqrt(upper))) * 1e6;
  const pegged = { ranges: [{ lower, upper, liquidity }], price: 100, valueMicros: 10_000_000_000n };
  const curve = strategyShape({ navMicros: NAV, constantProductMicros: 0n, v4Micros: 1_000_000_000n, constantProduct, v4: pegged });
  const spot = strategyShape({ navMicros: NAV, constantProductMicros: 1_000_000_000n, v4Micros: 0n, constantProduct, v4: pegged });
  assert.equal(curve.length, 24);
  const nearCurve = workingNearNav(curve, NAV), nearSpot = workingNearNav(spot, NAV);
  // USTX is valued at each bin's middle price, so a little above the price it was bought at.
  assert.ok(Math.abs(nearCurve.v4 - 1_000) < 10, `curve ${nearCurve.v4}`);
  assert.equal(nearCurve.constantProduct, 0);
  // A constant-product pool keeps about 1% of its value within 2% of the price.
  assert.ok(nearSpot.constantProduct > 9 && nearSpot.constantProduct < 11, `spot ${nearSpot.constantProduct}`);
  // Below the NAV the bins hold demo dollars, above it USTX.
  assert.equal(curve[0].side, "dollars");
  assert.equal(curve[23].side, "shares");
});

test("a year at the measured results adds each pool's part", () => {
  assert.equal(strategyYear(5_000_000_000n, 5_000_000_000n, { constantProduct: 2_000_000_000n, v4: 1_000_000_000n }), 1_500_000_000n);
  assert.equal(strategyYear(0n, 1_000_000_000n, { constantProduct: null, v4: 1_000_000_000n }), 100_000_000n);
  assert.equal(strategyYear(1n, 0n, { constantProduct: null, v4: null }), null);
});
