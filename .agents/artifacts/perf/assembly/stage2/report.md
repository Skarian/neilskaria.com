# Stage 2: grow the bonsai in a worker

10 October 2026. Baseline `5a9cf09`; candidate `f42be3588781df7bc4c5600c2b14a03a3f9de895` on `perf/bonsai-worker`. No push or deployment. Change statistics: **5 files changed, 643 insertions(+), 298 deletions(-)**.

The worker module starts loading before WebGL initialization, while the GLB downloads. Linear RGB arithmetic keeps the same colours without importing unused colour-conversion code. As soon as parsing finishes, it receives the frozen roots, seed 11 and the original model-to-turntable matrix. It imports only Three's maths and curves, not scene or renderer classes. All 17 arrays return as transferables. Geometry wraps those arrays without copying, including exact Float64 boxes and spheres computed from the packed positions; picking vectors are unpacked in short batches. Shared GPU attributes are uploaded one at a time through an invisible material on a temporary 1-pixel render target, yielding between attributes while the pictures download; no tree pixels are drawn. A 4 ms task budget and real scheduler/timer yields also cover the lazy-loaded fallback. Worker completion, failure and cancellation terminate it; removing the canvas or leaving the document aborts pending work.

Changed: `bonsai.ts`, `engine.ts` (bonsai creation and its model-error cleanup), new `bonsai-generator.ts`, `bonsai.worker.ts`, `startup-queue.ts`. Commits: `15b9e7e0e60cee2fb635c8c2911817807c212e5d`, `4c01e485966b93ec637a6760afd050487ccaf14b`, `7e2f411c0d26b1167aaaca421d4e9b1b6d9f4f57`, `9bd163db26571ad72fc0c74b3f3787a416762754` and `f42be3588781df7bc4c5600c2b14a03a3f9de895`. The temporary Vite cache and type-root changes are excluded.

## Equality and behaviour

- SHA-256 equality for every geometry attribute, lengths, pace, Float64 hubs/nodes, neat lengths, offsets, triangle ranges and both geometry-bound arrays. The bounds are compared with the original Three.js calculations. All **13 Node fixtures** pass: default; bare, neat, overgrown and legacy trimmed saves at 0/2/30 days. Clump geometry and later 2/30-day growth also match. See [hashes.json](hashes.json).
- Actual Edge browser baseline versus worker matches geometry, picking metadata and restored lengths byte-for-byte for default and trimmed 0/2/30-day fixtures. See [browser-hashes.json](browser-hashes.json). Node and Edge have slightly different Float64 curve results; comparisons are made within each engine, where before/after matches.
- Real mouse/touch slashes produce the same shagginess: desktop **1 to 0.9751611760**, phone **1 to 0.9472918548**, with **69/71 clumps**. Watering increases trimmed reach on both devices. Camera, light, material and outline-layer states match. Storage schema, shader masks on layers 3/4, picking and cutting code remain compatible.
- Forced worker-constructor and worker-runtime errors, including a scheduler without its yield method, reach a usable room through the sliced fallback. Canvas removal terminates the worker and never attaches a tree. A deliberately late reply after cancellation is rejected; the shoot mesh count stays unchanged. [Lifecycle result](stale-reply.json).
- The supplied `savedtree.mjs` body, adapted only to the production capture launcher, restores 910 shoots with 546 still shortened and no NaNs or browser errors. Real elapsed growth explains its `same: 0`; fixed-clock restored lengths above match exactly.
- `npx eslint` on all five changed files passes. `npx svelte-check --threshold error` passes, 0 errors/warnings, with temporary local `rootDirs` needed because `$app/tsconfig` resolves through the shared dependency junction. That override was restored. `npx vite build --sourcemap` emits the complete build and then reaches the expected Windows adapter-vercel EPERM symlink error.

## Performance

Lighthouse **13.5.0**, D3D11/GPU-enabled headless Edge; three cold runs per build/device, alternating baseline/candidate. Both builds use the same Vite/SvelteKit preview middleware, gzip and GLB fallback. Both preview servers are warmed equally before opening fresh browser profiles. These are local results, not the owner's incognito score or a CDN comparison. Full run metrics and long-task lists: [measurements.json](measurements.json).

| Device | Median score, before to after | Median TBT ms, before to after |
|---|---:|---:|
| desktop | 53 to 71 | 1051.6 to 346.0 |
| mobile | 40 to 45 | 1762.0 to 1036.0 |

Room-ready uses the supplied `baseline.mjs` and its START detection: desktop 1280x800; phone 412x915, actual 4x CPU, 150 ms latency and 200,000 bytes/s. Three alternating cold runs each.

| Device | Before ms, all runs | After ms, all runs | Medians, before to after ms |
|---|---|---|---:|
| desktop | 1910, 1918, 1954 | 1748, 1965, 1880 | 1918 to 1880 |
| phone | 14199, 14135, 14041 | 14060, 14119, 14123 | 14135 to 14119 |

Procedural generation is absent from the candidate main-thread CPU profile. Sampled inclusive bonsai work falls from 310.6 to 23.9 ms desktop and 1186.9 to 114.8 ms under 4x CPU. This includes preparation, attachment and GPU uploads. The longest receipt-through-upload task is **10.438 ms desktop / 45.402 ms phone**. Overall main-thread peaks are 277/366 ms, outside attachment. The 16 ms phone median difference is small relative to run variation; this passes the no-worse gate, rather than establishing a material speedup. Source-mapped profiles and task lists: [profile-summary.json](profile-summary.json).


## Screenshot pairs

CSS viewports: desktop 1280x800 at DPR 1; phone 412x915 at DPR 2.625 (native captured PNG 1082x2402, renderer DPR capped at 2). The harness fixes the decorative frame time and clock display, while leaving GSAP's clock live. Camera, lighting and materials are equal. Images visually match; raw pixels are not identical. Random dust and small channel-level rendering variation remain. Repeated baseline captures show the same scale of differences: 0.019 to 0.619 mean absolute RGB channel difference out of 255; [repeat statistics](repeat-diffs.json).

| Pair | Before | After | Changed pixels | Mean absolute RGB channel difference, /255 | Pixels with a channel difference >16 |
|---|---|---|---:|---:|---:|
| desktop, wide | [before](desktop-baseline-wide.png) | [after](desktop-candidate-wide.png) | 2,458/1,024,000 | 0.0185 | 438 |
| desktop, close | [before](desktop-baseline-close.png) | [after](desktop-candidate-close.png) | 864,449/1,024,000 | 0.6165 | 302 |
| phone, wide | [before](phone-baseline-wide.png) | [after](phone-candidate-wide.png) | 2,124,734/2,598,964 | 0.6241 | 3,195 |
| phone, close | [before](phone-baseline-close.png) | [after](phone-candidate-close.png) | 2,093,442/2,598,964 | 0.5784 | 2,846 |

Difference images are beside the pairs as `desktop-wide-diff.png`, `desktop-close-diff.png`, `phone-wide-diff.png`, `phone-close-diff.png`; [exact statistics](screenshot-diffs.json). The geometry and clump hashes establish unchanged tree content independently of these small image differences.

Not verified: a physical phone, deployed/CDN audits, or full-renderer cancellation beyond the bonsai worker's lifecycle. Local preview's GLB fallback is retained identically for both builds. The initial batch using a differently compressed snapshot server was discarded; it is not included in these medians.

The implementation worktree and branch remain at `C:/projects/neilskaria.com-bonsai`. Test servers are stopped and the dependency junction is removed before handoff. Full raw audit artifacts, traces, runnable harnesses and logs remain in `%TEMP%/impl/bonsai/`.
