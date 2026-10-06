# 결선 발표 키트 (내부용)

비공개 개발 저장소 전용 문서다. 공개 스냅샷에는 넣지 않는다(`docs/SUBMISSION_EXPORT.md`의 제외 목록).
숫자는 2026-10-06 18:00 UTC 운영 값이다. 발표 전에 5절 명령으로 다시 읽고, 바뀐 숫자만 고쳐 말한다.
행사: 10월 7일 10:30 등록, 13:00–15:00 발표. 팀당 3분 발표와 1–2분 질의응답. 심사는 VC·파트너·OKX 직원.

## 0. 기준 숫자

모든 답은 이 표의 숫자만 쓴다. 공개 문서(README, `docs/OKX_DEV_DAY.md`, `SECURITY.md`)와 사이트가 같은 숫자를 쓴다.

| 항목 | 값 | 어디서 확인 |
| --- | --- | --- |
| USTX | 미국 기술주 xStocks 9종 동일 가중: AAPLx, MSFTx, NVDAx, AMZNx, METAx, TSLAx, GOOGLx, ORCLx, PLTRx. 처음 6종으로 시작해 10월 4일 GOOGLx·ORCLx·PLTRx를 더했다. 분기마다 동일 가중으로 되돌린다 | `/methodology`, `docs/OKX_DEV_DAY.md` |
| 상품 | 9개: USTX, 바스켓 5개(M7X, AIX, CRYX, CORX, RTLX), 인컴 3개(SPYC, QQQC, ELS1). 투자는 USTX만 열려 있고 나머지 8개는 NAV 기록만 한다 | Markets |
| NAV | 5분마다 OKX OnchainOS 가격으로 계산해 NAV, 발행 주식 수, 가격 문서의 SHA-256을 X Layer Testnet 레지스트리에 기록. 방문자 브라우저가 다시 계산한다 | `/api/v1/ustx` |
| 두 번째 가격원 | X Layer 메인넷 xStocks Uniswap V3 풀 9개. 그 가격으로 계산한 NAV와 1% 넘게 다르면 기록하지 않는다. 풀을 못 읽으면 경고를 달고 기록한다 | `/api/v1/ustx`의 `pricing.crossCheck` |
| 신선도 | 펀드와 대출 시장은 1시간 넘은 NAV를 거부한다. 오래된 가격으로 체결하지 않고 멈춘다 | `SECURITY.md` |
| 컨트랙트 | X Layer Testnet에 12개. 12개 모두 Sourcify에서 생성·런타임 바이트코드가 정확히 일치하고, 처음 8개는 OKX 탐색기 검증도 마쳤다 | `onchain/README.md` |
| 시험 | 앱 284개, 릴레이어 34개, 컨트랙트 117개(10월 6일). 불변식 퍼즈: v4 훅 1,000단계, 범위 훅 1,000단계, 대출 시장 2,000단계 | `docs/STATIC_ANALYSIS.md` |
| 정적 분석 | Slither: 10월 2일 전 컨트랙트 135건, 10월 6일 범위 풀 컨트랙트 2개 31건. High·Medium은 모두 분류했고 코드 변경이 필요한 것은 없었다 | `docs/STATIC_ANALYSIS.md` |
| 부하 시험 | 10월 4일 3,000개 지갑으로 51,854건, 실패 0. 100개 지갑 전체 흐름 2,386건 중 7건은 컨트랙트가 의도대로 거절 | `docs/LOAD_TEST.md` |
| 공급자 성과 | 10월 1일 15:57 UTC 이후 NAV 기록 1,411회 동안 상수곱 풀은 차익거래 17건으로 공급자가 $153.95 손실, v4 훅 풀은 0건·$0(재조정 1,409회). 팀의 시험 거래도 들어 있다 | `/api/v1/ustx/pools`의 `lpResult` |
| 사용량 | 9월 25일 이후 팀 밖 지갑 2개(71건), 팀·시험 지갑 3,005개(33,811건, 부하 시험 포함), Ask USTX 질문 16개(10월 3일 이후) | `/api/v1/ustx/usage` |
| 직접 사기 | $1,000을 9종목에 나눠 OKX DEX 집계기로 사면 스왑 9번(처음엔 승인 1번 더), 집계기 가격 기준 비용 $0.93(0.09%), 네트워크 수수료 $0.013, 최대 가격 영향 0.21%(10월 6일 17:29 UTC 견적). USTX는 승인과 투자 2번 | `/api/v1/ustx/dex-quotes` |
| 대출 | USTX 담보(NAV 평가)의 50%까지 dUSD를 빌린다. 65%를 넘으면 누구나 절반까지 갚고 8% 더 얹은 USTX를 가져간다 | `/api/v1/ustx`의 `lending` |
| v4 훅 | NAV 기록마다 비운 풀을 NAV로 옮긴 뒤 유동성을 다시 넣는다. 수수료는 NAV 나이에 따라 0.30%→1.00%, 1시간이 넘으면 스왑 중지, NAV에서 약 5% 밖으로는 거래 불가 | 컨트랙트 |
| 범위 풀 | Meteora DLMM 방식. 공급자마다 자기 칸(한쪽 최대 20칸, 칸 폭 약 0.1–5%, 범위 최대 ±100%)을 Spot·Curve·Bid-Ask 또는 칸별로 직접 그려서 연다. NAV에서 1% 안에서만 열리고 가격 한도와 마감 시간이 있다 | 컨트랙트, Pools |
| 인컴 | SPYC·QQQC는 매달 2% 위 1개월 콜을 판다. 옵션 시장이 없어 Black–Scholes(변동성 16%·21%, 금리 4%)로 값을 매긴다. ELS1은 3년 스텝다운, 6개월마다 조기상환 장벽 90·90·85·85·80·75%, 반기 3.5%(연 7%), 낙인 50% | `lib/income/terms.ts` |
| AI | MCP 서버(`/mcp`)는 도구 9개: 읽기 전용 8개와 서명 전 거래를 만드는 `prepare_ustx_order`(서버는 서명하지 않는다). Ask USTX는 읽기 전용 8개만 쓰고, 주문 가능 여부를 먼저 확인한다. 투자 조언은 거절하고, 방문자당 하루 30개·사이트 전체 하루 400개 질문. MCP는 주소당 분당 도구 호출 30회, 일괄 4건 | `lib/assistant/ask.ts`, `lib/mcp/server.ts` |
| 원가 | NAV 기록 1회 약 68,200 gas ≈ $0.00016(9월 25일 메인넷 가스 기준). 5분마다 기록하면 월 약 $1.40 | README |
| 첫 사용 | 테스트 OKB가 거의 없는 지갑에 0.0005 OKB를 한 번 준다. dUSD는 하루 한 번 10,000. 펀드 최소 투자 $10 | Pools·USTX 화면 |

## 1. 3분 발표 대본

화면 순서: Markets → Transparency → USTX 주문 → Pools → Ask USTX → 마무리. 괄호는 화면 동작이다.
리허설에서 2분 50초 안에 끝나야 한다. 길면 Pools의 범위 풀 문장부터 줄인다.

### 한국어

**0:00 문제** *(Markets)*
> X Layer에는 애플, 엔비디아 같은 미국 주식이 xStocks 토큰으로 있습니다. 그런데 이걸 묶은 ETF는 운용사가 발표하는 기준가, NAV를 믿을 수밖에 없습니다. Ganymede의 USTX는 미국 기술주 9종을 한 토큰에 담고, 그 NAV를 누구나 직접 검증하게 합니다.

**0:25 검증** *(Transparency, "NAV verified"와 "Prices agree"를 가리킨다)*
> 5분마다 OKX OnchainOS 가격으로 NAV를 계산해 X Layer에 기록합니다. 이 화면은 저희 서버를 믿으라고 하지 않습니다. 여러분 브라우저가 체인을 직접 읽어 지문을 확인하고 NAV를 한 줄씩 다시 계산합니다. X Layer Uniswap 풀 9개 가격과 1% 넘게 다르면 기록 자체를 막습니다.

**0:55 투자** *(USTX, 지갑 연결 상태에서 견적 → 주문)*
> OKX Wallet으로 투자하면 펀드와 두 풀의 견적을 동시에 받아 가장 유리한 곳으로 보냅니다. 펀드는 기록된 NAV로만 발행하고, 1시간 지난 NAV는 거부합니다. USTX는 담보로 대출도 되고, 다른 컨트랙트는 체인링크 형식 피드로 같은 NAV를 읽습니다.

**1:30 유동성** *(Pools, "Liquidity providers against arbitrage"를 가리킨 뒤 Custom 격자에 블록 몇 개를 칠한다)*
> NAV를 따르는 자산을 일반 풀에 두면, NAV가 바뀌는 순간 차익거래자가 옛 가격으로 공급자 돈을 가져갑니다. 그래서 NAV가 기록될 때마다 풀을 먼저 NAV로 옮기는 Uniswap v4 훅을 만들었습니다. 10월 1일부터 기록 1,411번 동안 일반 풀 공급자는 차익거래로 154달러를 잃었고, 훅 풀은 0달러였습니다. Meteora DLMM처럼 가격 칸마다 블록을 쌓아 내 모양대로 공급하는 범위 풀도 있습니다.

**2:15 AI** *(Ask USTX: "What is USTX's NAV right now, and is it verified?")*
> Ask USTX는 체인을 읽는 도구 8개로만 답하고, 무엇을 읽었는지 보여 줍니다. 같은 도구가 MCP 서버로 열려 있어 어떤 AI 에이전트든 검증된 NAV를 읽고 주문 견적을 낼 수 있습니다.

**2:40 마무리**
> 지금은 X Layer 테스트넷의 가치 없는 데모 달러로만 돌아가고, 실제 돈은 감사와 인가 발행사 이후입니다. 누구나 검증하는 NAV, 공급자를 지키는 시장, 에이전트를 위한 API. Ganymede였습니다. 감사합니다.

### English (같은 순서, 약 310단어)

> Tokenized US stocks already live on X Layer as xStocks. But a basket of them has every fund's problem: you have to trust the publisher's number. Ganymede's USTX holds nine US tech xStocks in one token, and anyone can verify its NAV.
>
> Every five minutes we price the nine through OKX OnchainOS and record the NAV and a SHA-256 fingerprint of the full price document on X Layer. This page doesn't ask you to trust our server: your browser reads the chain, checks the fingerprint and recomputes the NAV line by line. If the prices differ from nine X Layer Uniswap pools by more than 1%, nothing is recorded.
>
> With OKX Wallet, an order is quoted at the fund and two pools at once and goes to the best. The fund only issues at the recorded NAV and refuses one older than an hour. USTX is collateral for loans, and other contracts read the same NAV through a Chainlink-style feed.
>
> A pool of a NAV-tracked asset leaks value: when the NAV moves, arbitrageurs trade the old price against the providers. Our Uniswap v4 hook moves its pool to every NAV record first. Over 1,411 records since October 1, arbitrage took $154 from the constant-product pool's providers, and nothing from the hook's. A second pool lets providers draw their own shape, block by block, like Meteora's DLMM.
>
> Ask USTX answers only through eight tools that read the chain, and shows which it used. The same tools are an MCP server, so any AI agent can read the verified NAV and quote an order.
>
> It all runs on X Layer Testnet with demo dollars; real money comes only after an audit and a licensed issuer. Ganymede: a NAV anyone can verify, a market that protects its providers, and an API for agents. Thank you.

## 2. 라이브 데모와 대비책

1. 12:00까지 5절 명령으로 NAV 기록 시각을 본다. 5분 안의 기록이면 A, 1시간이 넘었으면 B로 간다.
2. 탭을 미리 연다: Markets, Transparency, USTX(지갑 연결), Pools(Custom), 개발자 페이지 `#mcp`.
3. **A. 기록이 신선할 때:** 주문은 $20, 펀드로. 확인까지 몇 초 걸린다. 체결 화면의 "Added to your basket"과 탐색기 링크를 보여 준다.
4. **B. 기록이 1시간 넘었을 때:** 주문하지 않는다. 검증(Transparency)은 마지막 기록으로 그대로 되고, Pools의 블록 격자도 보내지 않고 그려 보일 수 있다. 이렇게 말한다: "The fund refuses a NAV older than an hour, by design: it stops instead of trading an old price."
5. Ask USTX 질문은 미리 정한 두 개만: "What is USTX's NAV right now, and is it verified?", "Where would $500 buy the most USTX?"
6. 네트워크가 끊기면 녹화 영상으로 넘어가 같은 대본을 말한다.

## 3. 킬링 질문 30개와 답 (심사위원 5인 × 6)

답은 짧게 하고, 숫자는 0절 표에서만 쓴다. "EN"은 영어로 물을 때의 첫 문장이다. 각 질문의 근거와 10월 7일 새벽에 고친 빈틈은 `docs/JUDGE_REVIEW_KO.md`의 "킬링 질문 30개" 절에 있다.

### A. X Layer 생태계 리드 (OKX)

**A1. OnchainOS를 가격 하나에만 쓰는 것 아닌가?**
두 API를 씁니다. Market API가 5분마다 9종목 가격을 주고(NAV의 입력), DEX 집계기 견적 API가 한 시간마다 같은 9종목을 직접 살 때의 비용을 X Layer 메인넷에서 견적합니다(`/api/v1/ustx/dex-quotes`). 지갑은 OKX Wallet을 먼저 연결하고, 모든 기록은 OKX 탐색기로 연결됩니다.
EN: Two OnchainOS APIs: market prices every five minutes for the NAV, and the DEX aggregator's hourly quotes for buying the nine by hand.

**A2. 메인넷에는 아무것도 없는데 X Layer에 무엇을 더하나?**
메인넷의 xStocks 9종 가격과 풀을 직접 읽어 NAV를 만들고, 그 NAV를 테스트넷 레지스트리·펀드·대출·풀 3개가 씁니다. 실제 돈이 없는 단계라 메인넷 배포는 의도적으로 하지 않았고, 다음 단계가 메인넷에 NAV를 가격 피드로만 기록하는 것입니다. X Layer의 xStocks는 9월 12일 기준 시가총액 약 9,150만 달러, 토큰화 주식 시장의 약 3.1%입니다(Crypto Briefing).
EN: It prices the nine xStocks from X Layer mainnet and records a NAV others can verify; mainnet comes as a price feed only, before any money.

**A3. 오늘 테스트넷이 멈췄을 때 서비스가 몇 시간 멈췄다. 메인넷이면?**
10월 6일 14:23 UTC에 X Layer Testnet이 블록 생성을 멈췄고, 재개 뒤에도 정지 중 보낸 릴레이어·키퍼 거래가 처리되지 않아 기록이 14:20에서 멈췄습니다. 설계대로 펀드·대출·두 NAV 풀이 멈췄고 손실은 없습니다. 고칠 점은 막힌 논스를 자동으로 다시 보내는 복구이고, 지금은 사람이 판단해 처리합니다. 메인넷에서는 발행 키를 여러 개 두고 상태를 공개 경보로 냅니다.
EN: The testnet stalled; our contracts stopped trading on the old NAV as designed, and automatic nonce recovery is the fix we are adding.
※ 그 전에 릴레이어가 풀려 재개됐으면 "멈췄다가 다시 이어졌다"로 말한다.

**A4. OKX Wallet 앱(모바일)에서 실제로 써 봤나?**
휴대폰에서 지갑이 없으면 OKX 앱으로 여는 링크가 뜨고, 주입형 지갑으로 청구·승인·투자·환매 전체 흐름을 브라우저에서 돌렸습니다. 실제 OKX Wallet 확장 프로그램을 자동 시험으로 몰지는 못했고, 공개 한계에 그렇게 적었습니다.
EN: The whole flow ran with an injected test wallet in a browser; driving the real OKX Wallet extension in tests is a stated limit.

**A5. 메인넷 xStocks 유동성이 얕은데, 그 가격을 NAV에 쓰면 조작되지 않나?**
OnchainOS 가격을 X Layer 메인넷 Uniswap V3 풀 9개와 비교해 1% 넘게 다르면 기록하지 않고, 브라우저도 같은 비교를 보여 줍니다. 둘 다 X Layer 시장이라 함께 틀리면 못 잡는 것은 한계로 공개했고, 거래소 원주 가격을 세 번째 기준으로 더하는 것이 다음 단계입니다. DEX 견적으로 9종목에 $111씩 사면 가격 영향은 최대 0.21%입니다.
EN: Prices are checked against nine X Layer pools and refused beyond 1%; an exchange reference is next, since both are X Layer markets.

**A6. 다른 X Layer 앱이 오늘 이걸 가져다 쓰려면?**
CORS가 열린 공개 API와 OpenAPI 명세, 브라우저에서 스스로 검증하는 배지(`/embed/ustx`), Chainlink `AggregatorV3Interface` 형식의 NAV 피드 컨트랙트, 그리고 MCP 서버가 있습니다. MAG3 바스켓은 설정 파일 하나로 다른 발행자 지갑이 자기 레지스트리에 기록합니다.
EN: An open API with OpenAPI, a self-verifying badge, a Chainlink-style feed contract and an MCP server; MAG3 shows another issuer on the same rails.

### B. DeFi 보안 엔지니어

**B1. 릴레이어 키가 털리면 NAV를 10배로 기록해 대출 시장을 털 수 있나?**
기록 한 번에 NAV가 움직일 수 있는 폭을 체인이 막지는 않습니다. 대신 브라우저의 풀 가격 비교가 그 기록을 "불일치"로 보여 주고, 기록은 지울 수 없어 남으며, 관리자가 레지스트리를 멈출 수 있습니다. 실제 돈 전에는 레지스트리에 기록당 변동 상한, 발행자 여러 명, 멀티시그와 타임락을 둡니다. SECURITY.md에 그대로 적었습니다.
EN: Nothing on chain caps one record's move; the browser flags it, records stay visible, and a cap, several publishers and a timelocked multisig come before real money.

**B2. 프런트엔드가 털리면(클릭재킹, 주입) 사용자가 악성 거래에 서명하지 않나?**
모든 응답에 보안 헤더가 있습니다. 페이지는 다른 사이트의 프레임에 들어갈 수 없고(배지만 예외), MIME 추측·외부 base·플러그인을 막습니다. 페이지가 쓰는 스크립트마다 응답별 nonce가 붙고, 그 위의 스크립트 정책(`script-src 'self' 'nonce-…'`)은 보고 전용입니다. 시험용 확장으로 재 보니 강제하면 지갑이 주입한 코드의 eval까지 막혀서, OKX Wallet 확장·앱으로 시험한 뒤 강제합니다. 앱은 모든 거래를 브라우저에서 만들고 먼저 모의 실행한 뒤 사용자 지갑이 서명하며, 키를 갖지 않습니다.
EN: Pages refuse framing and sniffing, and every script carries a per-response nonce; the script policy is report-only until tested with OKX Wallet, since enforced it also blocked eval in an injected provider.

**B3. 범위 풀 훅은 감사·퍼즈를 했나?**
외부 감사는 없습니다. 범위 훅에 1,000단계 불변식 퍼즈를 돌렸습니다: 포지션 206개를 열고 닫고, 스왑 138건, 차익거래 47건, NAV 기록 93번, 기록이 오래된 구간 19번 동안 훅과 차익거래는 토큰을 보유하지 않고, 풀 매니저는 항상 포지션에 줄 것 이상을 가지며, 스왑은 NAV 대역을 못 벗어나고, 닫으면 받을 몫을 받고, 모두 나갈 수 있었습니다. Slither도 31건을 분류했고 코드 변경이 필요한 것은 없었습니다.
EN: No audit; 1,000 random steps of invariant fuzzing and a triaged Slither pass, with no change needed.

**B4. 펀드를 일시정지하면 사용자가 USTX를 환매할 수 없지 않나?**
맞습니다. 펀드의 일시정지는 투자와 환매를 함께 멈추고, 그동안은 풀에서만 팔 수 있습니다. 대출 시장의 일시정지는 상환·인출·청산을 막지 않습니다. 메인넷 설계에서는 환매를 일시정지에서 빼거나 타임락 뒤에 둡니다.
EN: Yes, a fund pause stops redemptions too; the lending market's never blocks exits, and a mainnet fund would keep redemptions open.

**B5. NAV가 멈추면 청산도 멈춘다. 부실채권 위험은?**
청산도 신선한 NAV가 필요해 멈춥니다. 50% 한도로 빌린 대출은 65%에서 청산 가능해지므로, 정지 중 NAV가 약 23% 떨어져야 청산 대상이 되고 50% 떨어져야 담보가 부족해집니다. 오래된 가격으로 청산하는 것보다 이쪽이 안전하다고 봤습니다.
EN: Liquidations wait for a fresh NAV too; the NAV would have to fall about 23% during a stall to make a loan liquidatable and 50% to leave it short.

**B6. 컨트랙트가 배포된 코드와 같다는 걸 어떻게 아나?**
X Layer Testnet의 12개 컨트랙트 모두 Sourcify에서 생성·런타임 바이트코드가 정확히 일치하고, 처음 8개는 OKX 탐색기 검증도 마쳤습니다. 개발자 페이지의 "Who controls the contracts"가 12개의 관리자·발행자·소유자·일시정지를 방문자 브라우저에서 직접 읽습니다.
EN: All twelve contracts match exactly on Sourcify, and the developer page reads every role and pause from the chain in your browser.

### C. 프로덕트·UX 리드

**C1. 처음 온 사람이 1분 안에 무엇을 하나?**
Markets에서 USTX를 누르면 NAV·구성·검증 결과가 보이고, OKX Wallet을 연결하면 테스트 OKB가 없는 지갑에 0.0005를 한 번 주고, dUSD를 받아 $10부터 투자합니다. 처음에는 서명이 3번(dUSD 받기, 승인, 투자)입니다.
EN: Open USTX, connect OKX Wallet, take free test gas and demo dollars, and invest from $10: three signatures the first time.

**C2. NAV가 멈춘 지금 화면은 사용자에게 뭐라고 하나?**
모든 화면 맨 위에 "NAV record delayed"와 마지막 기록 시각·경과 시간이 글자로 뜹니다(색만이 아니라). 주문 패널은 지갑을 연결하기 전부터 펀드 주문이 다음 기록을 기다린다고 말하고, 대출은 "새 대출은 다음 NAV 기록을 기다린다", Transparency는 "주문·대출 유효 시간이 N시간 전에 지났다", 배지는 "delayed"와 함께 Invest 대신 Details를 보여 줍니다. Pools는 풀 자체 가격으로 가치를 보여 주며 이유를 적고, Ask USTX는 주문 가능 여부를 먼저 확인해 답합니다(10월 7일 새벽 수정 전에는 한국어 질문에 "지금 살 수 있다"고 답했고, 화면 여럿이 "Live", "open now"라고 했다).
EN: Every screen says the NAV record is delayed and since when, in words; the order panel, borrowing, the badge and Ask USTX all say orders wait for the next record.

**C3. 블록 격자(DLMM) 편집기는 처음 보는 사람이 이해하나? 휴대폰은?**
Meteora DLMM Pro처럼 가격 아래 dUSD, 위 USTX 칸을 블록으로 쌓습니다. 누르면 그 높이까지 차고, 끌면 칠해지고, 화살표 키로도 조절하며, 되돌리기와 이름 붙여 저장이 있습니다. 1440·390px에서 확인했고, 처음 열면 Custom이 선택돼 있습니다.
EN: Blocks below the price hold demo dollars and above it USTX, as on DLMM Pro: press, drag or use the arrow keys, with undo and saved setups.

**C4. 한국어 사용자는?**
화면은 영어지만 Ask USTX는 방문자의 언어로 답합니다. 한국어 질문에 한국어로 답하는 것을 운영에서 확인했습니다.
EN: The screens are in English; Ask USTX answers in the visitor's language, Korean included.

**C5. 접근성은?**
블록 격자는 키보드로 조작되고, 칸마다 가격 구간·토큰(달러 또는 USTX)·예치금 중 몫을 읽어 줍니다. 전략 선택은 화살표 키로 움직이는 라디오 그룹입니다. 운영 사이트 7개 화면을 1440·390px에서 axe로 점검해, /pools의 심각 2건(역할 없는 차트 칸 20개, 대비 3.74:1)을 고쳤습니다. 남은 한계: 휴대폰에서 칸이 많으면 칸 폭이 24px보다 좁습니다(칸 수를 줄이거나 키보드로 조작).
EN: The editor is keyboard-operable and each column reads its price range, token and share; axe on seven live screens, with the two serious issues on Pools fixed.

**C6. 오류는 어떻게 보이나? (지갑 거부, 잔액 부족, 체인 다름)**
주문은 서명 전에 모의 실행해 컨트랙트의 거절 이유를 사람이 읽는 문장으로 보여 주고, 지갑이 다른 체인이면 X Layer Testnet으로 바꾸라고 요청합니다. 거부한 요청도 시험했습니다.
EN: Every order is dry-run first and its revert shown in plain words; a wrong chain gets a switch request.

### D. VC·사업 파트너 (OKX Ventures)

**D1. 시장은 얼마나 크고 왜 지금인가?**
토큰화 주식은 2026년 8월 25~30억 달러 규모로 1년 사이 크게 늘었고, xStocks는 2025년 6월 출시 뒤 누적 거래액 350억 달러를 넘었으며(9월 기준 보도), X Layer의 xStocks는 9월 12일 약 9,150만 달러입니다. 바스켓은 개별 종목 다음에 오는 상품이고, 그때 필요한 것이 누구나 검증하는 NAV입니다.
EN: Tokenized equities reached about $2.5–3B by August 2026 and xStocks passed $35B traded; baskets come next, and they need a NAV anyone can check.

**D2. 고객은 누구고 왜 돈을 내나? 실사용은?**
첫 고객은 개인이 아니라 바스켓 발행사와 그 NAV를 쓰는 X Layer 앱입니다. 실사용자는 주장하지 않습니다: 팀 지갑을 뺀 사용량을 공개하고 있고(`/api/v1/ustx/usage`), 9월 25일 이후 팀 밖 지갑은 2개입니다. 다음 달 목표는 파일럿 발행사 1곳과 커뮤니티 시험입니다.
EN: Issuers and X Layer apps first; we claim no users and publish usage without our wallets: two outside wallets since September 25.

**D3. Backed(xStocks)나 OKX가 직접 바스켓을 내면 끝 아닌가?**
그러면 그들이 저희 고객입니다. 저희가 파는 것은 바스켓이 아니라 검증 가능한 NAV 기록·검증·배지·API와 NAV 자산 유동성 공급자를 지키는 훅입니다. 설정 파일 하나로 다른 발행자가 자기 지갑과 레지스트리로 쓸 수 있게 만들었습니다(MAG3).
EN: Then they are our customers: we sell the verifiable NAV, its checks and the hooked liquidity, not the basket.

**D4. 수익 모델과 단위 경제는?**
테스트넷은 무료입니다. 메인넷에서 바스켓당 구독, 인가 파트너를 통한 판매 수수료, 바스켓을 담보로 받는 프로토콜의 NAV 피드 구독입니다. 원가는 바스켓당 가스 월 약 $1.40입니다. 예를 들어 연 0.15%를 받는 $10M 바스켓이면 연 $15,000 대 가스 약 $17이고, 이것은 예시이지 가격 제시가 아닙니다. 참고로 Invesco QQQ의 보수는 연 0.20%입니다.
EN: Free on testnet; per-basket subscriptions, a distribution fee and NAV-feed subscriptions on mainnet, against about $1.40 of gas a month per basket.

**D5. 규제는? 한국에서 할 수 있나?**
토큰화 펀드는 증권이라 인가 발행사·수탁·감사 없이는 실제 돈을 받지 않습니다. 저희는 발행사가 아니라 그 발행사가 쓰는 NAV·검증 인프라를 목표로 합니다. 순서는 감사 → 메인넷 NAV를 가격 피드로만 → 인가 발행사가 현물 볼트로 수탁 → 유통입니다. 국가별 판단은 파트너 발행사의 인가 범위를 따릅니다.
EN: A tokenized fund is a security; we stay infrastructure for a licensed issuer, in the order audit, mainnet feed, licensed issuer with custody, then distribution.

**D6. 다음 6개월 마일스톤과 OKX에 원하는 것은?**
감사, 관리자 멀티시그·타임락, 메인넷 NAV 피드, 발행사 콘솔, 거래소 가격 기준과 배당 정책입니다. OKX에 원하는 것은 세 가지입니다: xStocks 발행사(Backed)와의 파일럿 연결, OKX Wallet·X Layer 생태계에 검증 배지와 NAV 피드 노출, 감사 비용을 위한 X Layer 생태계 지원.
EN: An audit, a multisig, a mainnet feed and an issuer console; from OKX, an intro to Backed for a pilot, distribution in OKX Wallet and X Layer, and ecosystem support for the audit.

### E. AI·개발자 경험 심사위원 (OKX.AI·OnchainOS)

**E1. 에이전트가 "USTX에 500달러"를 받으면 실제로 무엇을 할 수 있나?**
`quote_ustx_order`로 펀드와 풀 3개를 견적하고, `prepare_ustx_order`로 그 지갑이 서명할 거래를 받습니다: 부족하면 dUSD 받기, 승인, 그리고 견적의 1%를 뺀 최소 수령량과(풀이면) 10분 마감이 든 주문입니다. 서버는 서명하지 않습니다. 사용자의 지갑이 서명합니다.
EN: It quotes the four venues and gets the unsigned claim, approval and order that the user's wallet signs; the server never signs.

**E2. NAV가 멈췄을 때 에이전트가 잘못된 주문을 내지 않나?**
오늘 새벽까지는 견적 도구가 NAV보다 약 10% 비싼 상수곱 풀을 "가장 많이 준다"고 추천했습니다. 이제 견적마다 마지막 NAV와의 차이를 붙이고 2%를 넘으면 경고하며, NAV가 한 시간 넘으면 `prepare_ustx_order`가 자동 선택을 거부하고 풀을 이름으로 지정할 때만 경고와 함께 준비합니다. Ask USTX도 주문 가능 여부를 먼저 확인합니다.
EN: Each quote carries its gap to the last NAV with a warning past 2%, and a stale NAV stops automatic order preparation.

**E3. MCP를 남용하면(무한 호출)?**
주소마다 분당 약 30번의 도구 호출로 제한하고, 일괄 요청은 4건까지 차례대로 처리합니다. 공개 API는 1분마다 저장한 스냅샷을 내보내고 공개 GET은 데이터베이스에 쓰지 않습니다.
EN: About 30 tool calls a minute per address and batches of at most four; the public API serves snapshots and never writes.

**E4. OpenAPI가 실제 응답과 맞나?**
NAV와 풀 API의 실제 응답을 OpenAPI 스키마로 검사하는 시험이 있고, 값이 없을 때의 null까지 명세에 적었습니다. 범위 풀도 풀 API와 명세에 있습니다.
EN: The tests check the NAV and pools responses against the OpenAPI schema, nulls included.

**E5. 5분 안에 붙일 수 있나?**
`claude mcp add --transport http ganymede-ustx https://ganymede-xlayer.gana003.workers.dev/mcp` 한 줄, 또는 의존성 없는 예제 `node examples/agent-quote.mjs buy 500 0x지갑`이 주문 가능 여부·견적·서명 전 거래까지 보여 줍니다. `/llms.txt`가 에이전트용 안내입니다.
EN: One `claude mcp add` line, or a dependency-free example that checks orders, quotes and prepares the unsigned transactions.

**E6. OKX.AI에 등록했나?**
MCP 서버는 OKX.AI A2MCP 클라이언트가 바로 붙을 수 있게 열려 있고, 등록은 신청 후 승인 전입니다(10월 3일 기준).
EN: The MCP server is open to OKX.AI's A2MCP clients; the listing is awaiting approval.
※ 발표 전에 OKX.AI에서 승인 여부를 확인하고, 승인됐으면 "registered on OKX.AI"로 바꿔 말한다.

## 4. 이렇게 말하면 모순이다

| 말하지 말 것 | 대신 |
| --- | --- |
| 6종목 | 9종목(10월 4일에 3종 추가) |
| "5분마다 기록되고 있다"(멈춰 있을 때) | "평소 5분마다, 지금은 테스트넷 정지 뒤 HH:MM 기록이 마지막" |
| OKX.AI에 등록했다 | 등록 신청, 승인 전 |
| 사용자가 있다, 견인력 | 팀 밖 지갑 2개, 공개 집계 |
| 직접 사는 것보다 훨씬 싸다 | 비용 차이는 0.09%로 작고, 가치는 한 번의 주문·검증·리밸런싱·조합성 |
| 감사를 받았다 | 외부 감사 없음, 메인넷 첫 단계 |
| 배당이 반영된다 | 테스트넷 NAV는 아직 반영하지 않음(공개 한계), 현물 볼트는 반영 |
| 가격 얼마에 판다 | 테스트넷 무료, 가격은 개별 협의 |
| 모든 컨트랙트가 OKX 탐색기에 검증됐다 | 12개 모두 Sourcify 정확 일치, 처음 8개는 OKX 탐색기도 |
| 발행사 페이지에 요금제가 있다 | 발행사 페이지는 테스트넷 평가 안내와 개별 협의(요금표 없음) |
| 테스트넷 펀드가 xStocks를 보유한다 | 보유하지 않음, 현물 볼트는 포크에서만 |
| 펀드 페이지가 "검증됨"이다(기록이 멈춘 동안) | "Last NAV verified … delayed": 기록된 값이 맞다는 증명이지 최신이라는 뜻은 아니다 |
| AI가 지금 사라고 했다 / 견적이 가장 싸다 | 정지 중에는 펀드 주문이 멈추고, 견적은 마지막 NAV와의 차이(예: +9.81%)와 경고를 준다 |
| 에이전트가 주문을 실행한다 | 에이전트는 서명 전 거래를 준비할 뿐, 서명은 사용자 지갑 |
| 레지스트리가 NAV 급변을 막는다 | 체인 상한은 없음, 브라우저가 불일치로 표시, 상한은 메인넷 전 |
| 컨트랙트 통제 표가 Transparency에 있다 | 개발자 페이지(`/developers#proof-controls`) |
| 외부 지갑 30개로 부하 시험 | 팀이 만든 시험 지갑(3,000개)이다 |

## 5. 당일 점검 (명령)

```bash
B=https://ganymede-xlayer.gana003.workers.dev
curl -s $B/api/v1/ustx | grep -o '"effectiveAt":"[^"]*"'            # 마지막 NAV 기록 시각(5분 안이면 데모 A)
curl -s $B/api/v1/ustx/pools | grep -o '"lpResult":{[^}]*}'          # 두 풀의 공급자 성과(대본의 154달러·0달러)
curl -s $B/api/v1/ustx/usage | head -c 400                           # 팀 밖 지갑 수
curl -s $B/api/v1/ustx/dex-quotes | grep -o '"total":{[^}]*}'        # 직접 사기 비용
curl -s $B/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_ustx_nav","arguments":{}}}' | head -c 300
npx wrangler deployments list --name ganymede-xlayer | tail -5         # 운영 버전
```

- 키퍼 지갑 `0xccf372068496d9bef0f7cf83d697183d358dec1b`의 테스트 OKB가 0.05 이상인지(OKX 탐색기).
- 데모 지갑에 테스트 OKB와 dUSD가 있는지.
- OpenAI 사용량과 결제 한도. Ask USTX는 사이트 전체 하루 400질문이다.
- 되돌리기: `npx wrangler rollback <직전 버전 ID> --name ganymede-xlayer` (버전 목록은 `docs/PRODUCT_RELEASE.md`).
