# Clean atlas validation/profile — stopped, performance inconclusive

Isolated build/type and exact-module lifecycle validation passed. The measured screen stopped after three sessions because the external intro observer watched Svelte's 450 ms delay dummy instead of the following 520 ms pop. Native traces confirm both trusted START inputs occurred during the main pop in every session. No fourth session, automatic retry, fidelity browser session, source revision, preview publication, release, install, commit, push or deployment occurred. This is a harness validation failure, not a demonstrated atlas regression.

## Source and isolation

Atlas: 94 exact manifest files, digest a148564062b30b3fd51326eb023e3bbfa60bc49814323bb198051796092ed40c; original: 91 files from a796e9aea60def6e0849cb75a151fd6570942339. Rejected checkout HEAD d82230acab7f4e2be780afd0847330a6926573d1 was never used as the baseline. PNG: 37034 bytes, SHA256 e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e. All source hashes remain exact. Both stages own normal node_modules directories; individual packages are junctions, scopes are local directories, and $app/.cache/.vite/mutable tooling caches are local. No package copy or install. Main tracked bytes, index, refs, HEAD, input manifests/source hashes, shared $app/cache metadata and dependency destinations/package manifests match before/after snapshots.

Node v24.21.0 at the requested absolute path. Both sync/typechecks pass (0 errors, 0 warnings). Both production client and SSR builds pass with identical external no-op adapter configs; existing >500 kB chunk and NO_COLOR/FORCE_COLOR warnings retained. Production adapter packaging was not tested. Format was not repeated because the runtime94 allowlist had no delta. Emitted JS has no diagnostic recorder/context selector/bootCanvas source. See *-sync/types/build.log, build-inventory.json, source-identity.json and verification.json. Shared main $app tsconfig rootDirs are relative ../.. and ../../.svelte-kit/types; the stage config has identical bytes and resolves to its local root. No inconsistent absolute main path was found; no shared metadata restoration attempted.

## Lifecycle evidence

Five offline probes passed against the exact clean module, real Three Texture/ShaderMaterial subclasses, mocked fetch/ImageBitmap: immediate HTTP404/network/decode failure is owned before the delayed consumer; ready still rejects; pending decode disposal aborts, closes the late bitmap and never assigns it; disposal is idempotent; success retains its bitmap until disposal. These tests do not prove engine cleanup.

Three unmeasured production-engine browser failure conditions ran, once each. Each propagated the original error with no unhandled rejection, closed audio and all observed decoded bitmaps, called program/texture deletion, lost the renderer context, removed the trail and never exposed START. Network/corrupt probes verify every created worker identity was terminated. The initial404 probe failed a harness count equality: 5 workers and 6 terminate calls. Source shows the grower is terminated before the boundary and again in cleanup; later probes use WeakMap identities. Raw404 result remains false; its per-worker identities were not observed, so it is not relabeled a complete pass. Material/geometry disposal, GPU allocator reclamation and general cancellation/earlier-failure ownership are not directly established. See atlas-probes.json, browser-failures.json and failure-harness-correction.json.

## Flow failure, decisive for this experiment

| Session/run | Main pop begins ms | Trusted START ms | Main pop ends ms |
|---|---:|---:|---:|
| o1/1 | 1972.07 | 2061.20 | 2471.16 (idle) |
| o1/2 | 13188.65 | 13258.60 | 13654.26 (idle) |
| a1/1 | 2159.13 | 2245.70 | 2641.67 (idle) |
| a1/2 | 13391.20 | 13447.60 | 13857.51 (idle) |
| a4/1 | 3638.67 | 3811.80 | 4183.41 (finished) |
| a4/2 | 15035.97 | 15076.10 | 15484.93 (idle) |

The idle ends show the intro was interrupted by the click-triggered transition. Even the a4 first pop that finished did so after the click. Captured dummy finishes are **not intro completion** and must not be used as nav/responseEnd-to-intro acceptance numbers. See intro-flow-audit.json and decision-validation.json. External correction proposed: wait for the existing Svelte introend event for each button and verify native animation completion. No runtime change is proposed. A new matched screen requires root's next decision; no additional run was added.

## Preliminary measurements, excluded from acceptance

Order completed: original CPU1 fresh cold profile; atlas CPU1 separate fresh cold profile; atlas CPU4 fresh renderer using the atlas disk profile. Original CPU4 was not run. Same Chrome154/RX590 ANGLE Vulkan, 1280×800 DPR1, native network, storage boot-seen1/room-place room, and identical hook hash. Trusted START/site/BACK/powered return/replay/site completed, but START timing failed above. No screenshot/video/pixel read/serialization occurred in timed windows. Trace began before navigation, used ReturnAsStream, reached EOF and loss=false for all three sessions. All CPU/network throttle commands succeeded. Max clock residuals: o1 0.12 ms; a1 0.38 ms; a4 0.82 ms. **a4 exceeds the required <0.5 ms**, independently excluding it. External wrapper overhead is measured below; CPU4 includes frames >1 ms. No callback grouping into 5 ms pseudo-frames was used.

3150 ms window begins at original visible N paint or atlas first default-framebuffer screen draw with existing powered>0 and colours[0].alpha>0 uniform state. Marker events were matched to native FireAnimationFrame spans. These markers measure different native boundaries; no fabricated atlas glyph clock. All distributions, separate camera prefix/fade/handoff/return windows, missing/clipped task bounds, native service spans, API calls and resources are retained in runs/*/analysis.json and measurements.json. Fully-contained RunTask tdur sums form the CPU lower bound; missing/clipped tasks add clipped wall to the upper bound. Native service totals can nest and must not be added to renderer CPU. Statistical V8 profiling samples in traces are separate and were not converted to CPU durations.

| Session/run | rAF mean ms | p95 ms | max ms | gaps ≥25/≥42 | renderer CPU lower–upper ms | max wrapper overhead ms |
|---|---:|---:|---:|---:|---:|---:|
| o1/1 | 16.67 | 16.70 | 16.80 | 0/0 | 603.97–607.99 | 0.50 |
| o1/2 | 16.67 | 16.70 | 16.80 | 0/0 | 526.44–529.78 | 0.40 |
| a1/1 | 16.67 | 16.80 | 16.80 | 0/0 | 381.85–383.97 | 0.60 |
| a1/2 | 16.67 | 16.80 | 16.80 | 0/0 | 365.00–367.42 | 0.40 |
| a4/1 | 16.67 | 16.70 | 16.80 | 0/0 | 446.21–457.62 | 2.00 |
| a4/2 | 16.67 | 16.70 | 16.80 | 0/0 | 441.97–450.63 | 2.00 |

CPU1 native selected callbacks average ~16.66 ms for both variants, with no ≥25 ms gaps. Virtual presentation has one 33.33 ms original first-boot interval and no ≥25 ms atlas intervals; one interval does not establish regression. Lower atlas text CPU is an exploratory observation under invalid input timing, not advancement evidence. Atlas CPU4 lacks a matched original and fails clock/overhead requirements; no CPU4 comparative conclusion.

Cold nav-to-START-DOM: original 1371.80 ms, atlas 1674.30 ms; response-normalized original 1340.60 ms, atlas 1333.30 ms. The roughly 302.50 ms increase is unresolved, not an attributable atlas startup penalty. Single order, driver/OS caches, and incomplete flow prevent acceptance. Atlas native fetch/decode overlapped startup; decode 39.80 ms, initial upload API wall 6.00 ms followed by one mipmap call. Do not add overlapping durations. Existing compile/link/query spans and longest renderer task are retained; actual GPU duration/first-use hardware wait are not measured. Program hashes and native service groups are recorded, but native service program identity is not completely attributed.

One atlas image upload and one mipmap call occurred before START in each atlas session; **zero later boot texture upload/mipmap calls** across first/replay/return. Other asset calls remain separate. ImageBitmap remains open in timed successful sessions (module probes establish closure on disposal). Observed dims2048×1024; actual allocated internal format/mip levels were not queried. Raw texSubImage2D internalFormat field is an argument-position artifact (offset), not format proof. Nominal mip storage10.67 MiB plus retained bitmap8 MiB versus original3.125 MiB; actual VRAM/allocation/physical presentation unmeasured.

Delivery: existing .glb.br path, Content-Encoding br, encoded body965768 bytes and decoded1183392 bytes with hash4d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4, both variants. No compressed404/raw-model fallback. Actual resource bodies/hash/status/cache and CDP encodedDataLength (includes protocol/header effects) are retained per run; exact encoded/decoded model inventory in build-inventory.json. Native O/A total CDP encoded bytes 2926537/2968057; warm atlas CPU4 9235 bytes with 33 disk-cache responses. Header-case validation falsely rejected o1; validation-corrected.json certifies captured delivery while keeping result.json unchanged. Emitted atlas JS delta is recorded in build-inventory.json; atlas asset37034 bytes. CPU/cache states are confounded; order reversal was not completed, and none of these runs proves startup neutrality or population reliability.

## Limits and cleanup

Fixed-animation-time fidelity was not attempted after the decisive flow failure. Existing45-comparison artifacts remain read-only; this run does not validate edges/clipping, audio/camera fidelity, normal route-disposal browser bitmap lifetime or mobile/Safari behavior. No physical mobile verification attempted, so no device installation/listing was needed. Module source/metrics/shader/preparation identity is protected by exact source hashes, not visual equivalence.

T3 preview_status and preview_open explicitly returned no host; owned Chrome/CDP fallback used. All owned Chrome processes exited0 without force; owned servers terminated; CDP9923 and server4389 no longer respond. Profiles are retained only inside this new owned folder. No private profiles/tabs/credentials touched. See cleanup.json. Sandbox denied initial artifact write and snapshot write; narrow per-command Auto-review retries succeeded. No refusal/bypass/blanket access occurred. A report-correction write used a mistyped nonexistent path and failed before creating a file; it was corrected to this owned folder. The stale whole node_modules junction was never used. All work stayed in this owned new folder and all protected snapshots match.

**Decision:** build/type/module lifecycle evidence is usable with the noted actual-engine observation limits. Performance/fidelity acceptance remains inconclusive. Stop here; root decides the next corrected bounded experiment/preview.
