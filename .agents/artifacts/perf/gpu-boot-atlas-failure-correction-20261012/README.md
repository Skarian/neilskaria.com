# GPU boot atlas B1 correction

B1 is corrected in the isolated source stage. This package is ready for root review. No deployment, commit, or push occurred.

The current manifest is `source-manifest.json` in this correction folder. The original prototype manifest remains unchanged and describes the original source snapshot. Do not use that old manifest to upload the corrected stage.

## Change and ownership

Only three staged files changed: `boot-atlas.ts`, `engine.ts`, and `diagnostic.ts`. No source file was added. The source allowlist remains 96 files.

`before/` contains exact bytes of all three files before correction. `snapshot.json` records their hashes. Each snapshot hash matches the original prototype manifest. `correction.diff` shows this correction only. `gpu-atlas.diff` shows the complete candidate against the original 93-file canvas-control stage.

The atlas attaches a rejection observer immediately after creating its readiness promise. That observer records `atlas-readiness-failed`. The original promise still rejects at the existing asset boundary. There is no canvas fallback or successful readiness marker on failure.

Atlas disposal is idempotent and aborts its owned fetch. If decoding finishes after disposal, the bitmap closes. The code does not assign that bitmap or set `needsUpdate`.

The existing asset boundary now has a failure cleanup path. All cleanup references there were initialized before that boundary. The code does not call the returned-room disposer, whose later `sound` binding would be unsafe at this point.

Failure cleanup disposes the atlas first. It drains already-started lightmap, portrait, environment, audio, and shader work before disposing their destinations. It then closes the decoded bitmaps and audio, disposes scene geometry/materials/textures and room helpers, removes the trail, and disposes the renderer with explicit context loss. Finally, it propagates the original readiness error to the existing BootIntro catch.

Success retains the same parallel asset loading and readiness boundary. It adds no startup wait, draw, or moved work. The source identifier changed to `canvas-control-93+gpu-atlas-failure-correction-20261012`. Schema revision and successful diagnostic semantics remain unchanged.

## Verification

- Formatting passes. Svelte-check reports zero errors and zero warnings.
- Four exact-source atlas probes pass. They cover immediate 404, rejected fetch, rejected decode, and disposal during delayed decode. Each preserves readiness rejection and records no unhandled rejection. The delayed bitmap closes once, with zero image assignments and zero update requests. Repeated disposal disposes each atlas resource once.
- Three real-browser failure cases pass through the staged BootIntro and createRoom path. They cover 404, rejected fetch, and corrupt image bytes. The browser reports the expected room-load error once. It reports no unhandled rejection. Failed atlas readiness, room failure, and cleanup markers are present. Readiness and completion remain incomplete.
- Browser observers record geometry, material, texture, and render-target disposal. All observed decoded bitmaps close. The audio context closes. Workers terminate. The trail disappears and START remains unavailable. Program/texture deletion and actual WebGL context loss occur.
- All 109 normal flow checks pass for GPU and will-read-frequently canvas control. They include trusted first START, site, BACK, room, full replay, correct mode markers, and existing controls. GPU counters record one atlas request/submission, zero canvas requests/submissions, and zero boot painting. No screenshots or pixel readbacks occur in these captures.
- Four new sample/download files pass the corrected schema and the original structural schema. The local structural validator is not a complete JSON Schema implementation.

Review `atlas-probes.json`, `browser-failures.json`, individual `browser-failure-*.json`, `local-validation.json`, and `schema-mode-startup-validation.json`. Browser cleanup evidence uses the real room, rather than an atlas-only mock. The delayed-decode race uses exact staged atlas code with mocked fetch/decode and monitored Three resource subclasses.

## Preserved appearance and provenance

`final-verification.json` verifies the exact 96-file allowlist, unchanged main source/HEAD/branch, and every original 93-file canvas-stage hash. It verifies that all other prototype stage files remain identical. The original shader text and preparation function remain identical after newline normalization. PNG, metrics, and boot-screen hashes remain identical.

The original 45 pixel comparisons therefore remain evidence for the unchanged visual implementation. They are not new comparisons or a new fidelity approval. `prior-evidence-hashes.json` inventories the retained original evidence after this task. No correction command writes to those original evidence files.

## Failed checks and limits

The initial folder creation and artifact write failed because of sandbox permissions. Narrow per-command Auto-review approvals succeeded. No refusal occurred and no global-access bypass was used.

Two initial browser checks failed because they required explicit `deleteBuffer` calls. Observation showed buffer creation without such deletion at this boundary. Three does not delete every cached buffer through renderer disposal here. The final check requires disposal calls plus actual context loss. Both initial results and harnesses remain in this folder. This evidence does not measure allocator reclamation or prove separate deletion of every GPU handle.

The first schema check failed at `experiment.sourceId` because the copied prototype schema required the old identifier. The correction schema changes only that constant. The old schema and failure note remain here.

Failure cleanup drains already-started work. A dependency that never settles can delay cleanup completion and error propagation. This correction does not add deadlines or rewrite inherited fetch ownership. Failures before this asset boundary, later initialization failures, and route cancellation while loading remain inherited limits. The atlas rejection remains owned even if earlier room work fails. General initialization cleanup outside this boundary is not claimed.

The atlas-only probe does not establish full-room cleanup during route cancellation. The real-room tests establish the concrete atlas-error path with successful existing prerequisites. No physical-device test, startup causal comparison, allocator measurement, reliability acceptance, or production approval is claimed. Original font, filtering, memory, camera-tail, and startup uncertainty remain.

## Reproduction

Use the installed Node24 executable from the repository root. Run `atlas-probes.mjs`, `check.mjs`, `validate.mjs`, and `browser-failures.mjs` sequentially. Run `python verify-json.py`. Run `finalize.mjs` after owned browsers and servers stop. Do not run the original `prepare.mjs` or `correct.mjs` again. The correction script refuses an existing snapshot.

Root must review this package before a separate deployment task. Upload authorization is absent here.
