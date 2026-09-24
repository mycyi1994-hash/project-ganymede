import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { env } from "cloudflare:workers";
import { costRemoved, DEMO_DAILY_ORDER_CAP, DEMO_START_CASH_MICROS, DemoLedger, executableNav, sharesForUsd, usdForShares } from "../lib/demo/ledger.ts";
import { orderId, parseOrder } from "../lib/demo/api.ts";
import { GET as accountGET } from "../app/api/demo/account/route.ts";
import { POST as ordersPOST } from "../app/api/demo/orders/route.ts";
import { POST as resetPOST } from "../app/api/demo/reset/route.ts";

const schema = ["0000_giant_speedball.sql", "0001_demo_ledger.sql"].map((file) => readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8")).join("\n");

/** A D1 stand-in whose batch is one transaction, as on D1: a failing statement rolls back the rest. */
function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(schema);
  const db = {
    readOnly: false,
    prepare(query) {
      if (this.readOnly && !/^\s*SELECT/i.test(query)) throw Error("Unexpected write on a read-only request");
      const prepared = sql.prepare(query);
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { return prepared.get(...args) ?? null; },
        async all() { return { results: prepared.all(...args) }; },
        async run() { return { success: true, meta: { changes: prepared.run(...args).changes } }; },
        runNow() { return { success: true, meta: { changes: prepared.run(...args).changes } }; },
      };
    },
    async batch(statements) {
      sql.exec("BEGIN");
      try {
        const results = statements.map((statement) => statement.runNow());
        sql.exec("COMMIT");
        return results;
      } catch (error) { sql.exec("ROLLBACK"); throw error; }
    },
  };
  return { db, sql };
}

const NAV = 98_996_400n; // $98.9964
const now = new Date("2026-09-25T03:00:00.000Z");
const nav = { navMicros: NAV, effectiveAt: "2026-09-25T02:55:17.000Z", holdingsHash: "0x" + "a".repeat(64) };
const cash = (account) => BigInt(account.cashMicros);

test("orders fill at the recorded NAV with integer arithmetic and an average-cost basis", async () => {
  const { db, sql } = database();
  try {
    const demo = new DemoLedger(db);
    const fresh = await demo.account("s1");
    assert.equal(fresh.exists, false);
    assert.equal(fresh.cashMicros, DEMO_START_CASH_MICROS.toString());
    const buy = await demo.place("s1", { id: "o1", side: "subscribe", usdMicros: 1_000_000_000n }, nav, now);
    assert.equal(buy.order.sharesMicros, (1_000_000_000n * 1_000_000n / NAV).toString());
    assert.equal(cash(buy.account), DEMO_START_CASH_MICROS - 1_000_000_000n);
    assert.equal(buy.account.costMicros, "1000000000");
    const held = BigInt(buy.account.sharesMicros);
    const half = held / 2n;
    const sell = await demo.place("s1", { id: "o2", side: "redeem", sharesMicros: half }, { ...nav, navMicros: 100_000_000n }, now);
    assert.equal(sell.order.usdMicros, usdForShares(half, 100_000_000n).toString());
    assert.equal(sell.account.sharesMicros, (held - half).toString());
    assert.equal(sell.account.costMicros, (1_000_000_000n - costRemoved(1_000_000_000n, held, half)).toString());
    const rest = await demo.place("s1", { id: "o3", side: "redeem", sharesMicros: held - half }, nav, now);
    assert.equal(rest.account.sharesMicros, "0");
    assert.equal(rest.account.costMicros, "0", "a full redemption removes the whole cost");
    assert.deepEqual((await demo.orders("s1")).map((order) => order.id).sort(), ["o1", "o2", "o3"]);
    assert.equal((await demo.orders("s2")).length, 0, "another session sees nothing");
    assert.equal(sharesForUsd(10n ** 6n, 10n ** 6n), 10n ** 6n);
  } finally { sql.close(); }
});

test("an order beyond the cash or shares held, or below the minimum, is refused and changes nothing", async () => {
  const { db, sql } = database();
  try {
    const demo = new DemoLedger(db);
    await assert.rejects(demo.place("s1", { id: "o1", side: "subscribe", usdMicros: DEMO_START_CASH_MICROS + 1n }, nav, now), /more than your demo cash/);
    await assert.rejects(demo.place("s1", { id: "o2", side: "subscribe", usdMicros: 9_999_999n }, nav, now), /minimum order is \$10/);
    await assert.rejects(demo.place("s1", { id: "o3", side: "redeem", sharesMicros: 1n }, nav, now), /more than the shares you hold/);
    assert.equal((await demo.account("s1")).exists, false);
    assert.equal(Number(sql.prepare("SELECT COUNT(*) n FROM demo_orders").get().n), 0);
  } finally { sql.close(); }
});

test("a retried order id replays the first fill instead of spending twice", async () => {
  const { db, sql } = database();
  try {
    const demo = new DemoLedger(db);
    const first = await demo.place("s1", { id: "o1", side: "subscribe", usdMicros: 500_000_000n }, nav, now);
    const again = await demo.place("s1", { id: "o1", side: "subscribe", usdMicros: 500_000_000n }, nav, now);
    assert.equal(again.replayed, true);
    assert.deepEqual(again.order, first.order);
    assert.equal(cash(again.account), DEMO_START_CASH_MICROS - 500_000_000n);
    // A retry that races past the lookup fails on the primary key, and the whole batch rolls back.
    const racing = new DemoLedger(db);
    racing.order = async () => null;
    await assert.rejects(racing.place("s1", { id: "o1", side: "subscribe", usdMicros: 500_000_000n }, nav, now), /already in use/);
    assert.equal(cash(await demo.account("s1")), DEMO_START_CASH_MICROS - 500_000_000n);
    assert.equal(Number(sql.prepare("SELECT orders FROM demo_daily").get().orders), 1, "the replay and the rolled-back attempt left no trace");
  } finally { sql.close(); }
});

test("a redemption priced from a stale holding is refused, and the daily cap stops new orders", async () => {
  const { db, sql } = database();
  try {
    const demo = new DemoLedger(db);
    const bought = await demo.place("s1", { id: "o1", side: "subscribe", usdMicros: 1_000_000_000n }, nav, now);
    const stale = new DemoLedger(db);
    stale.account = async () => ({ ...bought.account, sharesMicros: (BigInt(bought.account.sharesMicros) + 5n).toString() });
    await assert.rejects(stale.place("s1", { id: "o2", side: "redeem", sharesMicros: 1_000n }, nav, now), /changed while this order was placed/);
    assert.equal((await demo.account("s1")).sharesMicros, bought.account.sharesMicros);
    sql.prepare("UPDATE demo_daily SET orders = ?").run(DEMO_DAILY_ORDER_CAP);
    await assert.rejects(demo.place("s1", { id: "o3", side: "subscribe", usdMicros: 20_000_000n }, nav, now), (error) => error.status === 429 && /today's order limit/.test(error.message));
    assert.equal((await demo.orders("s1")).length, 1);
  } finally { sql.close(); }
});

test("orders fill only at a present, positive NAV recorded within the hour", () => {
  const record = { navPerShareMicros: "98996400", sharesOutstandingMicros: "0", holdingsHash: nav.holdingsHash, effectiveAt: "2026-09-25T02:10:00.000Z", publishedAt: null };
  assert.equal(executableNav(record, now.getTime()).navMicros, NAV);
  assert.throws(() => executableNav({ ...record, effectiveAt: "2026-09-25T01:59:00.000Z" }, now.getTime()), (error) => error.code === "nav_stale");
  assert.throws(() => executableNav(null, now.getTime()), (error) => error.code === "nav_unavailable");
  assert.throws(() => executableNav({ ...record, navPerShareMicros: "0" }, now.getTime()), (error) => error.code === "nav_unavailable");
});

test("order bodies are parsed strictly and order ids are scoped to the session", async () => {
  assert.deepEqual(parseOrder({ side: "subscribe", clientOrderId: "abcd-1234", usdMicros: "1000000000" }), { side: "subscribe", clientOrderId: "abcd-1234", usdMicros: 1_000_000_000n });
  assert.throws(() => parseOrder({ side: "buy", clientOrderId: "abcd-1234", usdMicros: "1" }), /side must be/);
  assert.throws(() => parseOrder({ side: "subscribe", clientOrderId: "x", usdMicros: "1" }), /clientOrderId/);
  assert.throws(() => parseOrder({ side: "redeem", clientOrderId: "abcd-1234", usdMicros: "1" }), /sharesMicros/);
  assert.throws(() => parseOrder({ side: "subscribe", clientOrderId: "abcd-1234", usdMicros: "1.5" }), /whole number/);
  assert.notEqual(await orderId("a", "abcd-1234"), await orderId("b", "abcd-1234"));
  assert.match(await orderId("a", "abcd-1234"), /^ord_[0-9a-f]{32}$/);
});

const REGISTRY = "0x" + "b".repeat(40);
const word = (value) => BigInt(value).toString(16).padStart(64, "0");
function chain(effectiveAt) {
  return async (_url, init) => {
    const { method } = JSON.parse(init.body);
    if (method === "eth_chainId") return Response.json({ jsonrpc: "2.0", id: 2, result: "0x7a0" });
    return Response.json({ jsonrpc: "2.0", id: 1, result: "0x" + word(NAV) + word(0) + "a".repeat(64) + word(Math.floor(Date.parse(effectiveAt) / 1000)) + word(0) });
  };
}
const request = (path, init = {}, cookie) => new Request(`https://demo.test${path}`, { ...init, headers: { ...(init.headers ?? {}), ...(cookie ? { cookie } : {}) } });

test("the demo routes: a read-only account view, a session cookie, orders at the chain NAV and a reset", async (t) => {
  const { db, sql } = database();
  try {
    env.DB = db;
    env.TRADING_MODE = "paper";
    env.NAV_REGISTRY_ADDRESS = REGISTRY;
    t.mock.method(globalThis, "fetch", chain(new Date(Date.now() - 120_000).toISOString()));
    db.readOnly = true;
    const view = await accountGET(request("/api/demo/account"));
    assert.equal(view.status, 200);
    const cookie = view.headers.get("set-cookie").split(";")[0];
    assert.match(cookie, /^__Host-ganymede-paper=[0-9a-f]{64}$/);
    assert.equal((await view.json()).account.cashMicros, DEMO_START_CASH_MICROS.toString());
    db.readOnly = false;
    const noSession = await ordersPOST(request("/api/demo/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ side: "subscribe", clientOrderId: "abcd-1234", usdMicros: "1000000000" }) }));
    assert.equal(noSession.status, 401);
    const crossSite = await ordersPOST(request("/api/demo/orders", { method: "POST", headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" }, body: "{}" }, cookie));
    assert.equal(crossSite.status, 403);
    const placed = await ordersPOST(request("/api/demo/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ side: "subscribe", clientOrderId: "abcd-1234", usdMicros: "1000000000" }) }, cookie));
    assert.equal(placed.status, 201, await placed.clone().text());
    const body = await placed.json();
    assert.equal(body.order.navMicros, NAV.toString());
    assert.equal(body.orders.length, 1);
    const replay = await ordersPOST(request("/api/demo/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ side: "subscribe", clientOrderId: "abcd-1234", usdMicros: "1000000000" }) }, cookie));
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).account.cashMicros, body.account.cashMicros);
    db.readOnly = true;
    const after = await (await accountGET(request("/api/demo/account", {}, cookie))).json();
    assert.equal(after.account.sharesMicros, body.account.sharesMicros);
    db.readOnly = false;
    const reset = await resetPOST(request("/api/demo/reset", { method: "POST" }, cookie));
    assert.equal((await reset.json()).account.cashMicros, DEMO_START_CASH_MICROS.toString());
    t.mock.method(globalThis, "fetch", chain(new Date(Date.now() - 2 * 3_600_000).toISOString()));
    const stale = await ordersPOST(request("/api/demo/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ side: "subscribe", clientOrderId: "efgh-5678", usdMicros: "1000000000" }) }, cookie));
    assert.equal(stale.status, 503);
    assert.equal((await stale.json()).code, "nav_stale");
    t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed https://rpc.secret.example/key"); });
    t.mock.method(console, "error", () => {});
    const down = await ordersPOST(request("/api/demo/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ side: "subscribe", clientOrderId: "ijkl-9012", usdMicros: "1000000000" }) }, cookie));
    assert.equal(down.status, 503);
    assert.doesNotMatch(await down.text(), /secret/);
  } finally { delete env.DB; delete env.NAV_REGISTRY_ADDRESS; sql.close(); }
});
