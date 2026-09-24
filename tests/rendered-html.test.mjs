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
  assert.match(html, /Digital-asset strategies/);
  assert.match(html, /INSPECT NAV EVIDENCE/);
  assert.match(html, /Tokenized stocks/);
  assert.match(html, /Traceable NAV/);
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
  assert.match(html, /MODEL HOLDINGS/);
  assert.match(html, /ILLUSTRATIVE YEARLY FEE/);
  assert.match(html, /Not an upfront charge/);
});

test("proof page distinguishes loading from missing configuration", async () => {
  const response = await render("/proof");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LOADING DATA/);
  assert.match(html, /Loading publications/);
  assert.doesNotMatch(html, /AWAITING CONFIGURATION/);
  assert.match(html, /LAST ON-CHAIN NAV/);
  assert.match(html, /The original document/);
  assert.match(html, /Recalculated NAV/);
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:[=>\s])/);
});

test("unknown ETF slugs return not found", async () => {
  const response = await render("/etfs/not-a-real-etf");
  assert.equal(response.status, 404);
});

test("all public screens keep the same primary links and select the requested section before hydration", async () => {
  const links = [
    ["/", "OVERVIEW"], ["/?app=select", "FUNDS"],
    ["/?app=portfolio", "MY PORTFOLIO"], ["/proof", "PROOF OF NAV"],
  ];
  for (const [path, active, heading] of [
    ["/", "/", "Tokenized stocks"],
    ["/?app=select", "/?app=select", "Find your place in the market"],
    ["/?app=portfolio", "/?app=portfolio", "Your strategies, together"],
    ["/etfs/gmd-core", "/?app=select", "GANYMEDE CORE 20"],
    ["/proof", "/proof", "LAST ON-CHAIN NAV"],
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    const nav = html.match(/<nav\b[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, `${path} must provide primary navigation`);
    const anchors = [...nav.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g)];
    assert.deepEqual(anchors.map(([, attrs, label]) => [attrs.match(/href="([^"]*)"/)?.[1], label]), links);
    const selected = anchors.filter(([, attrs]) => attrs.includes('aria-current="page"'));
    assert.equal(selected.length, 1, `${path} must select exactly one section`);
    assert.ok(selected[0][1].includes(`href="${active}"`));
    assert.ok(html.includes(heading), `${path} must render its content directly`);
    if (path.includes("?app=")) assert.ok(!html.includes('id="hero-title"'), "App screens must not first render the landing page");
  }
});
