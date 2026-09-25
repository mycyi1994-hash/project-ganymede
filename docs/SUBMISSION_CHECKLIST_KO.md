# Ganymede 제출 체크리스트

비공개 개발 저장소 전용 문서다. 공개 스냅샷에는 넣지 않는다(`SUBMISSION_EXPORT.md`의 제외 목록).

작성 시점: 2026-09-25 01:50 UTC. 제출 양식 답안·영상 대본·최종 점검은 10:55 UTC(19:55 KST)에 고쳤다.

## 1. 한눈에 보기

| 항목 | 상태 |
| --- | --- |
| 제출 마감 | **2026-09-25 23:59 UTC = 9/26(토) 08:59 KST** |
| 권장 제출 시각 | **9/26(토) 01:00 KST까지.** 영상 업로드와 양식 오류에 대비한다 |
| 제품 링크 | https://ganymede-xlayer.gana003.workers.dev/ (운영 중) |
| 공개 저장소 | https://github.com/mycyi1994-hash/project-ganymede-submission (운영 소스와 동기화됨, README 있음) |
| 데모 영상 | **사용자가 만든다** (4·5절). 2~4분, YouTube 공개 또는 일부 공개 |
| 제출 양식 | 사용자가 받은 Google 양식. **6절 답안을 항목 순서대로 붙여 넣는다** |
| 대표 이미지(1:1) | 선택 항목. Claude가 만든 1024×1024 PNG(`ganymede-team-1x1.png`)를 쓴다 |
| 개발 | 제출 가능한 상태로 완료. 제출 뒤에는 새 기능을 배포하지 않는다 |

### 개발 쪽에서 끝난 것 (9/25 12:20 UTC 기준)

- **운영 제품** (X Layer Testnet, 가치 없는 데모 달러 dUSD)
  - **Markets**: USTX NAV(OKX OnchainOS 가격, X Layer 기록)와 **다음 기록까지 카운트다운**(새 기록이 오면 초록·빨강으로 반짝임), 펀드 규모·투자자·24시간 순유입, 차트(마우스를 올리면 툴팁, **키퍼 차익거래와 $1,000 이상 주문 표시**), 구성 종목(가격·고정 이후 변화·목표 비중 막대, **누르면 상세 패널**), 그리고 **시장 활동 카드**(24시간 거래액·거래 수·키퍼 차익거래와 번 금액·대출 동작, 최근 거래 4줄).
  - **USTX 화면**
    - 투자 패널: OKX Wallet → X Layer Testnet 전환 → dUSD 받기 → 주문. 펀드(NAV)와 풀(시장가) 중 **더 좋은 가격으로 자동 선택**한다. 체결 후 "Added to your basket"에 6종목 토큰 수량이 나온다. 지갑이 없으면 Demo balance 탭으로 같은 체험을 한다.
    - 펀드 개요: 규모, 투자자, 수익률, 핵심 조건, 풀의 시장가격과 NAV 대비 괴리율(**±0.3% 수수료 구간이 칠해진 게이지**), 가격 오라클.
    - **시장 활동**: 펀드 투자·환매, 풀 매매, 키퍼 차익거래(번 금액 포함), 대출의 각 단계가 실시간으로 나온다. 줄마다 OKX 탐색기로 연결된다.
    - **Borrow against USTX**: USTX를 담보로 넣고 dUSD를 빌리고, 갚고, 빼고, 빌려주는 대출 시장. 내 대출은 **50% 한도·65% 청산선이 있는 막대**로 보인다.
  - **Portfolio**: 지갑의 USTX와 담보(대출 포함)를 6종목으로 들여다보기(**도넛 차트**와 표), 데모 잔고, X Layer 메인넷의 실제 xStocks 평가와 명세서.
  - **Transparency**: 고객용 증명 페이지. 방문자 브라우저가 X Layer 기록을 직접 읽어 확인한다.
  - **파트너용**: `/developers`(검증 실험·증거 파일·API·NAV 가격 피드·풀·담보 예시), `/issuers`, `/embed/ustx` 배지, 공개 API `/api/v1/ustx`·`/api/v1/ustx/activity`.
- **컨트랙트 8개** (X Layer Testnet): NAV 기록, USTX 펀드, dUSD, Chainlink 방식 NAV 피드, USTX/dUSD 풀, NAV 차익거래, 대출 시장, 예전 GMDCORE 장부. 모두 OKX 탐색기와 Sourcify에서 소스 검증을 마쳤다.
- **자동으로 도는 것**: 5분마다 NAV 기록, 5분마다 키퍼(풀이 NAV에서 벗어나면 차익거래로 되돌림), 5분마다 시장 활동 수집.
- **화면 개선 배포** (9/25 12:05 UTC, Worker `5225c560`): 위의 상세 패널·카운트다운·게이지·대출 막대·차트 툴팁과 표시·첫 로딩 자리 표시·도넛. 배포 뒤 공개 경로 17개 200, 이전 경로 4개 307, 데스크톱·모바일·지갑 있음·없음으로 7개 화면과 상세 패널을 연 상태 모두 axe 위반 0건.
- **최종 점검** (9/25 10:30~10:50 UTC, 운영, Worker `90840b50`)
  - 공개 경로 17개 200, 이전 경로 4개 307. 데스크톱·모바일, 지갑 있음·없음으로 7개 화면 axe 위반 0건, 가로 넘침·페이지 오류 없음.
  - 테스트 지갑으로 실제 거래: 풀 매수·매도, 펀드 $10 투자와 환매, 대출(입금 → $5 대출 → 상환 → 인출)이 모두 성공했다. 거래마다 몇 초 안에 시장 활동 맨 위에 "You"로 나왔다.
  - 데모 잔고 $250 매수, 지갑 Portfolio(지갑·담보·대출·공급 표시)가 정상이었다.
  - 운영에서 내려받은 증거 파일을 `npm run verify:evidence`로 다시 확인해 5개 항목 모두 PASS였다.
  - USTX 공시는 최근 1시간 동안 5분마다 빠짐없이 기록됐다. 지난 24시간은 233건이다. 9/24 12:30~9/25 00:45 UTC에는 OKX 요청 제한(429) 대기로 10~35분 공백이 여러 번 있었다(8절).
- **테스트**: 앱 160개, relayer 28개, 컨트랙트 62개 통과, lint 오류 0.
- **공개 저장소**: 운영 소스 `a20712f`와 같은 코드(공개 커밋 `4f7681e`, 9/25 12:14 UTC). README, 빌드 기간 작업 목록(`docs/BUILD_PERIOD.md`), 출처 기록(`docs/BUILD_EVIDENCE.md`), 비밀값 검사 통과. 문서의 링크 31개 중 30개가 200이다. 남은 1개(Centrifuge 문서)는 Cloudflare 봇 확인 화면이 뜨지만, 실제 브라우저에서는 열린다.

## 2. 사용자가 해야 할 일 (순서대로)

- [ ] **1. 데모 영상 녹화 (필수, 1~2시간)**: 4절 대본과 5절 방법을 따른다. 길이는 2~4분, 목표는 3분이다.
  - 지갑 장면을 찍으려면 녹화 전에 준비한다(4절 "녹화 전 준비").
    - 크롬에 OKX Wallet 확장 프로그램을 설치하고, 사이트에서 Connect → Switch to X Layer Testnet을 한다.
    - 가스비로 쓸 테스트 OKB가 조금 필요하다. 필요하면 **지갑 주소를 Claude에게 알려 주면 테스트 지갑에서 보내 준다**(테스트넷, 가치 없음).
  - 지갑 준비가 어려우면 Demo balance 탭으로 찍어도 된다. 지갑 거래는 시장 활동 목록과 OKX 탐색기로 보여 준다.
- [ ] **2. 영상 업로드 (필수, 20분)**: YouTube에 "공개" 또는 "일부 공개"로 올린다. **"비공개"는 안 된다.** 로그아웃한 시크릿 창에서 재생되는지 확인한다.
- [ ] **3. 제출 양식 작성 (필수, 20분)**: 6절 답안을 양식 항목 순서대로 붙여 넣는다. 팀 이름·인원·멤버 실명·참가 경로는 본인이 정한다.
- [ ] **4. 제출 후 (필수)**
  - 접수 확인 이메일(submission receipt)이 오는지 본다.
  - 누락이나 링크 문제로 연락(이메일 또는 텔레그램)이 오면 **24시간 안에** 답한다.
  - 현장 결선 진출팀은 9/30까지 서면 확인을 받는다. 원격 제출은 Best Remote Demo 상으로 따로 심사한다.
- [ ] **5. 자격 확인**
  - 만 18세 이상이고 제한 대상자가 아니어야 한다.
  - 주최 측이 신원 확인을 요청할 수 있다. 멤버 이름은 신분증과 똑같이 적는다.
  - 상금 수령 지갑은 수상 후 주최 측 안내에 따라 본인이 준비한다.
- [ ] **6. (권장) 발표 준비**: 7절 질의응답을 소리 내어 한 번 연습한다.
- [ ] **7. (선택, 1분) 공개 저장소 Website 칸**: GitHub `project-ganymede-submission` 페이지 오른쪽 About 옆 톱니바퀴 → Website에 제품 링크를 넣는다.
- [ ] **8. 심사가 끝날 때까지(10/7) 운영 유지**: 8절 참고.

## 3. 부족한 점 (솔직한 평가)

마감 전에 개발로 해결할 수 없거나, 일부러 하지 않은 것들이다. 문서와 화면에 이미 한계로 밝혀 두었다.

| 부족한 점 | 영향 | 대응 |
| --- | --- | --- |
| 데모 영상 없음 | 필수 제출물. 없으면 제출 불완전 | 사용자가 제작(4·5절) |
| 실제 고객·수요 근거 없음 | 성장성 점수에 약점 | 주장하지 않는다. 요금제는 Sandbox(무료)만 열려 있고 나머지는 "Contact us"로 표시했다. 가능하면 지인 1~2명에게 데모 투자를 해 보게 하고 받은 반응을 발표에서 말한다 |
| NAV 기록이 X Layer **Testnet** | 메인넷 실사용이 아니라는 지적 가능 | 가격·xStocks 잔고는 메인넷이다. 기록 메인넷 이전은 "다음 단계"로 명시 |
| 가격 출처가 OKX OnchainOS 하나 | 가격 정확성은 증명하지 않음 | 화면과 문서에 "가격이 맞는지는 확인하지 않는다"고 적었다. 두 번째 출처는 다음 단계 |
| 원문 문서는 최근 12건(약 1시간)만 보관 | 오래된 기록은 화면에서 재검증 불가 | 증거 파일을 받아 두면 언제든 재확인된다(명령어가 거래 영수증과 대조) |
| 실제 지갑 확장 프로그램으로는 미검증 | 드물게 연결·서명 창 문제가 있을 수 있음 | 테스트 지갑을 브라우저에 주입해 받기·승인·투자·취소·환매를 X Layer Testnet에서 끝까지 확인했다. 실제 OKX Wallet 확장 프로그램은 사용자가 한 번 확인 |
| OKX AI(에이전트) 연동 없음 | "X Layer and/or OKX AI" 중 X Layer만 사용 | 의도적 선택. Build a Market 트랙 요건은 충족 |
| 컨트랙트 감사 없음 | 보안 신뢰도 | 테스트넷 기록용이며 실자금 경로 없음을 명시 |
| 기존 프로젝트(7월 업비트·GIWA 코드) 기반 | 심사는 빌드 기간 작업만 봄 | `BUILD_PERIOD.md`에 커밋별로 구분. GMDCORE의 "GIWA" 문구도 공개 설명함 |
| 실자금 투자는 아님(데모 달러) | "진짜 돈은 못 넣는다"는 지적 가능 | 지갑으로 X Layer Testnet에서 실제 거래(승인·투자·환매)가 되고 USTX가 지갑에 들어온다. 돈은 가치 없는 데모 달러(dUSD)다. 실자금은 발행사·수탁·라이선스가 필요하며 `/issuers` 요금제 아래에 "실자금 서비스는 라이선스 파트너와만 제공한다"고 적었다 |
| 투자자 수는 데모 계정 수 + USTX를 가진 지갑 수 | "실사용자"로 오해될 수 있음 | 화면에 테스트넷·데모 표시가 있다. 발표·영상에서 "투자자가 N명 있다"고 말하지 않는다 |

## 4. 데모 영상 대본 (약 3분 15초)

### 핵심 메시지

"토큰화된 미국 기술주 6종을 한 좌에 담은 USTX를 OKX Wallet으로 X Layer에서 사고, 시장에서 거래하고, 담보로 빌리며, 그 가격이 맞는지 내 브라우저에서 X Layer 기록과 직접 대조한다."

꼭 보여 줄 장면은 셋이다.
1. **지갑 주문이 최적 가격으로 체결되고**, 몇 초 뒤 시장 활동 맨 위에 "You"로 뜨는 장면.
2. **키퍼 차익거래 줄**("Closed the gap to the NAV … earned $…"): 시장이 스스로 NAV를 따라간다.
3. **변조 실험의 세 번째**: 숫자와 NAV가 모두 같아도 X Layer에 기록된 지문만 변조를 잡는다.

### 녹화 전 준비

- **브라우저**: 크롬, 1920×1080 전체 화면, 확대 110%, 북마크 바 숨김(Ctrl+Shift+B), 알림 끄기.
- **지갑 장면을 찍을 때 (권장)**
  1. 크롬 웹 스토어에서 **OKX Wallet** 확장 프로그램을 설치하고 새 지갑을 만든다(시드 문구는 종이에 적어 둔다).
  2. https://ganymede-xlayer.gana003.workers.dev/products/ustx 에서 오른쪽 위 **Connect OKX Wallet** → 승인 → **Switch to X Layer Testnet** → 승인.
  3. 가스비로 쓸 테스트 OKB가 필요하다. 투자 패널의 "Get test OKB" 링크(OKX 수도꼭지)를 쓰거나, **지갑 주소를 Claude에게 보내면 테스트 OKB를 보내 준다**.
  4. 투자 패널의 **Get demo dollars**로 dUSD 10,000을 받는다(24시간에 한 번).
  5. 리허설로 $10 한 번 사 본다. 승인 창이 한 번 더 뜨는 것(처음 한 번만)을 미리 겪어 두면 녹화가 매끄럽다.
- **지갑 없이 찍을 때**: 투자 패널의 **Demo balance** 탭으로 장면 2를 찍고, 장면 4는 대출 절의 시장 숫자와 설명만 보여 준다.
- **미리 열어 둘 탭 5개**
  1. https://ganymede-xlayer.gana003.workers.dev/
  2. https://ganymede-xlayer.gana003.workers.dev/products/ustx
  3. https://ganymede-xlayer.gana003.workers.dev/portfolio
  4. https://ganymede-xlayer.gana003.workers.dev/products/ustx/transparency
  5. https://ganymede-xlayer.gana003.workers.dev/developers#verify
- **시각**: NAV는 5분마다(:00, :05 …) 기록된다. 5분 단위 정각에서 1분쯤 뒤에 새로고침하고 시작하면 최신 기록이 보인다.
- **확인**: 초록색 "Verified in your browser"가 보이는지 본다. "Checking the record…"면 몇 초 기다린다.
- 장면별로 따로 녹화한 뒤 이어 붙여도 된다(5절).

### 장면별 대본

영어 문장을 천천히 읽는다. 영어 녹음이 어려우면 5절의 "목소리 대안"을 쓴다.

**장면 1 — Markets (0:00~0:25)**
화면: 첫 화면. NAV와 옆의 "Next NAV in 3:12" 카운트다운, 초록 "Verified in your browser", 차트(선 위에 마우스를 올려 툴팁을 1초), 오른쪽 여섯 종목. 종목 하나(예: Meta)를 눌러 상세 패널을 2~3초 보여 주고 닫는다. 아래로 내려 **Market activity** 카드(24시간 거래액·거래 수·차익거래·대출)를 보여 준다.
> This is Ganymede, built on X Layer for OKX Dev Day. USTX, the US Tech Basket, holds Apple, Microsoft, NVIDIA, Amazon, Meta and Tesla in one share, through their xStocks on X Layer. OKX OnchainOS prices it every five minutes, and every price is recorded on X Layer; the next record is a few minutes away. Tap any stock for its price, its weight and the tokens in each share. Below is the market's last 24 hours, read straight from the chain.

뜻: USTX는 미국 기술주 6종을 한 좌에 담았다. 5분마다 OKX OnchainOS로 가격을 매기고 X Layer에 기록한다(다음 기록까지 몇 분). 종목을 누르면 가격·비중·한 좌에 든 토큰이 나온다. 아래는 체인에서 바로 읽은 최근 24시간 시장 활동이다.

**장면 2 — OKX Wallet으로 투자 (0:25~1:05)** ← 핵심 장면 1
화면: USTX 탭. 투자 패널(Wallet 탭)에 $100 입력 → 두 거래처(펀드·풀) 비교와 "Best price" → Review order → Confirm in wallet → OKX Wallet 창에서 확인 → "Order filled"와 "Added to your basket" → 아래 **Market activity** 맨 위에 "You"로 뜬 줄.
> I invest a hundred demo dollars from OKX Wallet on X Layer Testnet. The order panel compares the fund, at the NAV recorded on X Layer, with the USTX market pool, and picks the better price. I confirm in my wallet, and it fills in seconds. Here is what my money bought, token by token, and my trade is already at the top of the market activity, linked to the OKX explorer. These are demo dollars, so no real money moves.

뜻: OKX Wallet으로 데모 달러 $100를 투자한다. 주문 패널이 X Layer에 기록된 NAV의 펀드와 USTX 시장 풀을 비교해 더 좋은 가격을 고른다. 지갑에서 확인하면 몇 초 안에 체결되고, 내 돈이 무엇에 담겼는지와 시장 활동 맨 위의 내 거래가 보인다.

**장면 3 — 시장과 키퍼 (1:05~1:30)** ← 핵심 장면 2
화면: 펀드 개요의 **Pool price against the NAV** 게이지(칠해진 0.3% 수수료 구간 안의 점) → 위 차트의 검은 점(키퍼 차익거래)에 마우스를 올려 "Closed the gap to the NAV" 툴팁 → 시장 활동에서 "Closed the gap to the NAV … earned $… · Arbitrage keeper" 줄(Show all을 눌러 찾는다) → 눌러서 OKX 탐색기 2~3초.
> USTX also trades in a pool with its own market price. When that price drifts from the NAV, our keeper buys or sells through the fund in one transaction, the way ETF creation and redemption keep a fund's price in line. Here it closed a gap and earned a few demo dollars.

뜻: USTX는 자체 시장가격이 있는 풀에서도 거래된다. 가격이 NAV에서 벗어나면 키퍼가 펀드를 통해 한 번의 거래로 되돌린다. ETF의 설정·환매와 같은 원리다.

**장면 4 — 담보 대출 (1:30~1:55)**
화면: "Borrow against USTX". 지갑이 있으면 Deposit USTX 소량 → Borrow $20. 포지션(대출 한도, LTV, 청산 NAV)과 50% 한도·65% 청산선이 있는 **대출 비율 막대**("Healthy")를 보여 준다.
> USTX is also collateral. I deposit USTX and borrow demo dollars against it, up to half its value at the NAV recorded on X Layer. If a loan passes sixty-five percent, anyone can liquidate it, and the fund redeems the collateral at the NAV.

뜻: USTX를 담보로 넣고 X Layer에 기록된 NAV 기준 가치의 절반까지 빌린다. 65%를 넘으면 누구나 청산할 수 있다.

**장면 5 — Portfolio (1:55~2:15)**
화면: Portfolio 탭. 지갑의 USTX와 담보 USTX 행(담보 줄의 대출 비율 막대), 종목별 **도넛**(조각에 마우스를 올리면 가운데에 종목 금액)과 들여다보기 표.
> My portfolio shows the USTX in my wallet and the USTX I posted as collateral, looked through to the six xStocks at the recorded prices.

**장면 6 — Transparency (2:15~2:35)**
화면: Transparency 탭. 초록 "NAV verified on X Layer", 1·2·3 단계 카드 → "View on OKX Explorer"로 기록 거래 2~3초.
> But why trust the price? My browser reads the record on X Layer directly and recalculates the NAV row by row. Here is that record on the OKX explorer.

**장면 7 — Verify it yourself (2:35~3:05)** ← 핵심 장면 3
화면: 개발자 페이지(탭 5) "Try to break it". 버튼 세 개를 차례로 누르고 결과(Matches/Fails)를 1~2초씩 보여 준다.
> For developers, here is the check behind it. Change one price, and the arithmetic fails. Fix the arithmetic, and the NAV no longer matches the chain. Offset two prices so every number and the NAV stay the same, and only the fingerprint recorded on X Layer catches it. Other apps can read this NAV through our API, an embeddable badge, or a Chainlink-style price feed.

**장면 8 — 마무리 (3:05~3:15)**
화면: Markets로 돌아가 초록 "Verified in your browser"와 시장 활동 카드.
> Priced by OKX OnchainOS, recorded and traded on X Layer, verified by you. Ganymede.

### 영상에서 하면 안 되는 말

- "실제 돈으로 투자할 수 있다" → 항상 "demo dollars"라고 말한다.
- "투자자가 N명 있다", "사용자가 있다" → 투자자 수와 거래는 대부분 우리 테스트 지갑과 데모 계정이다.
- "메인넷에 기록한다" → 기록과 거래는 X Layer **Testnet**, 가격과 xStocks는 메인넷이다.
- "가격이 정확함을 증명한다", "감사받았다", "요금을 받고 있다"(요금제는 문의만 받는다).
- "키퍼가 돈을 번다" → 번 것은 가치 없는 데모 달러다.
- 모두 사실이 아니다. 약관상 허위 주장은 실격 사유다.

## 5. 녹화·편집·업로드 방법 (초보자용)

### 녹화 도구 (하나만 고르면 된다)

- **윈도우 11: Clipchamp (기본 설치, 추천)**
  1. 시작 메뉴에서 Clipchamp를 연다.
  2. "새 동영상 만들기" → 왼쪽 "녹화 및 만들기" → "화면" 또는 "화면 및 카메라".
  3. 크롬 탭을 선택하고 마이크를 켠 뒤 녹화한다.
  4. 같은 앱에서 편집, 자막, 내보내기까지 할 수 있다.
- **윈도우 대안**: Win+G(Xbox Game Bar)를 열고 Win+Alt+R로 녹화를 시작하고 멈춘다. 파일은 동영상\캡처 폴더에 생긴다.
- **맥**
  1. Cmd+Shift+5를 누른다.
  2. "선택 부분 기록" 또는 "전체 화면 기록"을 고른다.
  3. 옵션에서 마이크를 선택하고 "기록"을 누른다.
  4. 메뉴 막대의 정지 버튼으로 끝낸다. 편집은 iMovie에서 한다.

### 편집

- **팁**: 장면마다 따로 녹화하고, 편집기에서 이어 붙이고, 말이 끊긴 부분을 잘라낸다.
- **자막**: 영어 자막을 넣는다. Clipchamp는 "자막" 자동 생성 기능이 있고, YouTube 자동 자막도 켤 수 있다.
- **길이**: **2:00~4:00**을 반드시 지킨다. 목표는 3:00이다.
- **내보내기**: 1080p MP4.

### 목소리 대안 (영어 녹음이 어려우면)

- Clipchamp의 "텍스트 음성 변환(Text to speech)"에 4절 영어 문장을 넣어 영어 음성을 만든다.
- 또는 목소리 없이 영어 자막만 넣어도 된다. 제품과 연동이 보이는 것이 핵심이다.

### YouTube 업로드

1. youtube.com에 로그인하고 오른쪽 위 "만들기(+)" → "동영상 업로드"를 누른다.
2. 파일을 선택한다.
3. 제목: `Ganymede — a tokenized US tech stock fund on X Layer (OKX Dev Day 2026)`
4. 설명: 제품 링크와 공개 저장소 링크를 붙여 넣는다.
5. 시청자층: "아니요, 아동용이 아닙니다".
6. 공개 상태: **공개** 또는 **일부 공개**. 비공개는 심사자가 볼 수 없다.
7. 게시한 뒤 링크를 복사하고, **로그아웃한 시크릿 창에서 재생되는지** 확인한다.

## 6. 제출 양식 답안 (양식 순서대로, 영어는 그대로 복사)

사용자가 받은 Google 양식(OKX Dev Day 2026 Project Submission)의 항목 순서다. `[ ]`는 본인이 정한다.

1. **Team Name\***: `[팀 이름]`. 따로 없으면 `Ganymede`.
2. **Team Size\***: `[1~4]`. 혼자면 1.
3. **Team Members' Names\***: `[멤버 전원의 실명]`. 신분증과 똑같은 철자로 적는다(상금 확인용).
4. **Which track\***: **Build a Market – build with X Layer**
5. **Participation Route\***: `[In-Person (7 Oct 2026) 또는 Remote]`
   - 10/7 싱가포르 결선에 갈 수 있으면 In-Person을 고른다. 결선에 뽑히지 않아도 자동으로 Best Remote Build 심사를 받으니 손해가 없다.
   - 갈 수 없으면 Remote를 고른다.
6. **Would the team be able to attend our in-person finale?\***: 갈 수 있는 인원 수를 고른다. Remote면 **0: Unable to**.
7. **Team Display Picture [1:1 Image]** (선택): Claude가 만든 `ganymede-team-1x1.png`(1024×1024, 315KB)를 올린다.
8. **Project Name\***: `Ganymede`
9. **Project Summary\***:
```text
1. Product: Ganymede sells USTX, the US Tech Basket: one token holding six tokenized US tech stocks (AAPLx, MSFTx, NVDAx, AMZNx, METAx, TSLAx). Every five minutes OKX OnchainOS prices the basket, and its NAV, shares outstanding and a fingerprint of the full composition are recorded on X Layer, where any visitor's browser re-checks them. From OKX Wallet you invest at that NAV or trade USTX in its own market pool, whichever prices the order better; a keeper closes the pool's gap to the NAV by arbitrage through the fund, and USTX can be posted as collateral to borrow against. It runs on X Layer Testnet with demo dollars that have no value.

2. Intended users: investors who want tokenized-stock exposure whose price they can verify; issuers of tokenized-stock baskets who must publish a NAV others can check; wallets and apps on X Layer that want to show or build on it.

3. Core integration: the OKX OnchainOS Market API prices the xStocks on X Layer mainnet; our X Layer Testnet contracts record each NAV and run the fund, the USTX/dUSD pool, the arbitrage, the lending market and a Chainlink-style NAV feed; OKX Wallet signs every on-chain order, and every record and trade links to the OKX explorer. Partners get a public API and a self-verifying badge.
```
10. **Repository Link\***: `https://github.com/mycyi1994-hash/project-ganymede-submission`
    - 공개 저장소이고 README가 있다. 운영 소스 `6e3e143`과 같은 코드다.
11. **Demo Video\***: `[YouTube 링크]`. 2~4분, 공개 또는 일부 공개(4·5절).
12. **Product Link\***: `https://ganymede-xlayer.gana003.workers.dev/`
13. **Is this a new project, or are you adding features to an existing one?\***: **No, project is built on a pre-existing codebase or product**
    - 사실대로 고른다. 저장소는 2026년 7월의 원화 암호화폐 전략 엔진에서 시작했다.
    - 제출하는 USTX 제품, X Layer 계약·연동, 모든 화면은 빌드 기간에 만들었다. `docs/BUILD_PERIOD.md`가 커밋별로 구분한다.
    - 설명 칸이 따로 있으면 아래 문장을 쓴다.
```text
The repository started in July 2026 as a Korean-won crypto strategy engine with settlement on another testnet (last pre-event commit 7a33392, 30 July 2026). Everything in the submission was built during the build period: settlement on X Layer, the six-xStock USTX basket priced by OKX OnchainOS, the NAV registry records, wallet investing through the USTX contract, the USTX/dUSD pool and NAV arbitrage keeper, the lending market, the NAV price feed, market activity, browser verification and evidence files, Portfolio, and the public API and badge. docs/BUILD_PERIOD.md lists every build-period commit.
```

### 양식에는 없지만 물어보면 쓸 문구

**Contract addresses (X Layer Testnet, 1952)**
```text
GanymedeNavRegistry (NAV records): 0xf320d2a7f280b7ab61e24374986869d7be34289c
GanymedeBasketFund (USTX share token): 0x77eaeba1366bde7818da12d3cbdbea0a2ee97596
GanymedeDemoDollar (dUSD, no value): 0xf07535080f74e8b0f571e58dfa600f47e72ea9bf
GanymedeNavFeed (USTX / USD, Chainlink AggregatorV3Interface): 0x292c56c5290cc7b73e3ee33c2c2688eb3e04c3c8
GanymedeUstxPool (USTX/dUSD market): 0x286f5e7ffdbc30db12665d7a3854217d7cd05cc1
GanymedeNavArbitrage (one-transaction NAV arbitrage): 0xaeba15aa92d6f3109e2b992f18933e1abe2fa3d9
GanymedeLendingMarket (dUSD loans against USTX): 0xae2f54ae3d0370295de18510d56de92afb8843c7
All sources verified on the OKX explorer and on Sourcify.
Public API: https://ganymede-xlayer.gana003.workers.dev/api/v1/ustx
Market activity API: https://ganymede-xlayer.gana003.workers.dev/api/v1/ustx/activity
Embeddable badge: https://ganymede-xlayer.gana003.workers.dev/embed/ustx
```

**AI 도구 사용을 묻는 칸이 있으면**
```text
AI-assisted development tools were used. The team reviewed the work and is responsible for explaining and maintaining it.
```

## 7. 예상 질문과 답 (Q&A)

답은 영어로 짧게 하고, 모르는 것은 모른다고 한다.

1. **자기가 올린 문서를 자기가 기록하는 것 아닌가? (self-attestation)**
   > Yes, the publisher records its own document. The point is that it cannot change it afterwards without being caught: the fingerprint and time are fixed on X Layer, and anyone checks them directly over public RPC, not through our server. Whether the prices are right is a separate question; we say so on the page.
2. **왜 테스트넷인가?**
   > The NAV records are test records, so nothing of value depends on them yet. The prices and the xStock balances are real X Layer mainnet data. Moving the registry to mainnet is the first next step.
3. **대회 전과 무엇이 다른가? (기존 프로젝트)**
   > Before the event it was a Korean-won crypto strategy engine on another testnet. Everything in this demo was built during the build period: X Layer settlement, the xStocks basket, verification, the experiment, evidence files and Portfolio. docs/BUILD_PERIOD.md lists every commit.
4. **GMDCORE 소스에 "for GIWA settlement"라고 적혀 있다.**
   > GMDCORE is a share-ledger contract from our earlier settlement work, redeployed to X Layer Testnet. Its supply is zero and it is not part of USTX.
5. **USTX를 살 수 있나?**
   > Yes, from OKX Wallet on X Layer Testnet, with demo dollars that have no value: the USTX contract issues shares at the NAV recorded on X Layer and shows the tokens behind them. Real money would need an issuer, custody and licensing; the issuer page shows that path. We have not started it.
6. **Chainlink Proof of Reserve, DTCC Smart NAV, Centrifuge와 무엇이 다른가?**
   > Proof of Reserve covers asset backing, which we do not. DTCC and Centrifuge put NAV data on chain. What we add is that any visitor can reproduce a basket NAV row by row in their own browser against the X Layer record, see which check catches which edit, and pass the result on as a file anyone can verify.
7. **가격이 틀리면?**
   > Publication gates reject missing, stale or mismatched quotes. A match proves consistency, not price accuracy. A second price source is on our roadmap.
8. **누가 돈을 내나? (비즈니스 모델)**
   > Issuers pay to publish verifiable baskets: a free sandbox today, then a planned per-basket subscription on X Layer mainnet, and a distribution fee on assets raised through licensed partners. This is planned pricing; we do not claim customers.
9. **OKX 생태계에 무엇을 더하나?**
   > It gives xStocks on X Layer a fund product with a price record anyone can check. Any X Layer wallet or app can show that NAV through our open API or a badge that verifies itself in the visitor's browser, and other issuers can launch baskets on the same registry format.
10. **주식 분할이나 종목 변경은?**
    > The methodology page explains constituent and token changes. Corporate actions such as splits and dividends are not modelled yet. That is a stated limitation.
11. **AI를 썼나?**
    > Yes, AI-assisted development tools. We reviewed the work, it has about 250 automated tests (app, contracts and relayer), and we can explain each part.

## 8. 심사 기간 운영 유지 (10/7까지)

- **Cloudflare**
  - `ganymede-xlayer`, `ganymede-settlement-relayer` Worker와 D1 데이터베이스를 지우거나 설정을 바꾸지 않는다.
  - 대시보드에서 변수나 비밀값을 건드리지 않는다.
- **OKX OnchainOS API 키**
  - OKX 문서에 따르면 trial 키는 초당 1회 요청까지 쓸 수 있고, 키 생성 후 60일 동안 유효하다. OKX 개발자 포털에서 키를 만든 날짜를 확인한다. 9월 하순에 만들었다면 심사 기간(10/7)을 넘긴다.
  - 키가 만료되면 새 기록이 멈춘다. 화면은 마지막 기록을 보여 준다.
  - OKX 쪽 요청 제한기가 가끔 HTTP 429를 준다. 이때는 10~15분 동안 기록이 비었다가 저절로 다시 기록된다.
    - 확인된 것은 9/24 14:20과 14:35 UTC 두 번이다. 12:35와 12:45 UTC에도 기록이 하나씩 빠졌지만, 원인은 남아 있지 않다. 00:00~12:30 UTC에는 빠진 기록이 없었다.
    - 원인은 확인하지 못했다. 마감이 다가와 같은 API를 쓰는 팀이 늘었을 가능성이 있다.
    - 그동안에도 화면은 직전 기록을 "Last recorded on X Layer"로 보여 주고, Transparency는 그 기록으로 "NAV verified on X Layer"를 보여 준다. Methodology 화면에도 "공급자 한도 등으로 공시가 늦어질 수 있다"고 적혀 있다.
    - 재시도하지 않고 기다리는 것은 코드 검토 때 정한 설계라서 마감 전에는 바꾸지 않는다.
- **Cloudflare D1 무료 한도**
  - 하루(00:00 UTC 기준) 쓰기 한도는 10만 행이다. 9/24 기준 최근 24시간에 약 3.4만 행을 써서 여유가 약 3배다.
  - 9/23 12:26~24:00 UTC의 11시간 반 기록 공백은 이 한도를 넘었기 때문이었다. 요청마다 쓰던 코드를 그날 고쳤다.
- **relayer 서명 지갑**
  - 테스트넷 OKB 잔액은 9/25 10:50 UTC에 0.0979였다. 하루 약 0.001씩 줄어 10/7을 넉넉히 넘긴다. 키퍼 지갑은 0.00998로, 차익거래 한 번에 0.000003이 든다.
  - 실자금이 아니고 채울 필요가 없다.
- **문제가 생기면**: 사이트가 안 열리거나 초록 표시가 오래 안 뜨면, 화면 캡처와 시각을 Claude에게 보낸다. 되돌릴 이전 버전 ID는 `docs/PRODUCT_RELEASE.md`에 있다.
- **바꾸지 않을 것**: 제출 뒤에는 새 기능을 배포하지 않는다. 심사자는 제출 시점의 제품을 본다.
