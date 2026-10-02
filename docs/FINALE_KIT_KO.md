# 결선 발표 키트 (내부용)

비공개 개발 저장소 전용 문서다. 공개 스냅샷에는 넣지 않는다(`docs/SUBMISSION_EXPORT.md`의 제외 목록).
숫자는 2026-10-02 17:45 UTC 운영 값이다. 발표 전날 "당일 점검" 절의 명령으로 다시 읽어 바꾼다.

## 1. 4분 발표 대본 (영어)

화면 순서: Markets → USTX 주문 → Transparency → Pools → Ask USTX → (MCP) → 마무리.
괄호 안은 화면 동작이다. 한 문단이 30–40초다.

**Opening (0:00–0:30)**
> Tokenized stocks are live on X Layer: Apple, Microsoft, NVIDIA, Amazon, Meta and Tesla as xStocks.
> But a basket of them has the same problem every fund has: you have to trust the publisher's number.
> Ganymede is USTX, one share of six xStocks, where every price can be checked by anyone, from the chain, in the browser.

**How the NAV works (0:30–1:10)** *(Markets, then Transparency)*
> Every five minutes we price the six xStocks through OKX OnchainOS on X Layer mainnet,
> and record the NAV, the shares outstanding and a SHA-256 fingerprint of the full price document in a registry on X Layer.
> This page doesn't ask you to trust our server. Your browser reads the registry itself, re-hashes the document and recomputes the NAV row by row.
> It also reads six X Layer Uniswap pools as a second price source. *(point to "NAV verified" and "Prices agree")*

**Investing (1:10–1:50)** *(USTX page, order panel with a wallet connected)*
> With OKX Wallet you invest demo dollars on X Layer Testnet. The panel quotes three places at once:
> the fund at the NAV, a constant-product pool, and a Uniswap v4 pool, and routes to whichever gives the most.
> The fund contract only issues shares at the recorded NAV, and refuses a NAV more than an hour old. *(confirm a $60 order; show "Added to your basket")*
> USTX is also collateral: you can borrow demo dollars against it, valued at the same recorded NAV. Other contracts can read that NAV through a Chainlink-compatible feed.

**The market and the v4 hook (1:50–2:40)** *(Pools)*
> A pool of a NAV-tracked asset leaks value: when the NAV moves, arbitrageurs trade the stale price against the providers.
> Our keeper closes those gaps through the fund in one transaction. Today, under a burst of buying, the pool went 4% above the NAV, and the keeper closed it at its next check, with nobody involved.
> So we built a Uniswap v4 hook that moves its pool to every NAV record before anyone can trade the old price.
> Measured on chain over 308 records, our test trading included: arbitrage took $33.86 from the constant-product pool's providers, and nothing from the v4 pool's. *(point to "Liquidity providers against arbitrage")*

**AI (2:40–3:20)** *(Ask USTX, then the developer page's MCP section)*
> Ask USTX answers questions from live chain data. It doesn't guess: it calls our tools and says which ones it read. *(ask: "Where would $500 buy the most USTX?")*
> The same tools are an MCP server, so any AI agent can read the verified NAV, check it and quote an order. We registered it on OKX.AI as an A2MCP service.

**Proof and close (3:20–4:00)**
> Ganymede is tested like a product: 227 app tests, 99 contract tests with invariant fuzzing of the hook, a Slither pass with every finding triaged,
> and a load test with 30 team wallets: 618 transactions, none failed, while every NAV record landed on time.
> Everything runs on X Layer Testnet with demo dollars that have no value; real money is out of scope until it is regulated and audited.
> Ganymede: a fund NAV anyone can verify, a market that protects its providers, and an API for agents. Thank you.

말하지 않을 것: 외부 사용자 수(테스트 지갑은 팀 지갑이다), 수익률 약속, 실제 발행 계획의 가격.

## 2. 라이브 데모 순서와 대비책

1. 발표 30분 전: 데모 지갑(OKX Wallet)에 테스트 OKB와 dUSD가 있는지, NAV가 5분 안에 기록됐는지 확인한다(아래 점검 명령).
2. 탭을 미리 연다: Markets, USTX(지갑 연결), Transparency, Pools, 개발자 페이지 `#mcp`.
3. 주문은 $60, 펀드로. 확인까지 2–3초다. 체결 화면에서 "Added to your basket"와 탐색기 링크를 보여 준다.
4. Ask USTX 질문은 미리 정한 두 개만: "What is USTX's NAV right now, and is it verified?", "Where would $500 buy the most USTX?" (각 6–10초).
5. 네트워크가 끊기면: 녹화 영상(3절)으로 넘어가고, 같은 대본을 말한다.
6. NAV가 1시간 넘게 멈춰 주문이 막히면: 주문 대신 Transparency와 Pools만 보여 주고, "the fund refuses a stale NAV, by design"이라고 말한다.

## 3. 데모 영상 촬영 목록 (2분 30초)

| 장면 | 화면 | 길이 |
| --- | --- | --- |
| 1 | Markets: NAV, 카운트다운, 구성 종목 | 15초 |
| 2 | Transparency: "NAV verified", 두 번째 가격원 일치 | 20초 |
| 3 | USTX: 지갑 연결 → 세 곳 견적 → $60 주문 → 체결 | 35초 |
| 4 | Borrow: 담보 예치 → $12 대출 → 상환 | 25초 |
| 5 | Pools: 두 풀, "Liquidity providers against arbitrage" | 25초 |
| 6 | Ask USTX: $500 견적 질문과 "Read from" 표시 | 20초 |
| 7 | 개발자 페이지 MCP 절, 터미널에서 `tools/call` 한 번 | 10초 |

자막에 "X Layer Testnet · demo dollars, no value"를 계속 띄운다.

## 4. 예상 질문과 답 (영어)

**Is this real money? Who holds the stocks?**
No. It runs on X Layer Testnet with demo dollars that have no value, and the testnet fund holds no xStocks. The in-kind vault that creates and redeems shares against the real xStocks ran only on a fork of X Layer mainnet. Real money needs a regulated issuer, custody and an audit.

**Why should I trust your prices?**
You don't have to. Every record's document is public, its SHA-256 is on X Layer, and the browser recomputes the NAV and compares it with six X Layer pools. If we recorded a wrong price consistently, the checks would still pass, and we say so on the Limitations page; the pools comparison is the guard against that.

**What if the price feed or your cron stops?**
The fund and the lending market refuse a NAV older than one hour, so orders and new loans stop instead of trading a stale price. The v4 hook's fee rises from 0.30% to 1.00% as the record ages.

**How is the v4 hook different from a normal pool?**
Before any trade after a new NAV record, it moves the pool's price to that NAV, so nobody can trade the old price against providers. Deposits are priced at the next record. Measured on chain over 308 records, arbitrage took $33.86 from the constant-product pool's providers and nothing from the v4 pool's. That includes our own test trading.

**Is it audited?**
No third-party audit. Slither found 135 items, all High and Medium triaged in docs/STATIC_ANALYSIS.md, none needing a change; the hook passed 1,000 random steps of invariant fuzzing against Uniswap's compiled PoolManager.

**Why X Layer?**
The xStocks we price live on X Layer mainnet, OKX OnchainOS prices them, fees are fractions of a cent so a five-minute record is cheap, and OKX Wallet users can act on it directly.

**Who are your users?**
No real users are claimed. 30 wallets in our load test were the team's own, listed in docs/LOAD_TEST.md. The product is for issuers who need to publish a value others can check, and for X Layer apps that want a verified NAV.

**How do you make money?**
For issuers: running and verifying a basket's NAV as a service (the issuer page shows the measured running cost). For apps: the API and badge. No prices are claimed yet.

**What does the AI actually do?**
It only reads, through six tools that query X Layer when called; it names the tools behind each answer, refuses investment advice, and is limited per visitor and per day. The same tools are a public MCP server that we registered on OKX.AI.

**What happens under load?**
30 wallets sent 618 transactions in 12 minutes with none failing; 1,198 page, API and MCP requests had no errors; every NAV record landed on time.

**Regulation?**
A tokenized fund is a regulated product. That's why `canSubscribe` and the custody address are closed in code for real money, and everything stays labelled demo.

## 5. 당일 점검 (명령)

```bash
B=https://ganymede-xlayer.gana003.workers.dev
curl -s $B/api/v1/ustx | grep -E '"(perShareUsd|effectiveAt|validUntil)"'     # 5분 안의 기록인지
curl -s $B/api/v1/ustx/pools | head -c 1500                                     # 두 풀과 공급자 결과
curl -s $B/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_ustx_nav","arguments":{}}}' | head -c 300
npx wrangler deployments list --name ganymede-xlayer | tail -5                  # 운영 버전
```

- 키퍼 지갑 `0xccf372068496d9bef0f7cf83d697183d358dec1b`의 테스트 OKB가 0.05 이상인지(OKX 탐색기).
- OpenAI 사용량과 결제 한도. Ask USTX는 사이트 전체 하루 400질문으로 막혀 있다.
- 되돌리기: `npx wrangler rollback <직전 버전 ID> --name ganymede-xlayer` (버전 목록은 `docs/PRODUCT_RELEASE.md`).
