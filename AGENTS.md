# Ganymede production release

The approved public UI is Clearform. Use the latest integrated source in this
repository; production is `ganymede-xlayer`. The journey release integrates
`codex/journey-stages-1-3` with the reviewed Claude branch.

Before deploying, compare the currently deployed Worker against the proposed
build. Preserve later backend/security changes. Never deploy an older checkout
or a stale `dist` directory over the approved design. Build and test from the
current source, preserve remote variables/secrets, and verify Overview, Funds,
Portfolio and Proof on the public URL after deployment.

The 2026-09-24 00:24 UTC release replaced Clearform while adding an identity
header trust check. That check must be retained. Public requests must not gain
operator access from `oai-authenticated-user-email` unless the deployment
explicitly trusts an authenticating edge.

Coordinate releases to this shared Worker. Record the source commit and version
in the deployment message. Other checkouts must integrate current design and
security changes before publishing to this Worker.
