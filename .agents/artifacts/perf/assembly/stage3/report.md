# Stage 3: break up remaining preparation

Final `23a979c`, base `c80ddc9`, branch `perf/stage3`. No push, merge or deploy. Fresh c80ddc9 CPU/Lighthouse measurements preceded changes. Final results below use only the final revision, with every valid sample retained.

The existing `breathe()` and `upload()` now separate context creation, audio setup, cube construction, each picking hull, material compilation and first-use mesh preparation. Shader submissions retain `compileAsync`/KHR parallel completion; baked programs and texture uploads overlap downloads/compilation. Large shared attributes upload once; small buffers warm with their meshes, two at a time, under a one-pixel scissor. A complete frame is still drawn behind the loader before START.

Generated asset: the existing `bedroom.glb` gains 151 console hull vertices / 298 faces in SP extras, +12,368 bytes (+3,295 Brotli), with no extra request. Its original binary chunk and all other JSON are byte-identical. The 56 added packer lines reproduce the existing grid on Draco-decoded positions and replace only GLB JSON; this is the main reason the diff exceeds a few dozen lines. All seven picking shapes match 2,000 support directions on each viewport exactly.

## Final alternating A/B

Fresh headless Edge/D3D11; Lighthouse 13.5.0 simulation. Each label rebuilt, same port 4240, HTTP 200 before browser launch, owned server stopped between labels. Four mobile and two desktop audits each; three phone and desktop `baseline.mjs` runs each, alternating by label. All audits have no warnings; all readiness runs have 51 requests, one document and no runtime exceptions. Preview serves the uncompressed GLB after its `.br` fallback, so these are local measurements, not deployed transfer claims.

| Profile | Before median TBT / score | After median TBT / score |
|---|---:|---:|
| mobile | 1057.7 ms / 45 | 647.85 ms / 52 |
| desktop | 366 ms / 68.5 | 248.5 ms / 76 |

E = engine chunk; U = Lighthouse Unattributable; P = page/route URL (hydration and layout). Task durations are Lighthouse simulated milliseconds, sorted as reported; U tasks include app graphics calls and browser work, so this list is not a chronological profile. Raw audit JSON and source-mapped actual task ledgers are alongside this report.

| Profile / label / run | TBT ms | Score | Long tasks (ms) |
|---|---:|---:|---|
| mobile / baseline / 1 | 1055.4 | 45 | 569E, 523E, 515U, 423U, 147U, 111E, 96P, 74U, 52E |
| mobile / baseline / 2 | 1060 | 45 | 692E, 544U, 421E, 169U, 158U, 115U, 95E, 83P, 67U, 52E |
| mobile / baseline / 3 | 1250.4 | 44 | 627U, 504E, 414E, 299U, 281U, 179U, 117E, 95P, 79U, 67E, 50U |
| mobile / baseline / 4 | 959 | 46 | 605E, 535U, 384E, 311U, 172U, 105E, 92P, 65E, 55U |
| mobile / candidate / 1 | 651 | 52 | 511E, 386U, 240U, 156U, 156U, 100U, 100U, 97P, 79U, 57U, 51U |
| mobile / candidate / 2 | 650 | 52 | 509E, 404U, 346U, 207U, 134U, 125U, 119U, 89P |
| mobile / candidate / 3 | 614 | 53 | 517E, 371U, 216U, 183U, 117U, 110U, 92U, 82P, 53U |
| mobile / candidate / 4 | 645.7 | 52 | 503E, 342U, 216U, 187U, 183U, 135U, 109U, 71P, 52U |
| desktop / baseline / 1 | 415 | 66 | 377U, 146U, 123E, 65U, 59U |
| desktop / baseline / 2 | 317 | 71 | 309U, 143U, 108E |
| desktop / candidate / 1 | 258 | 75 | 295U, 119U, 68U, 63U |
| desktop / candidate / 2 | 239 | 77 | 289U, 94U, 55U |

| Room-ready profile | Before runs ms (median) | After runs ms (median) |
|---|---:|---:|
| phone | 14413, 14041, 14255 (**14255**) | 14026, 13839, 13895 (**13895**) |
| desktop | 1908, 1808, 1858 (**1858**) | 1902, 1805, 1771 (**1805**) |

## Work measured and trade-offs

Initial fresh c80ddc9 phone profile (actual 4x CPU, not Lighthouse simulation): audio + cube continuation 275.4 ms (sampled cube 59.1 ms, audio 144.8 ms); picking task 302.5 ms; invisible upload 114.1 ms; main shader submission 269.0 ms; complete warm render 311.1 ms. Initial ledgers are retained in `%TEMP%/impl/stage3/baseline-initial/`.

Final phone run 1: cube's largest step 33.3 ms; largest remaining runtime hull 93.1 ms; invisible upload 45.8 ms; first shader/framing task 55.8 ms, later extra variants 35.5 ms; largest texture upload 62.6 ms; warm batches up to 44.2 ms and complete render 37.4 ms. These are task durations including library work, not isolated function benchmarks. Final unfiltered ledgers for all runs are included, with separate source attribution.

Final desktop run 1: context/setup 315 ms; audio 106.2 ms; GLTF continuation 38.2 ms; cube step 10.1 ms; runtime hull 18.9 ms; texture uploads 64.0 / 16.9 ms; first-use program checks 25.5 / 12.1 / 28.4 ms. Native program reflection still appears in the complete render, so warming reduces that task rather than eliminating all first-use checks.

Only the console hull warranted generated data. The procedural cube hull remains: preserving its rounded puzzle geometry at pack time would duplicate runtime construction; an enclosing box changes picking. Other individual ConvexGeometry calls are smaller and cannot be yielded inside without replacing the library algorithm. Tiny attribute-by-attribute preparation and shader-only warm-up were rejected: added yields or missed buffers worsened readiness. The final mesh batches preserve the whole scene and do not inspect Three.js private program properties.

Audio stays before ready, in its own task after the decoder/worker have launched. Fresh context trials: constructor 97.9/120.4/106.8 ms during preparation, then gesture-to-next-frame 13.2/12.5/12.6 ms. First-gesture construction: constructor 75.6/74.9/96.1 ms, next frame 76.2/75.3/96.8 ms. First-gesture deferral was rejected. Post-ready setup was not implemented: the earliest START would race that same native constructor (inference). Audio fully decodes before START; resume remains in the user gesture. Graphics no longer waits for the chime download before shader submission.

Remaining work above the ~10 ms observed target includes indivisible WebGL/AudioContext creation, individual native texture uploads/program reflection, GLTF/Draco loader continuation, runtime ConvexGeometry and Svelte hydration/layout. No general scheduler, queue, lifecycle wrapper or new cancellation machinery was added. This is a reduction in blocking, not a guarantee that every startup task stays below 10 ms.

## Appearance and behavior

Six settled pairs (wide room, bonsai, cube at 1280x800 and 412x915): **0 changed pixels, 0 maximum channel delta, 0 mean channel delta**, exact dimensions. Clock/date and dust were fixed using capture-only hooks; all hooks were restored before the measured production builds. Both labels' screenshots, `pixels.json`, `hulls.json` and asset equality evidence are included.

Desktop mouse and phone touch checks passed: START/Game Boy boot and return, each object focus, cube turn/scramble/solve, bonsai trim, lantern colour/brightness, clock radio tuning/display, focused-object and ready SKIP, mute/unmute. The actual START gesture resumes audio; the decoded boot chime starts 2.801 s / 2.800 s later on desktop/phone, matching the unchanged 2.8 s timeline. No runtime exceptions.

Stage 1 harness checks passed: SKIP during held engine download and after ready, return/Escape, START during `?land=2`, reduced-motion loading and reduced-motion first visit. Early pre-hydration SKIP hides the layer in 3.1/6.5/1.8 ms, with no room flashes and successful return. One supplied early `tap-repeat` scenario waited 246.2 ms for its next frame; do not infer a universal fast-paint guarantee from the passing state checks. That harness label does not itself issue multiple taps.

ESLint passes for engine, cube and packer. `svelte-check --threshold error`: only the documented `+layout.svelte` missing `./$types` junction error, no other errors/warnings. Sourcemap builds produce complete output and end with the expected adapter-vercel EPERM symlink error. No audible listening, physical-phone or deployed/CDN checks; those remain unverified.

## Commits and diff

`git diff --shortstat c80ddc9`: 4 files changed, 172 insertions(+), 23 deletions(-). Only engine, cube, packer and the generated GLB are changed; local Vite cache setting is excluded.

- `40b88f4` Skip bounds scans for invisible buffer uploads
- `bec9036` Give audio setup its own task during downloads
- `e5288b5` Build the cube in a few steps
- `4f5a564` Pack the console's click shape and build the other hulls separately
- `c2bf1ba` Prepare shaders and warm the room in small batches
- `1987e84` Keep the cube's public type tied to the completed puzzle
- `d03d67b` Warm each shader once and leave small buffers with their meshes
- `37c52de` Prepare each material without drawing its children twice
- `af7e03b` Upload pictures while the shaders finish compiling
- `5ae3406` Prepare shaders while the lightmaps are still downloading
- `66b374f` Leave the bonsai's prepared buffers out of the second pass
- `6d75518` Compile baked surfaces before the reflections arrive
- `b601e29` Let the decoder and bonsai worker start before audio setup
- `6a30f74` Prepare graphics while the chime is downloading
- `eb0f35b` Warm shared shader programs only once
- `3f627a8` Let the page breathe after creating the graphics context
- `63ba073` Describe the compiled program stored by Three.js
- `23a979c` Warm all visible geometry in small scene batches

All commits end with `Co-Authored-By: GPT-6.1 Sol <noreply@openai.com>`. Worktree junction/cache and owned servers are cleaned up before handoff.


