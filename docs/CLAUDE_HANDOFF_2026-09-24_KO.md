# Ganymede — Codex 작업 전체 인계

작성: 2026-09-24. 아래 내용은 저장소, 배포 기록, 실제 수행한 검사에 근거한다. 과거 디자인의 완료와 현재 운영 제품의 완료를 구분했다. 비밀 키나 토큰 값은 포함하지 않는다.

## 1. 가장 먼저 확인할 것

**현재 운영 사이트의 소스는 `main`에 아직 모두 들어 있지 않다. `origin/codex/product-redesign-1-3`를 먼저 통합해야 한다.** 이전 `main`이나 이전 Claude 체크아웃으로 바로 배포하면 새 제품 화면이 사라진다.

| 항목 | 확인한 값 |
| --- | --- |
| 실제 작업 폴더 | `C:\Users\gana0\project-ganymede-design` |
| 관련 없는 현재 앱 기본 폴더 | `D:\ESPORTSFIGHTERS` — Ganymede 작업에 사용하지 않음 |
| 개발 저장소 | `https://github.com/mycyi1994-hash/project-ganymede` — PRIVATE |
| 인계 브랜치 | `codex/product-redesign-1-3` — 원격에 푸시됨 |
| 인계 문서 작성 전 브랜치 HEAD | `307c03f` — 배포 기록 커밋 |
| 실제 배포된 애플리케이션 소스 | `1bfed8e` |
| 현재 활성 Worker 버전 | `379aa941-a9db-4c61-8169-723bf0553c7a` — 100% |
| 위 버전 배포 시간 | 2026-09-24 09:09:21 UTC / 18:09:21 KST |
| Worker / 운영 주소 | `ganymede-xlayer` / `https://ganymede-xlayer.gana003.workers.dev/` |
| 원격 main | `08f41cd` — 새 제품 UI 이전 |
| 원격 Claude 검토 브랜치 | `claude/exciting-edison-ckz6ph`의 `df6c41e`까지 통합됨 |
| 공개 제출 저장소 | `https://github.com/mycyi1994-hash/project-ganymede-submission` — PUBLIC |

이번 인계 문서는 `307c03f` 다음 문서 커밋으로 저장된다. 배포 소스와 문서 HEAD가 다른 것은 정상이다. 인계 문서 작성 자체로 앱을 다시 배포하지 않는다. 인계 시작 시 작업 트리는 깨끗했다.

통합 예시 — Claude 자신의 작업 브랜치에서 미커밋 변경을 먼저 확인하고 실행한다. 다른 사람의 변경을 reset/덮어쓰지 않는다.

```powershell
git status --short
git fetch origin
git merge origin/codex/product-redesign-1-3
```

마지막 `1bfed8e`만 cherry-pick하면 안 된다. 전체 화면은 `f4d67c1`, `ff04920`에 있으며 Claude 통합 merge도 포함해야 한다.

## 2. 사용자의 최종 의도와 확정 범위

사용자는 처음에는 OKX Dev Day 출품 경쟁력을 요구했지만, 이후 **심사용 검증 체험보다 실제 사용자가 이해하고 이동할 수 있는 제품**을 요구했다. 기존 디자인을 버리고 구조를 바꿔도 된다고 명시했다. 큰 빈 공간, 정적인 장식, 메뉴마다 달라지는 동선, 화면에 과도하게 드러난 check/test 설명이 주요 불만이었다.

이에 기본 동선을 상품 탐색 → 상품 상세·조건 → Portfolio/Activity로 바꾸고, 기술적인 NAV 근거는 상품의 Transparency로, 가격 변경 실험과 모의 운용은 Lab으로 옮겼다.

다만 실제 투자·회수 경로를 질문한 결과, 사용자가 Claude의 저장소 확인 결과를 전달했다.

- 실제 입출금·자산 보관 계약과 결제 토큰은 없다. 이를 구현한 브랜치도 없다.
- 배포된 두 계약은 X Layer 테스트넷의 CORE 지분 장부와 NAV 공시 계약뿐이다.
- 실제 자금을 받을 주소나 경로를 임의로 만들거나 지정하지 않는다.
- 테스트넷·모의 운용 표시는 유지한다. 결제 자산·수탁 구조는 사용자가 정하기 전까지 범위 밖이다.

따라서 이번 완료는 **제품 화면 + 실제 공개 NAV/구성 + 기존 테스트넷 CORE 장부 읽기 + 별도 모의 운용**이다. 실제 투자·회수 서비스 출시 완료가 아니다. 앞선 계획서의 “4단계 투자·회수”는 이 확정에 따라 실행 범위에서 제외됐으며, 해당 화면은 개발 전용 설계 예시로만 남았다.

영상은 사용자가 나중으로 미뤘다. 이번 인계에서 영상 제작·제출 양식 전송·약관 동의는 하지 않았다. 과거 예약 관찰은 사용자가 취소를 요청했으며 새 관찰 자동화를 만들지 않았다.

## 3. 지금까지의 작업 흐름

아래는 현재 브랜치에 남아 있는 Codex 작업과 통합 이력의 요약이다. 기존 엔진·컨트랙트 전체를 Codex가 새로 작성했다는 뜻은 아니다.

| 작업 묶음 | 한 일 / 현재 상태 | 근거 |
| --- | --- | --- |
| 초기 디자인 점검 | 전략 카드·상세·모의 금액·NAV 상태·포트폴리오 배치 정리 | `f35288c`, `a6a3a26`, `c74dc69` |
| 메뉴 불일치 수정 | Overview/Portfolio 등에서 메뉴가 사라지거나 달라지던 공통 내비게이션 정리 | `3aa286a` |
| USTX 중심 설명 정리 | 토큰화 주식 구성과 공개 NAV를 중심으로 콘텐츠·상태 표시 재배치 | `8222b59` |
| Clearform 전체 디자인 | 밝은 바탕, 반투명 주식 조형, 공통 메뉴, 전략 상세/포트폴리오/Proof/문서/오류 상태 적용 | `e5d1d8f`, `docs/clearform-design.md` |
| 신뢰 경계 유지 | 이전 UI 복원 때도 배포된 identity header 신뢰 제한 보존 | `5f2fff8` |
| 모의 포트폴리오 격리 | 브라우저별 비공개 세션으로 모의 기록 분리. 공개 사용자가 같은 데모 계정을 공유하지 않게 함 | `1ff5463` |
| 실제 검증 실험 | 원문 가격을 로컬 복사본에서 바꿨을 때 실제 해시/산식 실패, 복원 시 통과. 백그라운드 갱신 중 편집 상태 안정화 | `4641ddc`, `9e6d3ee` |
| 대회·보안 문서 | 실제 구현에 맞춘 제출 설명, 의존성 패치와 한계 기록 | `95da39e`, `28e0ce2` |
| NAV 근거·재시도 정리 | 가격 시도/가격 유효기간/발행 상태 구분, 정확한 과거 payload 대조와 재시도 근거 검토 | `41de09d`, `docs/PUBLICATION_RETRY_REVIEW.md` |
| 이전 5단계 동선/모션 | 구성 이해 → 검증 → 로컬 변경/복원 → 근거 동선, 상태 모션, Claude PR #3 변경 통합 | `baf81c6`, `ee82951`, `e8631c2`, `docs/JOURNEY_RELEASE.md` |
| 조형·체인 패널 보완 | 조형 모션과 체인 기록 묶음의 표현 보완 | `c5a5565` |
| 제품 방향 재설계 | 기존 디자인 대체 승인에 따라 실제 상품/계정/거래 동선과 상태 계약 수립 | `08f41cd`, `docs/PRODUCT_REDESIGN_PLAN_KO.md` |
| 새 제품 1–3단계 | Markets, USTX 상세, Transparency, 연결된 주문/보유/활동/거래 시안, 실제 데이터 연결 | `f4d67c1` |
| Claude 최신 작업 통합 | 배포돼 있던 `df6c41e`까지 merge하여 최신 백엔드/보안 보존 | `2e81a09` |
| 현재 운영 제품 완성 | 실제 CORE 장부 조회 Portfolio/Activity/receipt, 새 문서/오류 화면, Lab 경로 정리, 검사/배포 | `ff04920` |
| 마지막 계정 UX | 조회 중인 공개 주소 해제, 화면/탭 저장값 초기화 | `1bfed8e` |
| 배포 기록 | 최종 버전과 운영 검수 기록, 푸시 완료 | `307c03f` |

**Clearform/Journey 문서의 “이 디자인을 유지” 또는 “배포 전”이라는 과거 문구를 현재 지시로 해석하지 않는다.** 사용자에게서 전체 재설계와 배포 승인이 이후에 주어졌다. 현재 기준은 `AGENTS.md`, 이 인계, `PRODUCT_RELEASE.md`다. 옛 조형 이미지와 CSS는 일부 레거시/메타 이미지용으로 남아 있으나 새 Markets의 주요 화면으로 복원할 대상은 아니다.

## 4. 현재 화면과 실제 동작

| 경로 | 역할과 연결 |
| --- | --- |
| `/` | Markets. USTX 정체, 최신 공개 NAV와 이용 가능한 발행 이력, 실제 구성 비중, 상세 진입 |
| `/products/ustx` | NAV 차트/기록, 종목 선택과 기여 금액, 조건, 투자 미개방 안내, Transparency |
| `/products/ustx/transparency` | 실제 RPC 읽기 + 문서 해시 + NAV 산식 자동 비교. 기술 상세·가격 시각·quote-age 정책·발행 이력·원문은 펼쳐 보기 |
| `/portfolio` | 지갑의 공유된 주소 또는 직접 입력한 공개 주소로 GMDCORE 잔액 조회. USTX 투자 잔액과 명확히 구분 |
| `/activity` | 같은 주소의 최근 CORE Transfer 로그. 조회 범위는 최근 2,000블록이며 전체 이력이라고 부르지 않음 |
| `/activity/[hash]` | 해당 CORE 계약의 성공한 receipt/Transfer만 표시. 미존재·실패·다른 계약의 거래는 성공으로 표시하지 않음 |
| `/methodology`, `/limitations` | 공통 셸의 상품 설명 문서와 데이터 정책 |
| `/lab` | 기존 브라우저 세션의 KRW 모의 포트폴리오와 4개 암호자산 전략 목록 |
| `/lab/strategies/[slug]` | 기존 전략 상세·5개 탭·샘플 금액·검토. slugs: `gmd-core`, `gmd-tech`, `gmd-yield`, `gmd-alpha` |
| `/lab/verification` | 기존 가격 변경/복원 실험. 기본 고객 동선과 분리 |
| `/?app=operations` | 기존 운영 화면. 권한 경계 유지 |
| `/design-preview` | 개발 모드 전용 설계 예시. 운영 빌드에서는 404 |
| 404/오류 | 새 제품 셸, 복귀/재시도 경로 |

이전 URL 이동: `/?app=select` → `/products/ustx`, `/?app=portfolio` → `/lab`, `/proof` → `/products/ustx/transparency`, `/etfs/[slug]` → `/lab/strategies/[slug]`. 모의 포트폴리오를 실제 Portfolio로 오인 이전하지 않는다. Transparency에는 `proof-verify`, `proof-holdings`, `proof-record`, `proof-source` 앵커가 있다. 모든 과거 앵커의 호환을 검증했다고 주장하지 않는다.

## 5. 디자인/모션에서 유지할 기준

- 공통 메뉴: **Markets / Portfolio / Activity**. 모바일에는 같은 목적지의 하단 메뉴를 사용한다.
- 짙은 헤더와 밝은 작업 영역, 청록색 주 행동. 최대 본문 폭 1536px. 큰 화면의 빈 공간을 임의 지표로 채우지 않는다.
- 새 제품 CSS는 `app/product-ui/product.css`, `.gmd-app` 아래에 둔다. 기존 Lab은 `clearform.css`를 사용한다. 공유 헤더는 `SiteHeader.tsx` 어댑터로 연결한다.
- 주요 색: 배경 `#f3f5f6`, 표면 `#fff`, 본문 `#172b35`, 보조문 `#526570`, 강조 `#0b625b`, 선 `#d5dee2`.
- 글꼴: Instrument Sans / Source Sans 3, self-hosted. 이미지/글꼴/브랜드 출처는 `public/ASSET-CREDITS.md`.
- 상품 구성의 띠와 표의 선택 상태가 기여 금액과 함께 바뀐다. NAV 차트는 실제 발행 시각을 사용하고 정확한 기록 표와 키보드 선택을 제공한다.
- 현재 모션: 구성 띠 240ms, 기여 금액 160ms, 개발 시안 주문 검토 180ms, 버튼/선택 반응. `prefers-reduced-motion`에서 애니메이션·전환을 제거한다.
- 지속적으로 도는 큰 3D 애니메이션을 새 제품에 넣은 것은 아니다. 기존 Clearform 조형 모션과 현재 제품의 짧은 상태 모션을 혼동하지 않는다.
- 계정 메뉴는 바깥 클릭·Escape로 닫힌다. 공개 주소 입력 후 Portfolio로 이동하며, `Stop viewing address`로 조회값을 지운다.
- 실패를 0원, 미발행을 발행 완료, 문서 불일치를 검증 통과로 표현하지 않는다. 정적인 예시 수익률·TVL·사용자 수를 실측값으로 추가하지 않는다.

## 6. 파일 지도

| 파일/폴더 | 다음 담당자가 볼 내용 |
| --- | --- |
| `app/product-ui/ProductShell.tsx` | 공통 셸, 메뉴, 모바일 내비게이션, 계정 팝오버, footer, 개발 시안 툴바 |
| `app/product-ui/ProductScreens.tsx` | Markets/USTX 상품 화면, 투자 미개방 패널, 조건, 데이터 상태 |
| `app/product-ui/MarketProvider.tsx` | `/api/xstocks` 로드, 15초 타임아웃, 보이는 탭에서 60초 갱신, 취소/오류/직전 데이터. Portfolio/Activity에서는 불필요한 시장 갱신 비활성 |
| `app/product-ui/MarketChart.tsx` | 실제 NAV 이력 차트/기록 표/포인터·키보드 탐색 |
| `app/product-ui/Holdings.tsx` | 실제 가치 비중과 종목별 기여 금액, 표/구성 띠 선택 |
| `app/product-ui/Transparency.tsx` | 자동 직접 체인 조회, 원문·해시·계산 비교, 공개 이력과 상세 |
| `app/product-ui/WalletAccount.tsx` | 주소 공유 요청, provider 이벤트, 공개 주소 보기, sessionStorage, 계정/응답 경쟁 방지 |
| `app/product-ui/LedgerScreens.tsx` | 실제 장부 잔액/활동/receipt 화면, 취소·주기 조회·오류·빈 상태 |
| `app/product-ui/DesignPreview.tsx` | 개발용 주문/포트폴리오/보유/활동/거래 예시. 실제 거래 코드가 아님 |
| `app/product-ui/product.css`, `Icons.tsx` | 새 디자인 토큰·레이아웃·상태·반응형·모션·아이콘 |
| `lib/product-market.ts` | 공개 API 형태 검사, 표시 기록과 맞는 구성만 선택, confirmed 이력·초 단위 중복 제거, 실제 비중 |
| `lib/product-ledger.ts` | 브라우저에서 공개 RPC로 CORE 장부/로그/receipt만 읽는 어댑터 |
| `lib/product-contract.ts` | 미개방 capability와 미래 견적/거래 상태 타입. 실행 API가 아님 |
| `app/ProductGuide.tsx`, `app/error.tsx`, `app/not-found.tsx` | 새 설명/오류/404 화면 |
| `app/HomeClient.tsx`, `app/PortfolioView.tsx`, `app/etfs/[slug]/EtfDetailClient.tsx` | 기존 모의 운용. 최신 변경은 주로 Lab 진입 경로/공통 셸 연결 |
| `app/page.tsx`, `app/proof/page.tsx`, `app/etfs/[slug]/page.tsx` | 기본 화면과 레거시 redirect |
| `app/design-preview/page.tsx` | production 404 경계와 허용 screen/scenario/amount 파라미터 |
| `scripts/product-preview.mjs` | 로컬 읽기 전용 프록시. 배포 대상 아님 |

## 7. 데이터 연결과 오해하면 안 되는 점

### USTX

`/api/xstocks`의 공개 데이터가 시장 화면의 원본이다. 표시 중인 NAV와 원문 구성의 NAV·시각이 일치해야 구성표를 채운다. 최신 가격 시도의 구성을 다른 과거 기록에 붙이지 않는다. 이력은 confirmed 발행과 오류 없이 읽은 체인 스냅샷을 사용하며 가짜 과거 데이터나 수익률을 만들지 않는다.

Transparency는 기존 `lib/xstocks/onchain.ts`, `lib/xstocks/proof.ts`를 재사용한다. RPC 최신 기록이 API 문서보다 먼저 갱신되면 잠시 matching evidence 대기가 정상이다. hash/산식/체인 일치는 자산 보관·가격 정확성의 증거가 아니다.

### CORE 지분 장부

`lib/product-ledger.ts`는 체인 ID, 계약 코드 존재, decimals=6을 확인하고 같은 블록 번호에서 balance/totalSupply를 읽는다. RPC의 `eth_getLogs` 제한은 **한 요청당 최대 100블록**이다. 2,000블록을 최대 3개 동시 요청으로 나누어 읽고 해당 계정 관련 이벤트만 남긴다. 중복·removed 로그를 처리하고, 잘못된 블록/값/receipt를 거절한다. 숫자는 BigInt 기반이다.

`LedgerScreens`는 보이는 탭에서 60초 갱신한다. 계정이 바뀐 뒤 이전 계정 데이터를 표시하지 않도록 결과에 account를 결합한다. 기록이 없다는 문구는 조회한 구간에 한정된다. 전체 거래 이력 인덱서나 페이지네이션 서버는 구현하지 않았다. 잔액과 이력은 한 읽기 결과로 묶여 있으므로 이력 조회 실패 시 새 잔액도 성공 처리하지 않는다.

### 계정

`eth_accounts` / `eth_requestAccounts`는 공개 주소 공유일 뿐이다. 서명 인증, 네트워크 변경, 트랜잭션 전송은 하지 않는다. 지갑 주소만으로 운영 권한이나 사적 데이터 접근 권한을 부여하지 않는다. 직접 입력한 공개 주소는 해당 탭 sessionStorage에만 편의 저장한다. 조회 모드에서는 provider 계정 변경이 입력 주소를 임의로 덮지 않도록 구분했다.

`/api/portfolio`는 기존 KRW 모의 운용용이며 새 `/portfolio`의 USTX 자산 서버가 아니다. 같은 이름 때문에 잘못 연결하지 않는다.

## 8. 계약/체인 현황

배포 근거: `onchain/deployments/xlayer-testnet.json`.

| 용도 | 값 |
| --- | --- |
| 기록/지분 체인 | X Layer Testnet, chain ID `1952` |
| 공개 RPC | `https://testrpc.xlayer.tech/terigon` |
| GanymedeFundShare | `0x68c4e8c904b3eddb1146ef52a76a0a2755a55b59` |
| 지분 상품/정밀도 | Ganymede Core 20 / GMDCORE / 6 decimals |
| GanymedeNavRegistry | `0xf320d2a7f280b7ab61e24374986869d7be34289c` |
| xStocks 가격 조회 체인 | X Layer mainnet `196` — 자산 보유를 뜻하지 않음 |

지분 계약은 발행자 권한 장부다. 입금·출금·수탁 계약이 아니다. CORE 토큰을 USTX 보유량으로 표시하면 안 된다. NAV registry에도 자산 보관 기능은 없다. 새 컨트랙트·실자금 수령·메인넷 거래는 이번 작업에서 수행하지 않았다.

## 9. 개발 전용 시안

`http://localhost:3128/design-preview?screen=...`에서 `markets`, `product`, `order`, `portfolio`, `holding`, `activity`, `transaction`을 볼 수 있다. 거래 시나리오는 `scenario=pending|completed|recovery`다.

- 모든 화면에 Design preview / Example account를 표시한다.
- USDC, 예시 수수료, 최소 금액, 잔액, 보유량은 레이아웃 검토용이다. 실제 결제 자산/요율/조건으로 확정되지 않았다.
- 입력 잔액 초과·금액 형식 검증과 주문 검토를 구현했다. 입력 금액은 진행·완료 화면으로 전달된다.
- Portfolio는 독립적인 예시 스냅샷이다. 시안 주문을 누른다고 영구 모의 장부가 갱신되는 구현은 아니다.
- 실 API 쓰기·지갑 서명·송금은 없다. production의 `/design-preview`는 404다.
- `lib/product-contract.ts`: `canSubscribe=false`, `canRedeem=false`, `settlementAsset=null`, `custodyAddress=null`을 유지한다.

## 10. Claude 작업과 통합 경계

Claude의 `df6c41e`까지 merge했다. 원장의 무결성, 발행/relayer 재시도·nonce·오류 처리, 화면의 거절 응답과 금액 제한, public health의 RPC 오류 정리를 보존했다. 구체적인 변경은 `7b18cf9`, `dc66eee`, `8cd427f`, `1e0a6bf`, `df6c41e`와 해당 테스트를 읽는다.

**마지막 제품 재설계 단계**에서는 `app/api`, `lib/engine`, `lib/xstocks`, `relayer`를 직접 수정하지 않았다. 그 이전 Codex 단계의 포트폴리오 세션·publication retry 등 변경은 이력에 있으므로 “전체 기간 동안 백엔드는 전혀 안 건드림”이라고 이해하면 안 된다.

`lib/engine/api-helpers.ts`의 identity 신뢰 경계를 반드시 보존한다. 공개 요청의 `oai-authenticated-user-email`을 운영 권한으로 믿으면 안 된다. `IDENTITY_HEADER_TRUSTED`가 명시적으로 신뢰된 배포일 때만 해당 경계를 열도록 한 기존 처리를 유지한다. public GET 조회가 엔진/DB 쓰기를 유발하지 않는 기존 원칙도 보존한다.

## 11. 검수 — 확인한 것과 확인하지 않은 것

### 완료한 검사

- `ff04920` 코드에서 타입검사 + 운영 빌드 + 전체 **89개** 자동 검사 통과.
- 마지막 `1bfed8e` 계정 조회 해제 변경 후 타입검사 + 새 운영 빌드 + 관련 **12개** 검사 재통과. 89개 전체를 마지막 커밋에서 다시 실행한 것으로 확대하지 않는다.
- lint 오류 0, 경고 10. 정적 이미지 권고·기존 내부 이동 방식·기존 미사용 테스트 변수 등이 포함된다.
- 새 검사 파일: `tests/product-market.test.mjs`, `tests/product-ledger.test.mjs`. 경로/SSR/예시 차단은 `tests/rendered-html.test.mjs`.
- 시장 기록 연결, 실제 가치 비중, malformed API, 잘못된 체인/빈 계약/잘못된 수량/부분 이력 실패, 로그 분할/중복, 성공하지 않은 receipt와 무관한 계약, 큰 정수 정밀도 등을 검사했다.
- 브라우저: 메뉴, 상품 상세, 구성 선택, 차트/표, 키보드 기록 선택, 실제 direct-RPC/hash/NAV 일치, 공개 주소 조회/주소 변경/조회 해제, Portfolio → Activity, 문서/Lab 연결.
- 모바일 320/390의 계정·활동·문서와 1440 데스크톱, 이전 단계의 768/2560 핵심 화면 확인. 조회 실패 로컬 프리뷰에서 unavailable/재시도 표시 확인.
- 개발 시안의 잔액 초과 차단, 250 USDC 예시의 검토→진행→완료 수량 일치, recovery/보유 상세 이동 확인.

### 운영 관측

- 통합 배포 후 09:06 UTC: 주요 9개 화면 200, 이전 4개 경로 307, 개발 시안/잘못된 거래 ID 404.
- `/api/market`, `/api/health`, `/api/portfolio`, `/api/xstocks` 모두 200.
- 당시 latest `2026-09-24T09:05:34.997Z`, onchain `2026-09-24T09:05:34.000Z`, publication `confirmed`. 브라우저 문서·해시·계산도 일치.
- CORE는 당시 전체 발행량 0, 확인한 공개 주소 잔액 0, 최근 구간 이벤트 없음. 0을 fixture로 넣은 것이 아니라 공개 RPC 결과였다.
- 마지막 배포에서 공개 주소 해제와 메뉴 초기화, 관측된 브라우저 error 로그 없음 확인.

### 미검증/제한

- 실제 지갑 확장 프로그램 승인/거절·네트워크·계정 변경 전체 E2E는 하지 않았다. 공개 주소 입력으로 읽기 흐름을 검수했다.
- 실제 양수 CORE 발행/이전 receipt를 새로 만들지 않았다. 성공 receipt 처리는 fixture 검사이며, 운영에서 그러한 사례를 관측한 것으로 말하지 않는다.
- 모든 화면의 실제 400% 브라우저 확대, OS reduced-motion 전환, 완전한 접근성 감사, 사용자 인터뷰는 하지 않았다. 좁은 viewport 검사와 CSS 구현을 그 증거로 대체하지 않는다.
- 2,000블록 조회는 제한된 이력이다. 공개 RPC 부하·매우 느린 응답·장기 사용 성능은 후속 점검 대상이다.
- 테스트와 표본 API 확인은 12시간 연속 무장애 증명이 아니다. `health.ready`만으로 발행 복구를 판정하지 않는다.
- 완전한 보안 감사/스마트컨트랙트 감사/실제 자산 취득·보관·회수 검증은 완료하지 않았다.

## 12. 로컬 실행과 검사

Node 요구 버전은 `>=22.13.0`. 앱은 vinext/Vite/React 기반이며 운영은 Cloudflare Worker다. 단순한 표준 Next 배포 명령으로 바꾸지 않는다.

```powershell
Set-Location C:\Users\gana0\project-ganymede-design
npm ci
npm run dev -- --port 3127
```

다른 터미널에서:

```powershell
Set-Location C:\Users\gana0\project-ganymede-design
node scripts/product-preview.mjs
```

`http://localhost:3128/`로 확인한다. 인계 시점 3127/3128/3129가 이미 listen 중이었다. 새 담당자는 실행 상태를 확인하고 중복 서버를 띄우지 않는다. 3129는 `--fail-market` 실패 프리뷰로 사용했다.

프록시는 공개 `/api/market`, `/api/xstocks` GET만 전달하고 `/api/portfolio`는 빈 로컬 fixture를 반환한다. 쓰기 요청은 405다. 따라서 여기서 Lab 저장을 눌러도 운영 저장 검증이 되지 않는다. 프록시를 배포하지 않는다.

```powershell
npm run typecheck
npm run lint
npm test
```

`npm test`는 타입검사와 빌드를 포함한다. relayer를 수정하면 별도로 그 폴더의 typecheck/test를 수행한다. 이번 최종 제품 작업에서 relayer 전체 검사를 다시 수행한 것은 아니다.

## 13. 다음 배포 시 주의

먼저 현재 활성 Worker 소스와 자신의 브랜치를 비교한다. 이번 문서 확인 시 활성 버전은 위 표와 같았지만 다음 작업자가 배포할 때도 같다고 가정하지 않는다. 뒤늦게 올라간 Claude 보안 수정이나 새 디자인을 덮어쓰면 안 된다.

기존 Worker/D1에 맞춘 빌드 환경:

```powershell
$env:CLOUDFLARE_WORKER_NAME='ganymede-xlayer'
$env:CLOUDFLARE_D1_DATABASE_NAME='ganymede-xlayer'
$env:CLOUDFLARE_D1_DATABASE_ID='0e2f441d-c853-42c4-814c-790ef1925489'
npm run build
```

배포에는 `dist/server/wrangler.json`과 `--keep-vars`를 사용했고, message에 실제 source SHA와 이전 버전을 남겼다. 현재 상황/승인 범위를 확인한 후 새 빌드로만 배포한다. 소스가 바뀐 뒤 이전 `dist`를 재사용하지 않는다.

- D1 binding은 `DB`. 새 DB 생성·마이그레이션은 이번 UI 변경에 필요하지 않았다.
- `nodejs_compat`, `global_fetch_strictly_public`, 기존 5분 `*/5 * * * *` 스케줄 보존.
- 원격 변수/비밀 값 보존. `.env*`, 키, 인증 파일을 문서/공개 저장소에 복사하지 않는다.
- 이전 배포와 원격 binding 이름·종류 12개가 일치함을 확인했다. 그 값들을 공개 기록에 출력하지 않았다.
- 이번 작업에서 운영 엔진 강제 실행, 자금 거래, relayer 강제 쓰기, 새 자동화는 없었다.
- 최종 버전 직전의 호환 UI는 `bb33af8d-0c01-4c7e-ac20-0853854bfb74` / `ff04920`. rollback 시 DB·온체인 기록을 지우지 않는다.

## 14. 공개 제출 저장소와 문서의 차이 — 우선 후속 과제

인계 시 GitHub 조회 결과:

- 개발 저장소 `project-ganymede`는 PRIVATE다.
- 제출 저장소 `project-ganymede-submission`은 PUBLIC이다.
- 제출 저장소 최신 commit은 `4444303257076c54955fe3ecd52172b51d5306a2`, 2026-09-24 06:20:02 UTC, `Publish integrated five-stage journey and verified motion release`다.
- 그 tree에는 `app/product-ui/`, `app/products/ustx/page.tsx`, `docs/PRODUCT_RELEASE.md`가 없다. **공개 제출 소스와 현재 운영 UI가 아직 일치하지 않는다.**

최근 제품 재설계에서는 개발 브랜치 push와 운영 배포만 했고 공개 제출 export는 하지 않았다. 공개 저장소를 만드는 방향은 사용자가 이전에 승인했지만, 최신 변경의 안전한 export/검수는 다음 담당자가 이어서 해야 한다. 인계 요청만으로 이번에 공개 저장소를 갱신하지 않았다.

`README.md` 본문과 `docs/OKX_DEV_DAY.md`는 이전 NAV 검증 중심 서술/이전 링크/저장소 접근 안내가 남아 있다. 현재 제품 동선과 공개 제출 링크에 맞춘 본문 개정이 필요하다. 대회 점수 가중치·일정·참가 경로 등은 당시 확인 기록이며, 제출 전 공식 builder kit/terms와 다시 대조해야 한다. 참가 승인은 받았다고 사용자가 밝혔고 현장/원격 경로는 확정되지 않았었다. 영상과 제출 접수 완료를 주장하지 않는다.

## 15. Claude의 권장 진행 순서

1. **브랜치 통합**: 자신이 작업 중인 변경을 보존하고 `origin/codex/product-redesign-1-3`를 통합한다. `main`만 받고 시작하지 않는다.
2. **운영 화면 빠른 재현**: Markets → USTX → Transparency, Portfolio 공개 주소 → Activity, Lab 전략 이동을 직접 본다. 완료된 CSS 삭제/타입검사 수정/이전 디자인 작업을 처음부터 반복하지 않는다.
3. **공개 제출 소스와 문서 정합성**: 현재 운영 소스를 안전하게 export하고 현재 동선/구현 범위에 맞춰 README·대회 문서를 갱신한다. 비밀·개인 설정·로컬 출력물은 제외한다.
4. **남은 실제 검수**: 지원 지갑의 주소 공유·계정 변경/거절, 실제 확대·reduced-motion, 실제 기록이 있을 때 receipt/긴 이력 화면을 확인한다. 검수 편의를 위해 운영 mint나 돈 이동을 임의 실행하지 않는다.
5. **제품 개선**: 긴 이력 조회/느린 RPC 비용, 데이터 갱신 시 UX, 최초 사용자 동선을 관찰해 수정한다. 허구의 자산·거래를 추가해 빈 화면을 채우지 않는다.
6. **실자금 기능은 별도 단계**: 결제 자산, 자산 취득·보관·지급 구조와 책임, 실제 권리·수수료·조건, 인증/실행 견적/중복 방지/복구가 정해지기 전에는 투자 버튼이나 입금 주소를 열지 않는다. USDC 설계 예시는 결정된 결제 자산이 아니다.

## 16. 참고 자료와 실행 흔적

- 현재 결과: `docs/PRODUCT_RELEASE.md`.
- 전체 재설계 계획: `docs/PRODUCT_REDESIGN_PLAN_KO.md`.
- 미래 상태/연결 계약: `docs/PRODUCT_STAGE1_CONTRACT.md`, `lib/product-contract.ts`.
- 앞선 1–3단계: `docs/PRODUCT_STAGES_1_3.md`.
- 과거 디자인/배포 기록: `docs/clearform-design.md`, `docs/JOURNEY_RELEASE.md`, `docs/REFINEMENT_RELEASE.md` — 최신 지시가 아님.
- 보안/정산 관련 기존 한계: `docs/SECURITY_REVIEW.md`, `docs/PUBLICATION_RETRY_REVIEW.md`와 이후 Claude 변경.
- 로컬 검사 기록: `outputs/product-final-tests.log`, `outputs/product-final-followup.log`, `outputs/product-production-checks.json`, `outputs/product-final-deployment.log`. `outputs/`는 gitignore라 다른 기기에서 자동으로 내려오지 않는다. 원격 인계의 기준은 커밋과 본 문서다.
- `outputs/*version*.json` 등 운영 설정 조회 원본은 로컬 검토용이며 공개 export에 넣지 않는다.
- `ganymede-12` 자동화 파일은 이번 인계 확인에서 기본 로컬 경로에 없었다. 이것만으로 앱 전체 예약 상태를 단정하지 않는다. 사용자의 취소 요청을 존중하고 임의로 모니터를 다시 만들지 않는다.

**요약:** 새 제품 화면은 운영에 배포돼 있고 실제 공개 NAV/CORE 테스트넷 읽기까지 연결되어 있다. 실자금 투자는 구현되지 않았다. 다음 작업의 첫 의존성은 최신 개발 브랜치 통합이며, 눈에 보이는 인계 차이는 공개 제출 저장소/이전 문서와 운영 제품 사이의 불일치다.
