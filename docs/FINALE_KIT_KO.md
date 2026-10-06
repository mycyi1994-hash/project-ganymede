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
| 시험 | 앱 279개, 릴레이어 34개, 컨트랙트 116개(10월 6일). v4 훅 불변식 퍼즈 1,000단계, 대출 시장 퍼즈 2,000단계 | `docs/STATIC_ANALYSIS.md` |
| 정적 분석 | Slither: 10월 2일 전 컨트랙트 135건, 10월 6일 범위 풀 컨트랙트 2개 31건. High·Medium은 모두 분류했고 코드 변경이 필요한 것은 없었다 | `docs/STATIC_ANALYSIS.md` |
| 부하 시험 | 10월 4일 3,000개 지갑으로 51,854건, 실패 0. 100개 지갑 전체 흐름 2,386건 중 7건은 컨트랙트가 의도대로 거절 | `docs/LOAD_TEST.md` |
| 공급자 성과 | 10월 1일 15:57 UTC 이후 NAV 기록 1,411회 동안 상수곱 풀은 차익거래 17건으로 공급자가 $153.95 손실, v4 훅 풀은 0건·$0(재조정 1,409회). 팀의 시험 거래도 들어 있다 | `/api/v1/ustx/pools`의 `lpResult` |
| 사용량 | 9월 25일 이후 팀 밖 지갑 2개(71건), 팀·시험 지갑 3,005개(33,811건, 부하 시험 포함), Ask USTX 질문 16개(10월 3일 이후) | `/api/v1/ustx/usage` |
| 직접 사기 | $1,000을 9종목에 나눠 OKX DEX 집계기로 사면 스왑 9번(처음엔 승인 1번 더), 집계기 가격 기준 비용 $0.93(0.09%), 네트워크 수수료 $0.013, 최대 가격 영향 0.21%(10월 6일 17:29 UTC 견적). USTX는 승인과 투자 2번 | `/api/v1/ustx/dex-quotes` |
| 대출 | USTX 담보(NAV 평가)의 50%까지 dUSD를 빌린다. 65%를 넘으면 누구나 절반까지 갚고 8% 더 얹은 USTX를 가져간다 | `/api/v1/ustx`의 `lending` |
| v4 훅 | NAV 기록마다 비운 풀을 NAV로 옮긴 뒤 유동성을 다시 넣는다. 수수료는 NAV 나이에 따라 0.30%→1.00%, 1시간이 넘으면 스왑 중지, NAV에서 약 5% 밖으로는 거래 불가 | 컨트랙트 |
| 범위 풀 | Meteora DLMM 방식. 공급자마다 자기 칸(한쪽 최대 20칸, 칸 폭 약 0.1–5%, 범위 최대 ±100%)을 Spot·Curve·Bid-Ask 또는 칸별로 직접 그려서 연다. NAV에서 1% 안에서만 열리고 가격 한도와 마감 시간이 있다 | 컨트랙트, Pools |
| 인컴 | SPYC·QQQC는 매달 2% 위 1개월 콜을 판다. 옵션 시장이 없어 Black–Scholes(변동성 16%·21%, 금리 4%)로 값을 매긴다. ELS1은 3년 스텝다운, 6개월마다 조기상환 장벽 90·90·85·85·80·75%, 반기 3.5%(연 7%), 낙인 50% | `lib/income/terms.ts` |
| AI | Ask USTX와 MCP 서버(`/mcp`)가 같은 읽기 전용 도구 8개를 쓴다. 투자 조언은 거절하고, 방문자당 하루 30개·사이트 전체 하루 400개 질문 | `lib/assistant/ask.ts` |
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

## 3. 예상 질문과 답

답은 짧게 하고, 숫자는 0절 표에서만 쓴다. "EN"은 영어로 물을 때의 첫 문장이다.

### 신뢰와 검증

**Q1. 왜 당신들 가격을 믿어야 하나?**
믿지 않아도 됩니다. 기록마다 가격 문서가 공개돼 있고 그 SHA-256이 X Layer에 있어서, 브라우저가 지문과 NAV를 직접 다시 계산합니다. 입력 가격은 X Layer 풀 9개와 비교해 1% 넘게 다르면 기록하지 않습니다.
EN: You don't have to: your browser recomputes every record from its public document and the fingerprint on X Layer.

**Q2. OnchainOS 가격과 풀 가격이 같이 틀리면?**
그러면 통과합니다. 둘 다 X Layer 시장이라 함께 틀린 가격은 못 잡고, Limitations 페이지에 그렇게 적었습니다. 메인넷 전에 거래소의 원주 가격을 세 번째 기준으로 더합니다.
EN: Then it passes; both are X Layer markets, which our limitations page states, and an exchange reference is the next step.

**Q3. NAV 기록이 멈추면? (지금 멈춰 있는 이유)**
펀드와 대출은 1시간 넘은 NAV를 거부해서 오래된 가격으로 체결하지 않고 멈춥니다. 10월 6일 14:23 UTC에 X Layer Testnet이 블록 42,837,767에서 멈췄고, 15:50에 다시 블록을 만들었지만 정지 중에 보낸 저희 거래가 처리되지 않아 기록이 14:20에서 멈췄습니다. 설계대로 주문은 막혔고 손실은 없습니다.
EN: The fund and the lending market refuse a NAV older than an hour, so a stall stops orders instead of filling them at an old price.
※ 그 전에 릴레이어가 풀리면 "테스트넷이 멈췄을 때 설계대로 멈췄다가 다시 이어졌다"로 바꿔 말한다.

**Q4. 기록하는 키(릴레이어)가 털리면?**
털린 키는 잘못된 NAV를 기록할 수 있고, 관리자가 레지스트리를 멈추고 새 기록자를 지정할 때까지 펀드와 대출이 그 값을 씁니다. 기록은 지울 수 없어 잘못된 값은 계속 보이고, 브라우저 검증과 풀 비교가 경보 역할을 합니다. 관리자는 지금 단일 EOA라서 메인넷 전에 멀티시그와 타임락으로 옮깁니다.
EN: A stolen publisher key could record a wrong NAV until the administrator pauses the registry; records can't be rewritten, and multisig and a timelock come before mainnet.

**Q5. 감사(audit) 받았나?**
아니요, 외부 감사는 없습니다. Slither를 전 컨트랙트에 돌려 High·Medium을 모두 분류했고(코드 변경이 필요한 것 0), v4 훅 1,000단계·대출 2,000단계 불변식 퍼즈, 컨트랙트 시험 116개, 3,000개 지갑 부하 시험을 했습니다. 12개 컨트랙트 모두 Sourcify에서 바이트코드가 정확히 일치합니다. 메인넷 로드맵의 첫 단계가 외부 감사입니다.
EN: No external audit yet; Slither with every High and Medium finding triaged, invariant fuzzing, 116 contract tests and a 3,000-wallet load test, and an audit is the first step to mainnet.

**Q6. 관리자가 할 수 있는 것과 없는 것은?**
Transparency의 "Who controls the contracts"가 컨트랙트에서 직접 읽어 보여 줍니다. 관리자는 일시정지, 기록자·민터 지정, 관리자 이전만 할 수 있고, USTX를 기록된 NAV 밖에서 발행하거나 기록을 고치거나 남의 USTX·dUSD를 옮길 수 없습니다. 풀, 차익거래, 피드, 두 훅, 라우터는 관리자가 없습니다.
EN: The page reads every role from the contracts: pausing and naming the publisher only; nobody can issue USTX off the recorded NAV, edit a record or move anyone's tokens.

### 제품과 시장

**Q7. 그냥 9종목을 직접 사면 되지 않나? 비용 차이도 작은데.**
맞습니다, 비용 차이는 작습니다. OKX DEX 견적으로 $1,000을 9종목에 나누면 비용이 0.09%, 수수료는 1센트 남짓입니다. USTX의 가치는 비용보다 한 번의 주문(서명 2번 대 10번), 포지션 하나, 바스켓 안의 리밸런싱, 누구나 검증하는 NAV, 그리고 담보·가격 피드·풀처럼 다른 앱이 가져다 쓰는 조합성입니다.
EN: The cost difference is small, about 0.09% on $1,000; the value is one order, one position, rebalancing, a verifiable NAV and composability.

**Q8. 배당은? xStocks는 배당을 주는데.**
xStocks는 배당을 잔고 배수(multiplier)로 줍니다. 테스트넷 NAV는 종목마다 토큰 수를 고정해서 세기 때문에 배당과 액면분할은 아직 반영하지 않고, 공개 한계에 그렇게 적었습니다. 실물을 담는 현물 볼트는 고정 수량이 아니라 비율로 세서, xStocks 같은 배수 토큰으로 한 컨트랙트 시험에서 10% 배당이 환매자에게 그대로 갔습니다. 메인넷에서는 보유 잔고를 체인에서 읽어 NAV에 반영합니다.
EN: Dividends arrive through the xStocks' balance multiplier; the testnet NAV doesn't model them yet, which we state, while our in-kind vault counts proportions and passes them to redeemers in its tests.

**Q9. 왜 X Layer인가?**
xStocks가 X Layer 메인넷에 있고, OKX OnchainOS가 그 가격을 주고, 기록 한 번이 $0.00016이라 5분마다 기록해도 월 $1.40입니다. OKX Wallet 사용자가 바로 쓸 수 있습니다.
EN: The xStocks live on X Layer, OnchainOS prices them, and a record costs about $0.00016, so five-minute records cost $1.40 a month.

**Q10. 사용자는 몇 명인가?**
실사용자를 주장하지 않습니다. 사용량을 팀 지갑과 분리해 공개하고 있고(`/api/v1/ustx/usage`), 9월 25일 이후 팀 밖 지갑은 2개, 71건입니다. 지금의 고객은 개인 투자자보다 검증된 NAV가 필요한 바스켓 발행사와 그 NAV를 쓰려는 X Layer 앱입니다.
EN: We claim no users: our public usage API separates the team's wallets, and two outside wallets have acted since September 25.

**Q11. 수익 모델은?**
테스트넷에서는 받지 않습니다. 메인넷에서 발행사가 바스켓을 올리면 바스켓당 구독, 인가 파트너를 통한 판매 수수료, 그리고 바스켓을 담보로 받는 대출 프로토콜의 NAV 피드 구독입니다. 원가는 바스켓당 가스 월 약 $1.40이라, 예를 들어 연 0.15%를 받는 $10M 바스켓이면 연 $15,000 대 가스 약 $17입니다. 이 숫자는 예시이고 가격 제시가 아닙니다.
EN: Nothing on testnet; on mainnet a per-basket subscription, a distribution fee through licensed partners and NAV feed subscriptions, against about $1.40 of gas a month per basket.

**Q12. 규제는? 실제 돈은 언제?**
토큰화 펀드는 규제 상품이라 인가 발행사, 수탁, 감사 없이는 실제 돈을 받지 않습니다. 코드에서도 실제 돈 투자 경로와 수탁 주소는 닫혀 있고 모든 화면에 데모 표시가 있습니다. 순서는 감사 → 메인넷에 NAV를 가격 피드로만 기록(주식 발행·자금 이동 없음) → 인가 발행사가 현물 볼트로 xStocks 수탁 → 유통입니다.
EN: Real money only with a licensed issuer, custody and an audit; the road is audit, mainnet NAV as a price feed only, a licensed issuer with custody, then distribution.

**Q13. 테스트넷 펀드에 실제 xStocks가 있나?**
없습니다. 테스트넷 펀드는 투자 때 데모 달러를 소각하고 환매 때 발행합니다. 실물을 담는 현물 볼트는 X Layer 메인넷 포크에서 실제 AAPLx·MSFTx·NVDAx로 생성과 환매를 돌렸고, 배포하지 않았습니다.
EN: No; the testnet fund burns and mints demo dollars, and the in-kind vault ran with real xStocks only on a mainnet fork.

**Q14. 기존 서비스와 무엇이 다른가?**
DTCC Smart NAV, Centrifuge, Reserve의 인덱스 DTF처럼 NAV를 체인에 올리거나 바스켓을 발행하는 곳은 있습니다. 저희 차이는 방문자가 자기 브라우저에서 NAV를 한 줄씩 재현하고, 어떤 검사가 어떤 조작을 잡는지 보고, 그 결과를 파일로 넘길 수 있다는 점, 그리고 NAV 자산의 공급자를 차익거래에서 지키는 v4 훅입니다.
EN: Others put NAVs on chain; here any visitor reproduces the NAV in their own browser and passes the proof on as a file, and the hook protects providers of a NAV asset.

### 기술

**Q15. v4 훅은 일반 풀과 무엇이 다른가?**
새 NAV가 기록되면 거래보다 먼저 풀을 NAV로 옮겨서 아무도 옛 가격으로 공급자와 거래할 수 없습니다. 예치는 다음 기록 가격으로 받습니다. 수수료는 NAV가 오래될수록 0.30%에서 1.00%로 오르고, 1시간이 넘으면 스왑이 멈추며, NAV에서 약 5% 밖으로는 못 갑니다. 10월 1일 이후 차익거래로 잃은 돈이 0입니다.
EN: Before any trade after a new record it moves the pool to the NAV, so nobody trades the old price against providers; arbitrage has taken nothing from it since October 1.

**Q16. 범위 풀 훅은 왜 여러 번 배포했나?**
10월 4일 처음 배포했고, 10월 6일 두 번 바꿨습니다. 한 번은 포지션을 열 때 가격 한도를 받게 하려고, 한 번은 칸마다 모양을 직접 그리는 기능(`openCustom`) 때문입니다. 매번 포크에서 교체를 리허설했고, 이전 훅의 시드 포지션은 닫았으며 다른 지갑의 열린 포지션은 없었습니다. 컨트랙트에 관리자가 없어서 고치려면 새로 배포하는 수밖에 없습니다.
EN: Twice on October 6, to add a price limit and drawn shapes; it has no administrator, so a change means a new deployment, rehearsed on a fork with no outside positions open.

**Q17. 커버드콜 가격은 어디서 오나? 옵션 시장이 없는데.**
그래서 모델입니다. X Layer에 xStocks 옵션 시장이 없어서, 매달 콜 가격을 Black–Scholes로 공개된 조건(변동성 S&P 16%, 나스닥 21%, 금리 4%)에 매기고 데모에서는 펀드가 그 콜을 씁니다. 변동성은 지난 1년 VIX·VXN 평균 근처입니다. 브라우저가 문서에서 그 값을 다시 계산합니다.
EN: There is no options market for xStocks on X Layer, so each month's call is priced by Black–Scholes at stated terms, which the browser recomputes.

**Q18. ELS1은 누가 지급하나?**
기록된 SPYx·QQQx 가격으로 지급액을 정하고, 헤지는 없습니다. 데모 상품이고 투자는 열려 있지 않습니다.
EN: It pays from recorded prices with nothing hedging it; it's a demo product, not open to investing.

**Q19. AI는 무엇을 하나? 환각은?**
읽기만 합니다. 체인과 기록을 읽는 도구 8개로만 답하고, 답마다 읽은 도구를 표시하며, 투자 조언은 거절합니다. 같은 도구가 키 없이 쓰는 MCP 서버(`/mcp`)라서 다른 에이전트도 같은 근거를 씁니다.
EN: It only reads, through eight tools, names the tools behind each answer and refuses investment advice.

**Q20. OKX.AI에 등록했나?**
MCP 서버는 OKX.AI A2MCP 클라이언트가 바로 붙을 수 있게 열려 있고, 등록은 신청 후 승인 전입니다.
EN: The MCP server is open to OKX.AI's A2MCP clients; the listing is awaiting approval.
※ 10월 3일 기준이다. 발표 전에 OKX.AI에서 승인 여부를 확인하고, 승인됐으면 "registered on OKX.AI"로 바꿔 말한다.

**Q21. 가격 조작이나 플래시론은?**
펀드와 대출은 풀 가격이 아니라 레지스트리에 기록된 NAV를 씁니다. 훅 풀은 NAV에서 약 5% 밖으로 못 움직이고, 범위 풀은 NAV 1% 안에서만 포지션이 열립니다. 대출 담보도 같은 NAV로 평가합니다.
EN: Orders and loans use the recorded NAV, not a pool's spot price, and the hooks keep their pools within about 5% of it.

**Q22. 결국 서버(릴레이어)에 의존하지 않나?**
기록은 릴레이어 키 하나가 합니다. 그래서 검증은 서버 밖에서 누구나 하게 했고, 기록이 멈추면 펀드가 멈추는 쪽으로 실패합니다. 발행사마다 자기 지갑과 레지스트리로 기록할 수 있습니다(MAG3 예시).
EN: One relayer key publishes, so verification happens outside our server and a stall fails safe; an issuer can publish from its own wallet and registry, as MAG3 does.

### 팀과 다음 단계

**Q23. 다음 3개월에 무엇을 하나?**
외부 감사, 관리자 멀티시그와 타임락, 메인넷에 NAV를 가격 피드로만 기록, 거래소 가격 기준 추가와 배당·분할 정책, 발행사가 명령줄 없이 바스켓을 여는 콘솔입니다.
EN: An audit, a multisig and timelock, NAV records on mainnet as a feed only, an exchange price reference with a corporate-actions policy, and an issuer console.

**Q24. 이전에 만든 것을 재사용했나?**
네. 7월에 원화 크립토 전략 엔진으로 시작한 코드에서 엔진과 저장소를 재사용했고, 행사 기간 이후의 작업은 커밋과 함께 `docs/BUILD_PERIOD.md`에 나눠 적었습니다.
EN: Yes, the strategy engine from July; everything since the build period is listed with its commits in BUILD_PERIOD.md.

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
