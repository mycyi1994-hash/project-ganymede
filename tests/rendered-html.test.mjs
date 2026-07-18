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
  assert.match(html, /DIGITAL ASSET ETF STRATEGIES/);
  assert.match(html, /Explore ETFs/);
  assert.match(html, /CONNECT METAMASK/);
  assert.match(html, /GIWA \/ 91342/);
});

test("direct ETF detail URLs render product and basket data", async () => {
  const response = await render("/etfs/gmd-core");
  assert.equal(response.status, 200);
  const html = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(html, /GANYMEDE CORE 20/);
  assert.match(html, /GIWA CHAIN TESTNET/);
  assert.match(html, /MARKET DATA \/ ILLUSTRATIVE/);
  assert.match(html, /NAV/);
  assert.match(html, /PERFORMANCE/);
  assert.match(html, /HOLDINGS/);
  assert.match(html, /INVESTMENT OBJECTIVE/);
  assert.match(html, /ADD TO PORTFOLIO/);
});

test("unknown ETF slugs return not found", async () => {
  const response = await render("/etfs/not-a-real-etf");
  assert.equal(response.status, 404);
});
