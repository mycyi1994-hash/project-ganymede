# Five-stage journey release — 2026-09-24

The Clearform journey now connects basket understanding, original verification,
local price edits and detailed evidence. This release integrates Claude's review
branch through 1e5cbf6, preserving the source identity boundary, exact publication
checks, typecheck configuration, unused-style removal and narrow-screen fixes.

## Implemented
1. Shared navigation separates Paper lab visually. Strategy details return to the lab.
2. Overview presents one verified report's six holding values and sum before the edit experiment; a full-evidence action follows the result.
3. Basket prioritizes composition and selected holding contribution. Proof navigation matches reading order. Offline examples are collapsed. Crypto strategy browsing lives with paper allocations.
4. One 500ms hero entrance; 180ms selection feedback; 240ms result transitions; a brief changed-price highlight. Actual local verification establishes the experiment baseline and every edit/restore result; no fake success or timed verification delay. Short result summaries retain expandable exact check details. All added motion is disabled by prefers-reduced-motion.
5. App build/typecheck/tests, relayer tests/typecheck and browser checks precede deployment. Runtime/public-export results are recorded below after release.

## Validation scope
- Desktop and 390px mobile: navigation, composition selection, baseline/edit/restore, consistent result placement, 3/3 direct-chain verification, collapsed examples.
- Read-only local failure preview: /api/xstocks 503 yields unavailable and retry, never a successful check.
- Preview portfolio is an explicit empty local fixture; no transaction or allocation was made during review.
- Existing tests cover stale publication, quote status, unavailable RPC and report mismatches. These are distinct from runtime failure-preview checks.
- Reduced-motion CSS is inspected; the connected browser currently reports no preference for reduced motion. Native 200% zoom and runtime reduced-motion testing remain unverified; narrow viewport checks are not a substitute. This does not claim a complete accessibility audit.
- No relayer behavior change is needed for this UI release; the already deployed exact-payload/receipt reconciliation implementation is retained.
