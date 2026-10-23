# Lean canvas hint candidate

Status: Prepared for root review. No deployment or production acceptance.

Source ID: lean-canvas-hint-candidate-20261013. Baseline: a796e9aea60def6e0849cb75a151fd6570942339. This baseline includes approved camera fix 042dc805. Rejected main d82230acab7f4e2be780afd0847330a6926573d1 remains unchanged.

The parent is canvas-context-control-20261012/source-stage. All 93 parent hashes and its exact file set passed before copying. The committed reference hashes also passed. Final source-stage contains exactly those 93 allowlisted paths. It contains no dependencies, build output, policies, private artifacts, authentication files, Git data, or atlas source/assets. Existing allowlisted build configuration remains unchanged.

## Proposed production patch

production-eligible-proposal.patch changes one line in committed baseline engine.ts. It adds { willReadFrequently: true } to the actual screenCanvas 2D context call. The patch contains no diagnostics. It remains a proposal. It was not applied to main or accepted. baseline-engine.ts and proposed-engine.ts retain the two exact texts.

## Diagnostic preview

The omitted query now selects will-read-frequently. ?bootCanvas=default preserves the original context call with the options argument omitted. ?bootCanvas=will-read-frequently explicitly selects the hint. Other values fail with a clear unsupported-mode error. gpu-atlas was tested and rejected. There is no atlas path.

The panel and JSON identify the actual mode and new sourceId. schemaVersion remains 1. schemaRevision is lean-canvas-hint-candidate-1. capture.schema.json includes the sourceId contract.

diagnostic-preview.diff contains the complete candidate diff against committed baseline. parent-stage-delta.diff contains the two-file delta from the verified parent. file-hashes.json lists all 93 parent before/after hashes. committed-before-after-hashes.json also lists all 93 committed before/after hashes. New diagnostic files have null committed hashes. source-manifest.json records final sizes and hashes.

The engine, camera, entry storage logic, fonts, cadence, audio, resolution, and object panels match the parent byte for byte. Removing only the new diagnostic labels produces the exact parent recorder text. Bounds, event meanings, restart, and download behavior remain unchanged. There is no warmup or glyph cache system.

## Checks

Formatting passed. Svelte type checks reported zero errors and zero warnings. The full Vercel build compiled client and SSR output, then failed at Windows symlink creation with EPERM. build-failed.log retains this failure. Packaging and precompression are not cleared.

A separate local-build.config.ts replaces only the adapter with a no-op harness. This local client/SSR build passed. It changes no source-stage file. local-client-ssr-build.log retains the result and existing chunk-size warning. check-work retains build evidence. No package, dependency, or policy changed.

T3 preview_status and preview_open both reported that no desktop automation host was available. The fallback used task-owned headless Chrome and fresh profiles. The smoke used the built local preview, phone viewport emulation, identical room storage, disabled browser cache, and service-worker bypass. Each supported URL started loading then room. No START action or boot sequence ran.

The final smoke passed 47 checks. An injected observer recorded the actual 960x640 context arguments and returned attributes. Explicit default used one argument and returned willReadFrequently:false. Both hint URLs used two arguments with willReadFrequently:true and returned that attribute. Mode/source labels, room state, recorder errors, storage, and absence of atlas requests passed. Separate rejected-gpu-atlas.json confirms the exact atlas mode rejection.

The initial smoke failed because it required all resource responses to succeed. The local preview lacks the compressed Vercel model route. The corrected assertion explicitly allows only the expected bedroom.glb.br 404 and requires successful bedroom.glb fallback. The second attempt failed because the inherited START-css-animation-complete marker was absent. The final smoke preserves the marker semantics and reports its interval as null. Both failure JSON files and cleanup logs remain. These corrections changed only the harness.

## Local startup observations

Final run order was explicit default, candidate default hint, then explicit hint. Create-to-room-ready was 2055.5, 1006.4, and 939.3 ms. Fonts-ready-to-room-ready was 260.0, 185.2, and 180.5 ms. Room-ready-to-START-DOM was 2.3, 1.5, and 1.4 ms. START entry completion remains unmeasured. Earlier failed attempts remain separate.

These are descriptive local observations. They are not a causal comparison or affected-device acceptance. Browser cache settings matched. OS, fonts, GPU driver cache, process order, and device temperature were not controlled. Headless desktop Chrome with phone emulation does not reproduce Android Chrome154 on Adreno740 or actual display presentation.

Root accepted affected-three-mode-analysis-20261013 and affected-three-mode-independent-20261013 as measurements only. The affected-device hint startup was 149.8 ms longer than original in that set. Different entry states and shared cache/order prevent causal attribution. This task does not clear startup neutrality, native raster/GPU/compositor causes, actual display timing, or smaller camera-tail gaps. The atlas remains EXPERIMENTAL.

## Source safety and handoff

final-verification.json confirms all 93 final hashes, exact build inputs, unchanged parent hashes, and unchanged main HEAD, branch, status, and tracked hashes. Production packaging remains unverified. Root must review source/build evidence before any deployment decision. No Git mutation, integration, deployment, account action, or production change occurred. Task browser/server cleanup is recorded.

The first artifact write and process query encountered sandbox denial. Narrow per-command escalation succeeded. No automatic-review refusal occurred. All writes stayed in this new artifact directory, except the separately authorized coordination append.
