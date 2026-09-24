# Ganymede production release

The current public UI is the product redesign: Markets, USTX detail,
Transparency, read-only testnet Portfolio/Activity, and a separate paper Lab.
The user authorized replacing Clearform and deploying this design. Production
is `ganymede-xlayer`. Read `docs/PRODUCT_RELEASE.md` for the current source and
Worker version; retain the integrated Claude backend/security changes.
Real deposits, withdrawals, custody and payment destinations remain out of scope.

Before deploying, compare the currently deployed Worker against the proposed
build. Preserve later backend/security changes. Never deploy an older checkout
or a stale `dist` directory over the approved design. Build and test from the
current source, preserve remote variables/secrets, and verify Markets, product detail,
Portfolio, Activity, Transparency and legacy redirects on the public URL after deployment.

The 2026-09-24 00:24 UTC release replaced Clearform while adding an identity
header trust check. That check must be retained. Public requests must not gain
operator access from `oai-authenticated-user-email` unless the deployment
explicitly trusts an authenticating edge.

Coordinate releases to this shared Worker. Record the source commit and version
in the deployment message. Other checkouts must integrate current design and
security changes before publishing to this Worker.
