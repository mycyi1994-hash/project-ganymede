# Clearform design implementation

The selected Clearform direction uses a porcelain background, graphite typography, translucent stock layers and a shared navigation shell. `app/globals.css` now loads `app/clearform.css` as the sole visual system; earlier refinement stylesheets are not loaded.

## Screens

- Overview: six-layer stock sculpture, HTML-rendered published NAV, pricing freshness, basket constituents, evidence flow and paper strategy links.
- Funds: featured GMD USTX basket followed by four filterable paper strategies. USD and KRW remain distinct.
- All four strategy pages: Overview, Model results, Holdings, How it works, Risks & documents, allocation simulator and review dialog.
- Portfolio: loading, empty, populated, pending removal, refresh failure and removal confirmation.
- Proof of NAV: last published record, separate pricing state, three independent checks, composition, registry details, publication history and original document.
- Shared wallet feedback, strategy finder, operations workspace/access restriction, not-found and error surfaces.

## Corrections found during browser review

- Main navigation retains all four links on narrow screens; the current section stays marked.
- The sculpture blends into the background and its plinth joins the live NAV panel.
- Negative model-return bars extend below the same zero baseline as positive bars.
- Holding bars represent actual weights rather than scaling the largest holding to 100%.
- Mobile holdings prioritize asset names and weights; supporting methodology remains in its own tab.
- Allocation review starts at its heading instead of scrolling directly to its bottom buttons. Dialogs retain Escape handling and focus restoration.
- Wallet error feedback can be dismissed by its close button or Escape.
- Pricing that fails on the first load does not claim a previous record exists. A verified historical record still does not imply pricing recovery.
- Visible dates use English and UTC; monetary units remain explicit.

## Validation

Browser inspection used local public-data fixtures with all mutation requests blocked. Populated portfolio and operations data were explicitly local test fixtures. No live allocation, redemption, engine cycle or wallet transaction was executed.

- Overview inspected at 390, 1440, 1920 and 2560 pixel widths.
- Mobile navigation, detailed holdings, allocation review and focus at 360 pixels; proof, portfolio states and removal confirmation at 390 pixels.
- All four detail routes and all five tabs checked, including tablet layout at 768 pixels. Core model results also checked separately after the initial click happened before hydration completed.
- Main page overflow checks, keyboard arrow navigation for tabs, Escape and focus restoration for dialogs, missing-wallet feedback, proof JSON expansion, unavailable data and 404 routing checked.
- Proof browser verification reached 3/3 against the existing historical record and public X Layer RPC.
- Production build and 42 existing tests pass. Updated render expectations reflect the new copy and sentence-case navigation. App TypeScript check passes; changed-file lint has zero errors and two intentional static-image recommendations.
- Reduced motion is implemented in CSS. Real connected-wallet, network-switch and provider-rejection flows were not exercised against a live wallet. The error boundary is implemented and builds; server failures were exercised through API-error states, not by deliberately crashing the application.

Asset provenance is in `public/ASSET-CREDITS.md`. The hero WebP is 68.7 kB and fonts are self-hosted with their OFL licenses.

The known pricing/publication delay is a separate backend issue. This visual release does not claim its recovery. The scheduled read-only monitor remains active under its existing end time.
