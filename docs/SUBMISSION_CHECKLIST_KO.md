# Ganymede 제출 체크리스트

비공개 개발 저장소 전용 문서다. 공개 스냅샷에는 넣지 않는다(`SUBMISSION_EXPORT.md`의 제외 목록).

작성 시점: 2026-09-25 01:50 UTC (9/25 금 10:50 KST).

## 1. 한눈에 보기

| 항목 | 상태 |
| --- | --- |
| 제출 마감 | **2026-09-25 23:59 UTC = 9/26(토) 08:59 KST** |
| 권장 제출 시각 | **9/25(금) 22:00 KST까지.** 마감 직전의 양식 오류나 링크 문제에 대비한다 |
| 제품 링크 | https://ganymede-xlayer.gana003.workers.dev/ (운영 중) |
| 공개 저장소 | https://github.com/mycyi1994-hash/project-ganymede-submission (운영 소스와 동기화됨) |
| 데모 영상 | **없음. 사용자가 만든다** (아래 4·5절) |
| 제출 양식 | https://forms.gle/81S2gnFCzqSoeDEA7 (**사용자가 작성**, 6절 문구 사용) |
| 개발 | 제출 가능한 상태로 완료. 9/25 12:00 KST 이후에는 버그 수정만 한다 |

### 개발 쪽에서 끝난 것

- **운영**: 펀드 판매 사이트처럼 동작한다.
  - **지갑 투자(X Layer Testnet)**: OKX Wallet 연결 → 데모 달러(dUSD, 가치 없음) 받기 → 승인 → 투자·환매. USTX 계약(`0x77eaeba1366bde7818da12d3cbdbea0a2ee97596`)이 X Layer에 기록된 NAV로만 USTX를 발행해 지갑에 넣는다. 지갑이 없으면 Demo balance 탭으로 같은 흐름을 체험한다
  - Markets(펀드 규모·투자자·출시 후 수익률) → USTX에서 데모 달러로 투자 → 체결 화면에 "Added to your basket"(6개 xStock별 토큰 수량·금액) → Portfolio(총평가액·수익률·"Inside your USTX" 들여다보기·주문 내역)
  - USTX 펀드 개요: 펀드 규모(X Layer에 기록된 발행 좌수 × NAV), 투자자 수, 24시간 순유입, 수익률, 핵심 조건, 전체 지분의 종목별 보유
  - Transparency: 고객용 증명 페이지(거래소 준비금 증명 형식). 검증 결과, 가격 산정 3단계, 구성 종목과 OKX 가격, 최근 기록과 OKX 탐색기 링크
  - 개발자 페이지 "Verify it yourself": 3가지 확인, 변조 실험 3종, 증거 파일, 원문 문서
  - 모든 숫자에 출처 표시: "Priced by OKX OnchainOS", "OKX price", "OKX Explorer", "Connect OKX Wallet"
  - Portfolio 아래 실제 지갑 xStocks 평가(OKX Wallet 연결 또는 주소 입력)
  - 화면 배치는 실제 서비스처럼 정리했다: 헤더에 테스트넷 안내 한 줄·네트워크·"Connect OKX Wallet", 메뉴 Markets / Portfolio / Transparency. 발표용 설명 구역은 없앴고, 개발자·발행사 자료는 푸터(Docs, For issuers)로 옮겼다
  - 파트너용: 공개 NAV API(`/api/v1/ustx`), 다른 사이트에 붙이는 검증 배지(`/embed/ustx`), 발행사 페이지(`/issuers`, 요금제), 개발자 페이지(`/developers`)
- **최종 확인** (9/25, Worker `f760cd9e`, 지갑 투자 배포): 데스크톱·모바일, 지갑 있음·없음으로 7개 화면 axe 위반 0건, 가로 넘침·페이지 오류 없음, 화면·API 정상. 아래는 이전 배포(9/24 18:38 UTC, `bebf23c3`) 때의 확인 내용이다.
  - 11개 화면과 공개 API 3개가 200을 반환하고, 이전 경로 이동이 정상이다.
  - axe 접근성 위반 0건(11개 화면).
  - 운영 사이트에서 $250 데모 매수 → 바스켓 6종목 표시 → 포트폴리오 반영까지 확인했다.
  - 배포 뒤 첫 기록(18:35 UTC)에 발행 좌수가 X Layer에 올라간 것을 확인했다.
- **테스트**: 앱 135개, relayer 28개, 컨트랙트 60개가 통과했고, lint 오류는 0이다.
- **공시 기록**: 9/23 11:15 UTC부터 5분마다 USTX NAV를 X Layer Testnet에 기록하고 있다. 9/24 18:40 UTC까지 216건이 확정됐다. 차트는 첫 공시부터 모든 기록을 보여 준다.
- **공개 저장소**: README, 빌드 기간 작업 목록(`docs/BUILD_PERIOD.md`), 출처 기록(`docs/BUILD_EVIDENCE.md`)을 갖췄다. 비밀값 검사를 통과했다.

## 2. 사용자가 해야 할 일 (순서대로)

- [ ] **1. 참가 정보 확정 (필수, 10분)**
  - 팀 이름, 멤버(최대 4명, 1인 참가 가능), 프로젝트 이름(Ganymede), 트랙(**Build a Market**), 참가 경로를 정한다.
  - 참가 경로
    - 합격 때 이미 정했다면 그대로 쓴다.
    - 아직이면 둘 중 하나를 고른다.
      - **Singapore finale**: 상금 대부분이 여기 있다. 선정되면 싱가포르에서 직접 라이브 데모를 한다. 날짜는 키트에 10/7, 약관에 10/6으로 서로 다르다.
      - **Remote Build**: 이동 없이 Best Remote Demo 상(총 US$15,000)으로 따로 심사받는다.
    - 싱가포르에 갈 수 있고 영어로 발표할 수 있으면 finale, 아니면 Remote Build를 고른다. **본인만 결정할 수 있다.**
  - 멤버가 바뀌었으면 키트 안내대로 yanyi.ho@okg.com에 알린다.
- [ ] **2. (권장, 5분) 본인 지갑으로 Portfolio 연결 한 번 해 보기**
  - https://ganymede-xlayer.gana003.workers.dev/portfolio 에서 오른쪽 위 **Connect OKX Wallet**을 누른다(OKX Wallet 또는 MetaMask 확장 프로그램).
  - 정상: 주소 공유 요청만 뜨고 서명·송금 요청은 없다. 승인하면 주소가 보이고 X Layer 메인넷 잔고를 읽는다. xStocks가 없으면 "This address holds none of the six xStocks on X Layer."가 나온다. 지갑이 다른 네트워크에 있어도 된다.
  - 이상하면 화면을 캡처해서 Claude에게 보낸다. 실제 지갑 확장 프로그램 연결은 개발 쪽에서 끝까지 검증하지 못했다.
- [ ] **2-1. (권장, 1분) 데모 투자 한 번 해 보기**
  - https://ganymede-xlayer.gana003.workers.dev/products/ustx 에서 Invest → $250 → Review investment → Buy with demo dollars.
  - 정상: "Order filled"와 "Added to your basket" 아래에 애플·마이크로소프트 등 6종목의 토큰 수량과 금액이 나온다. Portfolio에서 총평가액과 "Inside your USTX"가 보인다.
  - 계정은 이 브라우저에만 있다. Portfolio의 주문 내역(Recent orders) 아래 "Reset demo balance"로 $10,000부터 다시 시작할 수 있다.
- [ ] **3. 데모 영상 제작 (필수, 2~3시간)**: 4절 대본과 5절 녹화 방법을 따른다. 길이는 2~4분, 목표 3분. 외주를 맡겼다면 영상 지시서 문서 링크를 전달한다.
- [ ] **4. 영상 업로드 (필수, 20분)**
  - YouTube에 "공개" 또는 "일부 공개"로 올린다. **"비공개"는 안 된다.**
  - 로그아웃한 시크릿 창에서 재생되는지 확인한다.
- [ ] **5. 제출 양식 작성·제출 (필수, 30분)**
  - https://forms.gle/81S2gnFCzqSoeDEA7 에 6절 문구를 붙여 넣는다.
  - 마지막의 확인(Declaration)은 내용이 정확한지 본인이 확인한 뒤에 체크한다.
- [ ] **6. 제출 후 (필수)**
  - 접수 확인 이메일(submission receipt)이 오는지 본다.
  - 누락이나 링크 문제 연락(이메일 또는 텔레그램)이 오면 **24시간 안에** 답한다. 9/30까지 검증 기간이다.
- [ ] **7. 결선 날짜 문의 (finale 경로일 때)**: 비공개 텔레그램 그룹에서 10/6과 10/7 중 어느 날인지 확인한다.
- [ ] **8. 자격 확인**
  - 만 18세 이상이고 제한 대상자가 아니어야 한다.
  - 주최 측이 신원 확인을 요청할 수 있다.
  - 상금 수령 지갑은 수상 후 주최 측 안내에 따라 본인이 준비한다. 제재 명단 검사 대상이다.
- [ ] **9. 발표 준비 (권장)**: 7절 질의응답을 소리 내어 한 번 연습한다.
- [ ] **10. (선택, 1분) 공개 저장소 Website 칸**
  - GitHub의 `project-ganymede-submission` 페이지에서 오른쪽 About 옆 톱니바퀴를 누른다.
  - Website에 제품 링크를 넣는다.
- [ ] **11. 심사가 끝날 때까지(10/7) 운영 유지**: 8절 참고.

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

## 4. 데모 영상 대본 (약 3분)

### 핵심 메시지

"토큰화된 미국 기술주 6종을 한 번에 담는 펀드를 사고(데모 달러), 내 돈이 바스켓에 무엇으로 담겼는지 보고, 그 가격이 맞는지 내 브라우저에서 X Layer 기록과 직접 대조한다."

가장 중요한 장면은 두 개다.
1. **투자 직후 "Added to your basket"**: 내 돈이 6개 xStock 토큰으로 담긴 모습.
2. **변조 실험의 세 번째("Keep the same NAV")**: 숫자와 NAV가 모두 같아도 **X Layer에 기록된 지문만** 변조를 잡아낸다.

### 녹화 전 준비

- **브라우저**: 크롬 새 창(확장 프로그램이 없는 게스트 또는 시크릿 창)을 1920×1080 전체 화면으로 쓴다. 확대 110%, 북마크 바는 숨긴다(Ctrl+Shift+B). 알림은 끈다. 시크릿 창이면 데모 계정이 $10,000로 새로 시작한다.
- **미리 열어 둘 탭 5개**
  1. https://ganymede-xlayer.gana003.workers.dev/
  2. https://ganymede-xlayer.gana003.workers.dev/products/ustx
  3. https://ganymede-xlayer.gana003.workers.dev/portfolio
  4. https://ganymede-xlayer.gana003.workers.dev/products/ustx/transparency
  5. https://ganymede-xlayer.gana003.workers.dev/developers#verify
- **시각**: 기록은 5분마다(:00, :05 …) 생긴다. 정각 5분 단위에서 약 1분 뒤에 새로고침하고 녹화를 시작하면 최신 기록이 보인다. 주문은 1시간 이내 기록으로만 체결되므로 "Published record delayed"가 오래 떠 있으면 몇 분 뒤에 찍는다.
- **확인**: 초록색 "Verified in your browser" 표시가 보이는지 확인한다. "Checking the record…"면 몇 초 기다린다.
- **Portfolio 예시 주소(선택)**: `0x41dee1855293e4450cd67459047f372d4d818143`. xStocks 6종을 모두 소량 보유한 공개 컨트랙트 주소다.
- 장면별로 따로 녹화한 뒤 이어 붙여도 된다(5절).

### 장면별 대본

영어 문장을 천천히 읽는다. 영어 녹음이 어려우면 5절의 "목소리 대안"을 쓴다. 전체가 3분 안팎이면 된다.

**장면 1 — Markets (0:00~0:20)**
화면: 첫 화면. 제목, NAV, Fund size·Investors·Since launch, 차트, 오른쪽 여섯 종목을 천천히 보여 준다.
> This is Ganymede, built on X Layer for OKX Dev Day. USTX, the US Tech Basket, puts Apple, Microsoft, NVIDIA, Amazon, Meta and Tesla in one share, through their xStocks on X Layer. It is priced by OKX OnchainOS every five minutes, and every price is recorded on X Layer. Everything you see was built during the Dev Day build period.

뜻: USTX는 미국 기술주 6종을 한 좌에 담은 바스켓이다. 5분마다 OKX OnchainOS로 가격을 매기고 모든 가격을 X Layer에 기록한다. 화면의 모든 것은 빌드 기간에 만들었다.

**장면 2 — 투자하고 바스켓 보기 (0:20~0:55)** ← 핵심 장면 1
화면: USTX 탭. 오른쪽 "Invest in USTX" 패널에서 $1,000 → Review investment → Buy with demo dollars. "Added to your basket" 목록을 3초 이상 보여 준다.
> Let's invest a thousand demo dollars. I review the order, and it fills instantly at the NAV recorded on X Layer. And here is what my money bought: this much Apple, Microsoft, NVIDIA, Amazon, Meta and Tesla, token by token. This is a demo with demo dollars, so no real money moves.

뜻: 데모 달러 $1,000를 투자하면 X Layer에 기록된 NAV로 즉시 체결되고, 내 돈이 6종목 토큰으로 얼마씩 담겼는지 바로 보인다. 데모 달러라 실제 돈은 움직이지 않는다.

**장면 3 — 펀드 개요 (0:55~1:15)**
화면: 같은 페이지 "Fund overview". Fund size 설명 문구("shares outstanding, recorded on X Layer")에 마우스를 올린다. "Net flows, 24h"와 아래 "Holdings" 표를 스크롤한다.
> Like any fund page, you get the fund size, the return since launch and the key terms. The shares outstanding are recorded on X Layer with every NAV, so even the fund size is checkable. Below, you see the last day's flows and what all shares hold in each xStock.

뜻: 펀드 규모·수익률·핵심 조건이 있고, 발행 좌수도 NAV와 함께 X Layer에 기록되므로 펀드 규모까지 확인할 수 있다. 최근 24시간 유입과 전체 지분이 종목별로 무엇을 보유하는지가 보인다.

**장면 4 — Portfolio (1:15~1:35)**
화면: Portfolio 탭. 총평가액과 수익률, "Inside your USTX" 표, 주문 내역을 보여 준다. (선택) 아래 "Or view any public address"에 예시 주소를 넣고 View.
> My portfolio shows the total value, my return, and inside my USTX: the tokens my shares hold, valued at the recorded prices. Below, I can connect OKX Wallet or paste any address to value real xStocks on X Layer mainnet, read-only.

뜻: 포트폴리오에 총평가액·수익률과 내 지분이 담은 토큰이 보인다. 아래에서 OKX Wallet 연결이나 주소 입력으로 X Layer 메인넷의 실제 xStocks를 읽기 전용으로 평가한다.

**장면 5 — Transparency 증명 페이지 (1:35~1:55)**
화면: 메뉴 Transparency(탭 4). 위의 초록 "NAV verified on X Layer"와 "Priced by OKX OnchainOS" 표시 → 1·2·3 단계 카드 → "View on OKX Explorer"를 눌러 탐색기에서 2~3초.
> But why trust the price? Every price is set by OKX OnchainOS and recorded on X Layer, and my browser checks that record automatically. Here it is on the OKX explorer.

뜻: 가격을 왜 믿어야 하나? 모든 가격은 OKX OnchainOS가 매기고 X Layer에 기록되며, 내 브라우저가 그 기록을 자동으로 확인한다. OKX 탐색기에서 보면 이렇다.

**장면 6 — Try to break it (1:55~2:30)** ← 핵심 장면 2
화면: 개발자 페이지(탭 5)의 "Verify it yourself" → 아래 "Try to break it". 버튼을 차례로 누르고, 누를 때마다 세 줄 결과(Matches/Fails)를 1~2초 보여 준다.
> For developers, here is the check behind it, on a copy in the browser. Change one price: the arithmetic and the fingerprint fail. Fix the arithmetic: the NAV no longer matches the chain. Now offset two prices so every number and even the NAV stay the same. Only the fingerprint recorded on X Layer catches it. The whole check downloads as an evidence file anyone can re-check with one command.

뜻: 개발자용으로 그 뒤의 확인을 브라우저 속 사본으로 보여 준다. 가격 하나를 바꾸면 계산과 지문이 실패하고, 계산까지 맞추면 NAV가 체인과 달라지고, NAV까지 같게 맞추면 오직 X Layer의 지문만 잡아낸다. 전체 검증은 증거 파일로 내려받아 명령 하나로 다시 확인할 수 있다.

**장면 7 — 생태계 (2:30~2:50)**
화면: Developers 탭(푸터의 Docs). "Embed the verified NAV badge"의 Live preview(초록 Verified 배지)와 API 예시를 보여 준다. 이어서 푸터의 "For issuers"를 눌러 Plans를 2~3초 보여 준다.
> Other apps on X Layer can show this verified NAV: a public API, and a badge that verifies itself in the visitor's browser. And issuers can launch their own baskets on the same rails.

뜻: X Layer의 다른 앱도 공개 API와 방문자 브라우저에서 스스로 검증하는 배지로 이 NAV를 쓸 수 있고, 발행사는 같은 구조로 자기 바스켓을 낼 수 있다.

**장면 8 — 마무리 (2:50~3:05)**
화면: Markets로 돌아가 초록 "Verified in your browser"를 보여 준다.
> Priced by OKX OnchainOS, recorded on X Layer, verified by you. Ganymede: a fund you can check.

### 영상에서 하면 안 되는 말

- "실제 돈으로 투자할 수 있다" → 항상 "demo dollars"라고 말한다.
- "투자자가 N명 있다", "사용자가 있다" → Investors 숫자는 데모 계정 수다.
- "메인넷에 기록한다" → 기록은 X Layer **Testnet**, 가격과 xStocks는 메인넷이다.
- "가격이 정확함을 증명한다", "감사받았다", "요금을 받고 있다"(요금제는 문의만 받는다).
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
3. 제목: `Ganymede — Verifiable NAV for tokenized stocks on X Layer (OKX Dev Day 2026)`
4. 설명: 제품 링크와 공개 저장소 링크를 붙여 넣는다.
5. 시청자층: "아니요, 아동용이 아닙니다".
6. 공개 상태: **공개** 또는 **일부 공개**. 비공개는 심사자가 볼 수 없다.
7. 게시한 뒤 링크를 복사하고, **로그아웃한 시크릿 창에서 재생되는지** 확인한다.

## 6. 제출 양식에 넣을 문구 (영어, 복사해서 사용)

양식의 실제 항목 이름은 열어 봐야 안다. 키트에 적힌 항목 기준으로 준비했다. 대괄호 부분은 사용자가 채운다.

**Team name / Members**: [팀 이름] / [이름(들)]

**Project name**: Ganymede

**Primary track**: Build a Market

**Participation route**: [Singapore finale 또는 Remote Build]

**One-line summary**
```text
A tokenized US tech stock fund on X Layer: invest with demo dollars, see the xStocks behind every share, and verify every NAV in your own browser against its X Layer record.
```

**Project description**
```text
Tokenized-stock baskets publish a NAV that investors have to take on trust. Ganymede sells a basket whose every price is checkable.

USTX, the US Tech Basket, holds six xStocks in one share (AAPLx, MSFTx, NVDAx, AMZNx, METAx, TSLAx). Every five minutes it is priced through the OKX OnchainOS Market API on X Layer mainnet, and the NAV, the shares outstanding and a SHA-256 fingerprint of the full composition document are recorded by our GanymedeNavRegistry contract on X Layer Testnet.

- Invest: connect OKX Wallet, get demo dollars (dUSD, no value) on X Layer Testnet, and invest or redeem through the USTX contract, which issues shares only at the NAV recorded in the registry and puts them in the wallet. Without a wallet, a private demo balance of $10,000 fills orders the same way, off chain. The confirmation shows exactly which tokens the money put in the basket, and Portfolio looks each holding through to the six xStocks.
- Fund overview: fund size (shares outstanding x NAV, both recorded on X Layer), investors, return since launch, key terms, 24-hour flows and look-through holdings of all shares. Single orders are never published.
- Transparency: a customer proof page, like an exchange proof of reserves. The visitor's browser reads the registry directly over public RPC, hashes the original document and recalculates every row with integer arithmetic; every price is labelled as coming from OKX OnchainOS. The page also states what a match does not prove (price accuracy, custody).
- Verify it yourself (developer page): the individual checks, and three edits to a local copy that show which check catches which change. When two prices are offset so that every number and the NAV stay the same, only the fingerprint recorded on X Layer detects the edit.
- Evidence: the check downloads as a file. `npm run verify:evidence` re-checks it and matches it to the NavPublished event in the publishing transaction's receipt.
- Wallets: Portfolio shows the wallet's USTX on X Layer Testnet and values its real xStock balances on X Layer mainnet at the verified prices, with a downloadable statement.
- Partners: a public NAV API with open CORS (/api/v1/ustx) and an embeddable badge that verifies the NAV in the visitor's browser (/embed/ustx). An issuer page sets out the plans, with a free sandbox on X Layer Testnet today, and a developer page documents the API, the badge and the checks.

Investing uses demo dollars with no value: no real money moves and nothing is held in custody, and USTX on X Layer Testnet carries no rights.
```

**Intended users**
```text
Investors who want diversified exposure to tokenized US stocks with prices they can check; issuers of tokenized-stock baskets who need to publish a value others can verify; wallets and apps on X Layer that want to show a verified NAV.
```

**X Layer / OKX integration**
```text
- OKX OnchainOS Market API: signed price requests for the six xStock tokens on X Layer mainnet (chain 196). These prices are the inputs of every NAV.
- X Layer mainnet: the browser reads the six pinned xStock contracts (code, symbol, decimals) and any wallet's balances.
- X Layer Testnet (chain 1952): GanymedeNavRegistry stores each NAV, the shares outstanding, the effective time and the composition fingerprint and emits NavPublished. A USTX record has been published about every five minutes since 23 Sep 2026 11:15 UTC (216 confirmed by 24 Sep 18:40 UTC).
- X Layer Testnet: GanymedeBasketFund (USTX) issues and redeems shares only at the registry's latest NAV, paid in no-value demo dollars (GanymedeDemoDollar); wallets invest through it from the USTX page.
- X Layer Testnet: GanymedeNavFeed serves the USTX NAV through the Chainlink AggregatorV3Interface (8 decimals), so other X Layer contracts can read it without custom code.
- X Layer Testnet: USTX trades on a USTX/dUSD pool (GanymedeUstxPool), and GanymedeNavArbitrage closes the pool's gap to the NAV through the fund in one transaction, like ETF creation and redemption; a keeper checks every five minutes and runs it when closing the gap earns at least a cent, and the USTX page shows the market price and its premium or discount.
- OKX Wallet: signs the claim, approve, invest and redeem transactions on X Layer Testnet from the USTX page; Portfolio reads its balances.
- Public NAV API and embeddable badge: other X Layer apps can read or show the verified NAV.
```

**Contract addresses and technical links**
```text
GanymedeNavRegistry (X Layer Testnet, 1952): 0xf320d2a7f280b7ab61e24374986869d7be34289c
GanymedeBasketFund, the USTX share token (X Layer Testnet): 0x77eaeba1366bde7818da12d3cbdbea0a2ee97596
GanymedeDemoDollar, dUSD demo dollars with no value (X Layer Testnet): 0xf07535080f74e8b0f571e58dfa600f47e72ea9bf
GanymedeNavFeed, the USTX / USD NAV in the Chainlink AggregatorV3Interface (X Layer Testnet): 0x292c56c5290cc7b73e3ee33c2c2688eb3e04c3c8
GanymedeUstxPool, the USTX/dUSD market (X Layer Testnet): 0x286f5e7ffdbc30db12665d7a3854217d7cd05cc1
GanymedeNavArbitrage, one-transaction NAV arbitrage (X Layer Testnet): 0xaeba15aa92d6f3109e2b992f18933e1abe2fa3d9
https://web3.okx.com/explorer/x-layer-testnet/address/0xf320d2a7f280b7ab61e24374986869d7be34289c

xStock tokens read on X Layer mainnet (196), issued by xStocks, not by us:
AAPLx 0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a
MSFTx 0x5621737f42dae558b81269fcb9e9e70c19aa6b35
NVDAx 0xc845b2894dbddd03858fd2d643b4ef725fe0849d
AMZNx 0x3557ba345b01efa20a1bddc61f573bfd87195081
METAx 0x96702be57cd9777f835117a809c7124fe4ec989a
TSLAx 0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0

Legacy GMDCORE test share ledger (X Layer Testnet, supply 0, not part of USTX): 0x68c4e8c904b3eddb1146ef52a76a0a2755a55b59

Public NAV API: https://ganymede-xlayer.gana003.workers.dev/api/v1/ustx
Embeddable badge: https://ganymede-xlayer.gana003.workers.dev/embed/ustx
Market snapshot: https://ganymede-xlayer.gana003.workers.dev/api/xstocks
```

**Existing project and new work** (기존 프로젝트 여부를 묻는 칸)
```text
Ganymede existed before the event as a Korean-won crypto strategy engine with Upbit market data and settlement on the GIWA Sepolia testnet (last pre-event commit 7a33392, 30 July 2026). During the build period (from 23 September) we moved settlement to X Layer and built the tokenized-stock product: the xStocks basket with OnchainOS pricing, wallet investing through a USTX share contract on X Layer Testnet, NAV and shares-outstanding publication to the X Layer registry, demo investing with look-through holdings, the fund overview, browser verification, the tamper experiment, evidence files, the X Layer mainnet Portfolio, the NAV chart, the public NAV API, the embeddable badge and the issuer and developer pages. Every build-period commit with times and line counts: docs/BUILD_PERIOD.md. Summary: docs/OKX_DEV_DAY.md.
```

**Repository**: https://github.com/mycyi1994-hash/project-ganymede-submission

**Product link**: https://ganymede-xlayer.gana003.workers.dev/

**Demo video**: [YouTube 링크]

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
    > Yes, AI-assisted development tools. We reviewed the work, it has more than 170 automated tests, and we can explain each part.

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
  - 테스트넷 OKB 잔액은 약 0.0989로, 지금 속도면 약 250일 쓸 수 있다.
  - 실자금이 아니고 채울 필요가 없다.
- **문제가 생기면**: 사이트가 안 열리거나 초록 표시가 오래 안 뜨면, 화면 캡처와 시각을 Claude에게 보낸다. 되돌릴 이전 버전 ID는 `docs/PRODUCT_RELEASE.md`에 있다.
- **바꾸지 않을 것**: 제출 뒤에는 새 기능을 배포하지 않는다. 심사자는 제출 시점의 제품을 본다.
