import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Ganymede landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /GANYMEDE INDEX/);
  assert.match(html, /FOUR STRATEGIES/);
  assert.match(html, /ONE CLEAR ORBIT/);
  assert.match(html, /COMPARE STRATEGIES/);
  assert.match(html, /Know the strategy/);
  assert.match(html, /See the evidence/);
  assert.match(html, /href="\/proof"/);
  assert.match(html, /LAST ON-CHAIN NAV/);
  assert.match(html, /PRE-LAUNCH/);
  assert.match(html, /X LAYER TESTNET/);
});

test("direct ETF detail URLs render product and basket data", async () => {
  const response = await render("/etfs/gmd-core");
  assert.equal(response.status, 200);
  const html = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(html, /GANYMEDE CORE 20/);
  assert.match(html, /PRE-LAUNCH TEST ENVIRONMENT/);
  assert.match(html, /INDICATIVE FUND DATA/);
  assert.match(html, /INDICATIVE NAV/);
  assert.match(html, /MODEL RESULTS/);
  assert.match(html, /HOLDINGS/);
  assert.match(html, /INVESTMENT OBJECTIVE/);
  assert.match(html, /REVIEW SIMULATION/);
  assert.match(html, /THE FOUNDATION/);
  assert.match(html, /X Layer Testnet/);
  const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  assert.doesNotMatch(visibleHtml, /\$23\.84/);
  assert.match(html, /LOADING DATA/);
});

test("proof page distinguishes loading from missing configuration", async () => {
  const response = await render("/proof");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LOADING DATA/);
  assert.match(html, /Loading publications/);
  assert.doesNotMatch(html, /AWAITING CONFIGURATION/);
});

test("unknown ETF slugs return not found", async () => {
  const response = await render("/etfs/not-a-real-etf");
  assert.equal(response.status, 404);
});
