# Ganymede 제출 체크리스트

비공개 개발 저장소 전용 문서다. 공개 스냅샷에는 넣지 않는다(`SUBMISSION_EXPORT.md`의 제외 목록).

작성 시점: 2026-09-24 14:30 UTC (9/24 목 23:30 KST).

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

- **운영**: Markets → USTX → Verify(브라우저 자동 검증, 변조 실험 3종, 증거 파일) → Portfolio(X Layer 메인넷 xStocks 잔고 평가·계산기)가 모두 동작한다.
- **최종 확인** (9/24 14:16 UTC, Worker `cabd72ed`):
  - 9개 화면이 200을 반환하고, 이전 경로 이동이 정상이다.
  - axe 접근성 위반 0건.
  - 증거 파일 재확인 PASS.
- **테스트**: 앱 111개와 relayer 16개가 통과했고, lint 오류는 0이다.
- **공시 기록**: 9/23 11:15 UTC부터 5분마다 USTX NAV를 X Layer Testnet에 기록하고 있다. 9/24 14:30 UTC까지 185건이 확정됐다. 차트는 첫 공시부터 모든 기록을 보여 준다.
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
  - https://ganymede-xlayer.gana003.workers.dev/portfolio 에서 **Connect wallet**을 누른다(OKX Wallet 또는 MetaMask 확장 프로그램).
  - 정상: 주소 공유 요청만 뜨고 서명·송금 요청은 없다. 승인하면 주소가 보이고 X Layer 메인넷 잔고를 읽는다. xStocks가 없으면 "This address holds none of the six xStocks on X Layer."가 나온다. 지갑이 다른 네트워크에 있어도 된다.
  - 이상하면 화면을 캡처해서 Claude에게 보낸다. 실제 지갑 확장 프로그램 연결은 개발 쪽에서 끝까지 검증하지 못했다.
- [ ] **3. 데모 영상 제작 (필수, 2~3시간)**: 4절 대본과 5절 녹화 방법을 따른다. 길이는 2~4분, 목표 3분.
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
| 실제 사용자·고객·수요 근거 없음 | 사용자 가치·성장성 점수에 약점 | 주장하지 않는다. 가능하면 지인 1~2명에게 보여 주고 받은 반응을 발표에서 말한다 |
| NAV 기록이 X Layer **Testnet** | 메인넷 실사용이 아니라는 지적 가능 | 가격·xStocks 잔고는 메인넷이다. 기록 메인넷 이전은 "다음 단계"로 명시 |
| 가격 출처가 OKX OnchainOS 하나 | 가격 정확성은 증명하지 않음 | 화면과 문서에 "가격이 맞는지는 확인하지 않는다"고 적었다. 두 번째 출처는 다음 단계 |
| 원문 문서는 최근 12건(약 1시간)만 보관 | 오래된 기록은 화면에서 재검증 불가 | 증거 파일을 받아 두면 언제든 재확인된다(명령어가 거래 영수증과 대조) |
| 실제 지갑 확장 프로그램 연결 미검증 | 드물게 연결 버튼 문제가 있을 수 있음 | 2절 2번에서 사용자가 5분 확인. 공개 주소 입력 방식은 검증 완료 |
| OKX AI(에이전트) 연동 없음 | "X Layer and/or OKX AI" 중 X Layer만 사용 | 의도적 선택. Build a Market 트랙 요건은 충족 |
| 컨트랙트 감사 없음 | 보안 신뢰도 | 테스트넷 기록용이며 실자금 경로 없음을 명시 |
| 기존 프로젝트(7월 업비트·GIWA 코드) 기반 | 심사는 빌드 기간 작업만 봄 | `BUILD_PERIOD.md`에 커밋별로 구분. GMDCORE의 "GIWA" 문구도 공개 설명함 |
| 투자·구매 기능 없음 | "마켓" 트랙인데 거래가 없다는 지적 가능 | 규제·수탁 없이 실자금을 받지 않는 것이 원칙. 검증 가능한 NAV가 발행사·투자자 도구라는 점을 강조 |

## 4. 데모 영상 대본 (약 3분)

### 핵심 메시지

"공시된 NAV를 믿으라고 하지 않고, 누구나 자기 브라우저에서 X Layer 기록과 대조해 확인한다."

변조 실험의 세 번째("Keep the same NAV")가 가장 중요한 장면이다. 숫자와 NAV가 모두 같아도 **X Layer에 기록된 지문만** 변조를 잡아낸다는 점을 보여 준다.

### 녹화 전 준비

- **브라우저**: 크롬 새 창(확장 프로그램이 없는 게스트 또는 시크릿 창)을 1920×1080 전체 화면으로 쓴다. 확대 110%, 북마크 바는 숨긴다(Ctrl+Shift+B). 알림은 끈다.
- **미리 열어 둘 탭 4개**
  1. https://ganymede-xlayer.gana003.workers.dev/
  2. https://ganymede-xlayer.gana003.workers.dev/products/ustx
  3. https://ganymede-xlayer.gana003.workers.dev/products/ustx/transparency
  4. https://ganymede-xlayer.gana003.workers.dev/portfolio
- **시각**: 기록은 5분마다(:00, :05 …) 생긴다. 정각 5분 단위에서 약 1분 뒤에 새로고침하고 녹화를 시작하면 최신 기록이 보인다.
- **확인**: 초록색 "Verified in your browser" 표시가 보이는지 확인한다. "Checking the record…"면 몇 초 기다린다.
- **Portfolio 예시 주소**: `0x41dee1855293e4450cd67459047f372d4d818143`
  - xStocks 6종을 모두 소량 보유한 공개 컨트랙트 주소다. 9/24 기준 약 $11로 평가된다.
  - 본인 지갑에 xStocks가 있으면 본인 주소를 써도 된다.
- 장면별로 따로 녹화한 뒤 이어 붙여도 된다(5절).

### 장면별 대본

영어 문장을 천천히 읽는다. 영어 녹음이 어려우면 5절의 "목소리 대안"을 쓴다. 시간은 대략이며, 전체가 3분 안팎이면 된다.

**장면 1 — Markets (0:00~0:20)**
화면: 첫 화면. 제목과 차트, 여섯 종목 비중을 천천히 보여 준다.
> Hi, this is Ganymede, built on X Layer for OKX Dev Day. USTX is a model basket of six tokenized US stocks: the xStocks for Apple, Microsoft, NVIDIA, Amazon, Meta and Tesla. Every five minutes we price them with OKX OnchainOS on X Layer mainnet and record the NAV on X Layer. The xStocks product, the X Layer integration and every screen in this demo were built during the Dev Day build period.

뜻: USTX는 미국 기술주 토큰 6종 모델 바스켓이고, 5분마다 OKX OnchainOS로 가격을 매겨 X Layer에 NAV를 기록한다. 이 데모의 제품·X Layer 연동·모든 화면은 대회 빌드 기간에 만들었다.

기존 프로젝트는 "새로 만든 기능을 보여 주는 데모"를 내야 하므로 마지막 문장을 빼지 않는다. 레지스트리 컨트랙트 코드는 대회 전에 있던 것을 X Layer에 새로 배포했으므로 "컨트랙트를 새로 만들었다"고는 말하지 않는다.

**장면 2 — 문제와 초록 표시 (0:20~0:35)**
화면: 오른쪽 위 "Verified in your browser" 표시에 마우스를 올린다. 차트 아래 "… published records since …" 문구를 보여 준다.
> A published NAV is usually just a number you have to trust. Here, this green check means my own browser has already verified the latest value against the chain. The chart is built from the published records.

뜻: 보통 NAV는 믿어야 하는 숫자일 뿐인데, 여기서는 내 브라우저가 이미 체인과 대조했다.

**장면 3 — USTX 상세와 X Layer 거래 (0:35~0:55)**
화면: USTX 탭. "Latest record"의 Transaction 링크를 눌러 OKX 탐색기에서 거래를 2~3초 보여 준 뒤 돌아온다.
> On the USTX page you see the holdings and the latest record, with its X Layer transaction. Here it is on the OKX explorer. USTX issues no shares. It is a reference value, not something you can buy.

뜻: 최신 기록과 X Layer 거래를 탐색기에서 보여 준다. USTX는 사고팔 수 있는 상품이 아니라 기준값이다.

**장면 4 — Verify 자동 검증 (0:55~1:25)**
화면: Verify 탭. 위의 "The record and calculation match."를 보여 준다. "What a match confirms / What it does not confirm" 상자를 천천히 스크롤한다.
> Verify runs automatically. The browser reads the registry contract directly over public RPC, takes the original composition document, and checks three things. Its SHA-256 fingerprint equals the one on X Layer. Every row adds up to the NAV. And the NAV and time equal the record. The page also says what this does not prove: that the prices are right, that anyone holds the tokens, or that the NAV can be redeemed.

뜻: 브라우저가 레지스트리를 직접 읽고 지문·계산·기록 세 가지를 확인한다. 증명하지 않는 것(가격 정확성, 보유, 환매)도 밝힌다.

**장면 5 — Try to break it (1:25~2:05)** ← 가장 중요
화면: 같은 페이지 아래 "Try to break it". 버튼을 차례로 누르고, 누를 때마다 세 줄 결과(Matches/Fails)를 1~2초 보여 준다.
> Now let's try to break it, on a copy in the browser. Change one price: the row arithmetic and the fingerprint fail. Fix the arithmetic too: the numbers add up, but the NAV no longer matches the chain. Now the hardest case. Raise one price and lower another, so every number and even the NAV stay the same. Only the fingerprint recorded on X Layer catches it. That is why the record lives on chain.

뜻: 가격 하나를 바꾸면 계산과 지문이 실패한다. 계산까지 맞추면 NAV가 체인과 달라진다. NAV까지 같게 맞추면 오직 X Layer의 지문만 잡아낸다. 그래서 체인에 기록한다.

**장면 6 — 증거 파일 (2:05~2:25)**
화면: 위로 올라가 "Download evidence"를 누른다. 다운로드된 파일을 보여 준다. 방법 A를 쓰면 터미널 결과를 보여 준다.
> I can download the whole check as an evidence file and send it to anyone. One command re-checks it and matches it to the NavPublished event in the transaction receipt. Every check passes.

방법 B(터미널 없이)를 쓰면 마지막 두 문장 대신 이렇게 읽는다.
> Anyone can re-check it with one command from our repository.

- 방법 A (터미널, 선택)
  1. Node.js 22 LTS를 설치한다(nodejs.org).
  2. 공개 저장소 페이지에서 Code → Download ZIP을 받아 압축을 푼다.
  3. 그 폴더에서 터미널을 연다. 윈도우는 폴더 주소창에 `cmd` 입력 후 Enter, 맥은 터미널에 `cd `를 입력하고 폴더를 끌어다 놓는다.
  4. `npm ci`를 실행한다(1~3분).
  5. 받은 증거 파일을 그 폴더로 옮긴다.
  6. `npm run verify:evidence -- 파일이름.json`을 실행한다.
  7. 정상 결과: `[PASS]` 줄 다섯 개와 `Result: PASS`.
  - 윈도우 실행은 개발 쪽에서 확인하지 못했다. 막히면 방법 B로 간다.
- 방법 B: 터미널 장면을 빼고, 화면 아래 "Re-check the file anywhere with npm run verify:evidence" 문구를 보여 준다.

**장면 7 — Portfolio (2:25~2:50)**
화면: Portfolio 탭.
1. "Or view any public address" 칸에 예시 주소를 붙여 넣고 View를 누른다.
2. 잔고·가격·가치·비중 표와 합계를 보여 준다.
3. "Download statement" 버튼을 보여 준다.
4. 아래 계산기에서 금액을 1,000에서 5,000으로 바꿔 수량이 변하는 것을 보여 준다.
> Portfolio reads any wallet's six xStock balances on X Layer mainnet and values them at the verified prices. Here is a public address that holds all six. You can download a statement, or size a USTX-weighted basket for any amount. It is read-only: nothing is signed or sent.

뜻: 아무 지갑의 xStocks 6종 잔고를 X Layer 메인넷에서 읽어 검증된 가격으로 평가한다. 읽기 전용이다.

**장면 8 — 마무리 (2:50~3:05)**
화면: Markets로 돌아가거나 Verify의 초록 결과를 보여 준다.
> Prices from OKX OnchainOS, xStocks on X Layer mainnet, and NAV records on X Layer Testnet, all live. Next, we would move the registry to mainnet and let other basket issuers publish the same verifiable format. Ganymede: a NAV anyone can check.

뜻: 모두 실제로 동작 중이다. 다음 단계는 레지스트리 메인넷 이전과 다른 발행사의 같은 형식 사용이다.

### 영상에서 하면 안 되는 말

"투자할 수 있다", "사용자가 있다", "메인넷에 기록한다", "가격이 정확함을 증명한다", "감사받았다". 모두 사실이 아니다. 약관상 허위 주장은 실격 사유다.

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
A tokenized-stock basket NAV that anyone can verify in their own browser against a record on X Layer.
```

**Project description**
```text
Tokenized-stock baskets publish a NAV that holders, analysts and auditors have to take on trust. Ganymede makes that value checkable.

USTX is a model basket of six xStocks (AAPLx, MSFTx, NVDAx, AMZNx, METAx, TSLAx). Every five minutes it is priced through the OKX OnchainOS Market API on X Layer mainnet, and the NAV plus a SHA-256 fingerprint of the full composition document is recorded by our GanymedeNavRegistry contract on X Layer Testnet.

- Verify: the visitor's browser reads the registry directly over public RPC, hashes the original document and recalculates every row with integer arithmetic. The page also states what a match does not prove (price accuracy, custody, redemption).
- Try to break it: three edits to a local copy show which check catches which change. When two prices are offset so that every number and the NAV stay the same, only the fingerprint recorded on X Layer detects the edit.
- Evidence: the check downloads as a file. `npm run verify:evidence` re-checks it and matches it to the NavPublished event in the publishing transaction's receipt.
- Portfolio: reads any wallet's six xStock balances on X Layer mainnet at one block and values them at the verified prices, with a downloadable statement and a USTX-weighted basket calculator. Read-only.

USTX issues no shares and holds no assets. No investment, custody or redemption is offered.
```

**Intended users**
```text
Issuers and operators of tokenized-stock baskets who need to publish a value that others can check, and the investors, analysts and auditors who review it.
```

**X Layer / OKX integration**
```text
- OKX OnchainOS Market API: signed price requests for the six xStock tokens on X Layer mainnet (chain 196). These prices are the inputs of every NAV.
- X Layer mainnet: the browser reads the six pinned xStock contracts (code, symbol, decimals) and any wallet's balances.
- X Layer Testnet (chain 1952): GanymedeNavRegistry stores each NAV, effective time and composition fingerprint and emits NavPublished. A USTX record has been published about every five minutes since 23 Sep 2026 11:15 UTC (182 confirmed by 24 Sep 14:05 UTC).
```

**Contract addresses and technical links**
```text
GanymedeNavRegistry (X Layer Testnet, 1952): 0xf320d2a7f280b7ab61e24374986869d7be34289c
https://web3.okx.com/explorer/x-layer-testnet/address/0xf320d2a7f280b7ab61e24374986869d7be34289c

xStock tokens read on X Layer mainnet (196), issued by xStocks, not by us:
AAPLx 0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a
MSFTx 0x5621737f42dae558b81269fcb9e9e70c19aa6b35
NVDAx 0xc845b2894dbddd03858fd2d643b4ef725fe0849d
AMZNx 0x3557ba345b01efa20a1bddc61f573bfd87195081
METAx 0x96702be57cd9777f835117a809c7124fe4ec989a
TSLAx 0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0

Legacy GMDCORE test share ledger (X Layer Testnet, supply 0, not part of USTX): 0x68c4e8c904b3eddb1146ef52a76a0a2755a55b59

Public API: https://ganymede-xlayer.gana003.workers.dev/api/xstocks
```

**Existing project and new work** (기존 프로젝트 여부를 묻는 칸)
```text
Ganymede existed before the event as a Korean-won crypto strategy engine with Upbit market data and settlement on the GIWA Sepolia testnet (last pre-event commit 7a33392, 30 July 2026). During the build period (from 23 September) we moved settlement to X Layer and built the tokenized-stock product: the xStocks basket with OnchainOS pricing, NAV publication to the X Layer registry, browser verification, the tamper experiment, evidence files, the X Layer mainnet Portfolio and the NAV chart. Every build-period commit with times and line counts: docs/BUILD_PERIOD.md. Summary: docs/OKX_DEV_DAY.md.
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
   > No. USTX is a model basket and a reference value. Issuing a real basket token would need an issuer, custody and a legal structure. We have not started that.
6. **Chainlink Proof of Reserve, DTCC Smart NAV, Centrifuge와 무엇이 다른가?**
   > Proof of Reserve covers asset backing, which we do not. DTCC and Centrifuge put NAV data on chain. What we add is that any visitor can reproduce a basket NAV row by row in their own browser against the X Layer record, see which check catches which edit, and pass the result on as a file anyone can verify.
7. **가격이 틀리면?**
   > Publication gates reject missing, stale or mismatched quotes. A match proves consistency, not price accuracy. A second price source is on our roadmap.
8. **누가 돈을 내나? (비즈니스 모델)**
   > Issuers and operators of tokenized baskets who need a value others can check. This is a proposed direction; we do not claim customers.
9. **OKX 생태계에 무엇을 더하나?**
   > It gives xStocks on X Layer a price record that anyone can check, plus a reusable registry format and verifier that other basket operators, or a wallet showing portfolio values, could use.
10. **주식 분할이나 종목 변경은?**
    > The methodology page explains constituent and token changes. Corporate actions such as splits and dividends are not modelled yet. That is a stated limitation.
11. **AI를 썼나?**
    > Yes, AI-assisted development tools. We reviewed the work, it has 111 automated tests, and we can explain each part.

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
    - 그동안에도 화면은 직전 기록으로 "The record and calculation match."를 보여 준다. Methodology 화면에도 "공급자 한도 등으로 공시가 늦어질 수 있다"고 적혀 있다.
    - 재시도하지 않고 기다리는 것은 코드 검토 때 정한 설계라서 마감 전에는 바꾸지 않는다.
- **Cloudflare D1 무료 한도**
  - 하루(00:00 UTC 기준) 쓰기 한도는 10만 행이다. 9/24 기준 최근 24시간에 약 3.4만 행을 써서 여유가 약 3배다.
  - 9/23 12:26~24:00 UTC의 11시간 반 기록 공백은 이 한도를 넘었기 때문이었다. 요청마다 쓰던 코드를 그날 고쳤다.
- **relayer 서명 지갑**
  - 테스트넷 OKB 잔액은 약 0.0989로, 지금 속도면 약 250일 쓸 수 있다.
  - 실자금이 아니고 채울 필요가 없다.
- **문제가 생기면**: 사이트가 안 열리거나 초록 표시가 오래 안 뜨면, 화면 캡처와 시각을 Claude에게 보낸다. 되돌릴 이전 버전 ID는 `docs/PRODUCT_RELEASE.md`에 있다.
- **바꾸지 않을 것**: 제출 뒤에는 새 기능을 배포하지 않는다. 심사자는 제출 시점의 제품을 본다.
