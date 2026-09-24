# 공개 제출 저장소 갱신 절차

비공개 개발 저장소 전용 문서다. 공개 스냅샷에는 넣지 않는다.

공개 제출 저장소 `project-ganymede-submission`은 심사자용 공개 스냅샷이다. 운영에 새 릴리스가 나가면 아래 절차로 맞춘다. 공개 저장소에 올리는 일은 사용자 승인을 받은 뒤에 한다. 권한 검사에서 막히면 우회하지 말고 사용자에게 허용 여부를 묻는다.

## 내보낼 커밋

- 운영 배포 메시지(`npx wrangler deployments list --name ganymede-xlayer`)에 적힌 source 커밋을 확인한다.
- `main`에서 그 커밋을 포함하고, 그 뒤로는 문서나 테스트만 바뀐 커밋을 고른다. 이 커밋을 "내보낼 커밋"이라 부른다. 애플리케이션 코드는 운영 소스와 같아야 한다.

## 반영 방법

1. 공개 저장소 작업 사본을 최신 `main`으로 맞춘다.
2. 내보낼 커밋의 파일 트리를 복사한다. 예: `git -C <개발저장소> archive <내보낼커밋> | tar -x -C <공개저장소>`
3. 다음 파일은 **공개본 내용을 유지**한다. 복사로 덮였으면 공개본으로 되돌린다.
   - `AGENTS.md` — 심사용 문서
   - `.openai/hosting.json` — 자리표시자 프로젝트 ID
   - `relayer/wrangler.jsonc` — 예시 Worker 이름과 자리표시자 D1 ID
   - `docs/BUILD_EVIDENCE.md` — 공개본에만 있는 파일. 아래 문구를 추가한다.
4. 다음 파일은 **공개하지 않는다**. 복사됐으면 지운다.
   - `docs/CLAUDE_HANDOFF_2026-09-24_KO.md` — D1 ID와 개인 PC 경로가 들어 있다.
   - `docs/SUBMISSION_EXPORT.md` — 이 문서
   - `outputs/`, `.env*`, 인증 파일
5. 개발 트리에 없는 파일은 공개본에서도 지운다. 3번의 유지 파일은 예외다.
6. `README.md`와 `docs/OKX_DEV_DAY.md`는 개발본을 쓰되, 아래 공개용 수정을 적용한다.

### README.md 공개용 수정

"Source and release" 절의 첫 문단을 다음으로 바꾼다. `<PRODUCTION_SHA>`는 운영 source 커밋의 전체 ID다.

```text
This public review snapshot corresponds to production source commit `<PRODUCTION_SHA>`. Application code matches the recorded source; documentation may be newer. The original development history remains private, and public-hosting identifiers are adjusted. See [snapshot provenance](docs/BUILD_EVIDENCE.md). Cloudflare deployment messages identify the production source commit. [Release rules and identity model](docs/release-identity.md).
```

### docs/OKX_DEV_DAY.md 공개용 수정

- `- Source: https://github.com/mycyi1994-hash/project-ganymede`를 `- Source: https://github.com/mycyi1994-hash/project-ganymede-submission`으로 바꾼다.
- 증거 표의 커밋 링크 `[abc1234](https://github.com/mycyi1994-hash/project-ganymede/commit/abc1234)`는 모두 `` `abc1234` ``로 바꾼다. 비공개 저장소 링크를 남기지 않는다.
- "The development repository is PRIVATE"로 시작하는 문단은 다음으로 바꾼다.

```text
This separate submission snapshot is published for reviewer access. The original development repository remains private. Source commit identifiers in the evidence table are provenance references, not public history links; see BUILD_EVIDENCE.md.
```

### docs/BUILD_EVIDENCE.md

- 맨 위 `Production source revision:` 줄을 `<PRODUCTION_SHA>`로 바꾼다.
- 파일 끝에 이번 릴리스 절을 추가한다. 적을 내용:
  - 운영 source 커밋, Worker 버전(앱·relayer), 내보낸 커밋
  - 바뀐 내용 요약
  - 검사 결과(`npm test` 개수, relayer 테스트)
  - 운영 관측은 시점 표본이며 연속 가용성·보안 감사가 아니라는 문장

## 커밋 전 확인

1. 공개 작업 사본과 내보낸 커밋을 비교한다. 달라야 하는 것은 다음뿐이다.
   - 3번의 유지 파일 4개
   - 6번의 공개용 수정 파일 2개
   - 4번의 제외 파일
2. 공개할 변경분에 D1 ID, Cloudflare 계정 ID, 호스팅 프로젝트 ID, 이메일, `C:\Users\...` 같은 개인 경로, 키·토큰이 없는지 검색한다.
3. 공개 작업 사본에서 `npm ci`와 `npm test`를 통과시킨다. `relayer/`에서도 `npm ci`, `npm run typecheck`, `npm test`를 통과시킨다.
4. 커밋 메시지에 운영 source 커밋과 내보낸 커밋 ID를 적고 공개 저장소 `main`에 푸시한다.
5. 푸시 후 공개 저장소 README의 링크가 새 화면 경로로 열리는지 확인한다.
