# 공개 제출 저장소 갱신 안내

작성: 2026-09-24. 비공개 개발 저장소 전용 문서다. 공개 스냅샷에는 넣지 않는다.

## 왜 이 문서가 필요한가

- 공개 제출 저장소 `project-ganymede-submission`의 최신 커밋은 `4444303`이다. 내용은 개발 저장소의 `03fe3ff`에 해당한다.
- 운영 소스 `1bfed8e`(Worker `379aa941-a9db-4c61-8169-723bf0553c7a`)와 비교하면 파일 34개가 없고, 2개는 삭제돼야 하고, 41개는 옛 내용이다.
  - 빠진 34개에는 새 제품 화면 전체(`app/product-ui/`, `app/products/`, `app/portfolio/`, `app/activity/`, `app/lab/`)가 들어 있다.
  - 전체 코드 검토 수정분(`df6c41e`까지)도 빠져 있다.
- 공개본의 README와 대회 문서는 옛 NAV 검증 중심 설명이다. 옛 경로(`/proof`, `/?app=select`)를 가리키고, 소스 커밋 표기(`28e0ce2`)도 틀렸다.
- Claude가 이 반영을 시도했지만 권한 검사에서 "비공개 소스를 공개 저장소로 옮기는 작업"으로 막혔다. 그래서 **사용자 또는 Codex가 직접 반영**한다. 이전 공개 스냅샷(`4444303`)도 Codex가 만들었다.

## 기준 커밋

- 운영 소스: `1bfed8ec5f65b5b731e3f3b14814786aa3a740ae`
- 내보낼 커밋: 이 문서를 추가한 커밋. `git log -1 --format=%H -- docs/SUBMISSION_EXPORT.md`로 확인한다. 브랜치는 `claude/exciting-edison-ckz6ph`다.
- 내보낼 커밋이 운영 소스에 더하는 것은 두 가지뿐이다. 애플리케이션 코드는 운영 소스와 같다.
  - 문서
  - 테스트 시각 고정 수정(`tests/xstocks-publication.test.mjs`, `dd7649b`). 이 수정 전에는 10:00 UTC가 지나면 테스트 4개가 실패했다.
- 이 브랜치에는 그 뒤 접근성 수정 커밋도 있다. "/ USD" 라벨 대비와 Lab 검증 화면의 `aside` 중첩을 고쳤고, 아직 배포 전이다.
  - 배포 전에 내보내면 `73e2929`를 내보낸다. 이 커밋은 운영 소스에 문서·테스트만 더한 상태다.
  - 접근성 수정을 배포한 뒤 내보내면 새 배포 메시지의 source 커밋을 쓴다. 이 문서의 `1bfed8e…` 자리를 그 값으로 바꾸고, BUILD_EVIDENCE의 Product release 절에 새 Worker 버전 한 줄을 더한다.

## 반영 방법

1. 공개 저장소 작업 사본을 최신 `main`으로 맞춘다.
2. 내보낼 커밋의 파일 트리를 그대로 복사한다. 예: `git -C <개발저장소> archive <내보낼커밋> | tar -x -C <공개저장소>`
3. 다음 파일은 **공개본 내용을 유지**한다. 복사로 덮였으면 공개본으로 되돌린다.
   - `AGENTS.md` — 심사용 문서
   - `.openai/hosting.json` — 자리표시자 프로젝트 ID
   - `relayer/wrangler.jsonc` — 예시 Worker 이름과 자리표시자 D1 ID
   - `docs/BUILD_EVIDENCE.md` — 공개본에만 있는 파일이다. 아래 문구를 추가한다.
4. 다음 파일은 **공개하지 않는다**. 복사됐으면 지운다.
   - `docs/CLAUDE_HANDOFF_2026-09-24_KO.md` — D1 ID와 개인 PC 경로가 들어 있다.
   - `docs/SUBMISSION_EXPORT.md` — 이 문서
   - `outputs/`, `.env*`, 인증 파일
5. 개발 트리에서 삭제된 파일을 공개본에서도 지운다: `app/GanymedeScene.tsx`, `app/MiniAsciiCelestial.tsx`
6. `README.md`와 `docs/OKX_DEV_DAY.md`는 새 개발본을 쓰되, 아래 공개용 수정을 적용한다.

### README.md 공개용 수정

"Source and release" 절의 첫 문단을 다음으로 바꾼다.

```text
This public review snapshot corresponds to production source commit `1bfed8ec5f65b5b731e3f3b14814786aa3a740ae`. It adds only documentation and a test-fixture fix; application code matches the recorded source. The original development history remains private, and public-hosting identifiers are adjusted. See [snapshot provenance](docs/BUILD_EVIDENCE.md). Cloudflare deployment messages identify the production source commit. [Release rules and identity model](docs/release-identity.md).
```

"the product release notes" 링크(`docs/PRODUCT_RELEASE.md`)는 공개본에도 있는 파일이므로 그대로 둔다.

### docs/OKX_DEV_DAY.md 공개용 수정

- `- Source: https://github.com/mycyi1994-hash/project-ganymede`를 `- Source: https://github.com/mycyi1994-hash/project-ganymede-submission`으로 바꾼다.
- 증거 표의 커밋 링크 `[abc1234](https://github.com/mycyi1994-hash/project-ganymede/commit/abc1234)`는 모두 `` `abc1234` ``로 바꾼다. 비공개 저장소 링크를 남기지 않는다.
- "The development repository is PRIVATE"로 시작하는 문단은 다음으로 바꾼다. 이 문서로 가는 링크가 공개본에 남지 않도록 한다.

```text
This separate submission snapshot is published for reviewer access. The original development repository remains private. Source commit identifiers in the evidence table are provenance references, not public history links; see BUILD_EVIDENCE.md.
```

### docs/BUILD_EVIDENCE.md 추가 문구

맨 위 `Production source revision:` 줄의 값을 `1bfed8ec5f65b5b731e3f3b14814786aa3a740ae`로 바꾼다. 파일 끝에 다음을 추가한다. `<EXPORT_SHA>`는 내보낸 커밋 ID로 채운다.

```text
## Full-review fixes release

Production source: df6c41e97f0668c9066f0b77d8e9d88fc9f0fca2. Application Worker version: b287ab71-66f9-45d0-8854-3ee28626f2c0. Relayer Worker version: cb38524c-cb75-4350-a9ee-a363f49a5c93, still current.

A review of the whole codebase found and fixed defects in the paper ledger (input bounds, share reservation, conditional settlement, forward pricing, cash shortfalls, on-chain eligibility), USTX publication (request budget, retry classification, reconciliation of unresolved publications, bounded storage and provider cooldowns, composition checks), the relayer (status codes, product scope, retried mints, nonce resync, error bodies) and the interface. Each defect was reproduced before it was fixed; the new tests fail on the previous source.

## Product release

Production source: 1bfed8ec5f65b5b731e3f3b14814786aa3a740ae. Worker version: 379aa941-a9db-4c61-8169-723bf0553c7a, first integrated as bb33af8d-0c01-4c7e-ac20-0853854bfb74 from ff0492005341b62bb0c6acddc28a6ecd4a781cbb. The product is organized as Markets, the USTX product page, Transparency, and read-only Portfolio and Activity views of the GMDCORE test share ledger; the price-edit experiment and paper strategies moved to Lab. Investing and redemption are not implemented: there is no deposit address, settlement token or custody contract.

This snapshot is exported from <EXPORT_SHA>, which adds documentation and a test-fixture time fix (tests/xstocks-publication.test.mjs) to the production source; application code is unchanged. Validation of the snapshot: typecheck, build and 89 tests; relayer typecheck and 16 tests. Production observations are in docs/PRODUCT_RELEASE.md; they are point-in-time samples, not continuous availability or a security audit.
```

## 커밋 전 확인

1. 공개 작업 사본과 내보낸 커밋의 파일 목록·내용을 비교한다. 달라야 하는 것은 다음뿐이다.
   - 3번의 공개본 유지 파일 4개
   - 6번의 공개용 수정 파일 2개
   - 4번의 제외 파일
2. 공개할 변경분에 D1 ID, Cloudflare 계정 ID, 호스팅 프로젝트 ID, 이메일, `C:\Users\...` 같은 개인 경로, 키·토큰이 없는지 검색한다.
3. 공개 작업 사본에서 `npm ci`, `npm test`(테스트 89개), `relayer/`의 `npm ci`, `npm run typecheck`, `npm test`(16개)를 통과시킨다.
4. 커밋 메시지에 운영 소스(`1bfed8e`)와 내보낸 커밋 ID를 적고 `main`에 푸시한다.
5. 푸시 후 공개 저장소 페이지의 README 링크가 새 화면 경로로 열리는지 확인한다.
