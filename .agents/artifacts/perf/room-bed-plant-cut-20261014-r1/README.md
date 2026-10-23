# Room bed + floor-plant geometry cut (r1), 2026-10-14/15

Agent: implementation sub-agent, Claude Opus 5.5 (user-selected). Stage 1 only: a local, artifact-only candidate. **Nothing was deployed, benchmarked or Lighthouse-tested.** No source, Git, ref, index, account, settings or domain change. No install.

Baseline = the deployed c2s source, `../room-nonbonsai-preview-deploy-20261014-r1/upload-stage` (94 files, 2,069,303 B, digest `6588f6b5…7efb`, checked). It is live at https://portfolio-1byb9d6mi-neil-skarias-projects.vercel.app/lab/boot (BEFORE for the follow-up). The main checkout was not used as a baseline.

## Result: accepted candidate `cut-d-ring2`

| | c2s (deployed) | cut-d-ring2 | Change |
|---|---:|---:|---:|
| GLB raw | 881,512 | 833,884 | −47,628 (−5.40%) |
| GLB Brotli (precompress settings) | 688,868 | **645,950** | **−42,918 (−6.23%)** |
| Triangles | 171,378 | 165,933 | −5,445 (−3.18%) |
| Meshes / primitives / materials / images | 76 / 83 / 48 / 11 | 76 / 83 / 48 / 11 | none removed |
| Upload stage (94 files) | 2,069,303 | 2,021,675 | −47,628 |

- Raw SHA-256 `715a369985af1f3555a14192bf8990e6da13a11862a959495c5814918a29a059`.
- Brotli SHA-256 `4f17c81f…4320`, built name `bedroom.DyzOWy32.glb.br`.
- Lightmaps, props maps, the atlas and all code are unchanged. Only `bedroom.glb` differs.

**Honest scale:** the gain is modest, about 43 KB Brotli. Most of the bed was already gone (E's trim removed the duvet, legs, far pillow and cushion; N decimated the sheet). The parts left are mostly visible somewhere. The pot is the only large item, and it is visible at one camera extreme (below).

Per part (triangles / Draco bytes):

| Part | c2s | cut-d | Kept | Why it cannot go further |
|---|---:|---:|---:|---|
| BedFrame | 300 / 1,776 | 105 / 877 | 35% | up to 14,303 px (near-square portrait, cube focus) |
| Mattress | 588 / 3,106 | 184 / 1,270 | 31% | up to 292,290 px (1920×1080, cube focus) |
| Headboard | 300 / 1,712 | 153 / 1,155 | 51% | up to 246,949 px (1920×1080, portrait focus) |
| SheetFold | 776 / 5,328 | 266 / 2,330 | 34% | up to 29,773 px (near-square portrait) |
| Pillow1 | 2,516 / 12,267 | 1,266 / 6,820 | 50% | up to 167,331 px (1600×450 pointer corner) |
| **Bed total** | 4,480 / 24,189 | 1,974 / 12,452 | | bed lightmaps (bed-day/bed-lamp) are still used, so they stay |
| Pot | 7,470 / 91,495 | 4,586 / 56,540 | 61% | up to 20,392 px (820×830 portrait). Removing it whole changes ~19,000 px (rejected) |
| Leaves | 1,939 / 28,661 | 1,884 / 27,743 | 54 of 60 cards | 56 of 60 cards are seen somewhere (lantern focus up to 237,501 px). Whole cards are kept or dropped |

"px" = the largest exact (strict) ID-pixel count of that part in one sampled state, at DPR 1.

## What was found

1. **The app's camera extreme is a near-square portrait window** (aspect just under 1, for example 820×830). That window uses the 70° portrait lens at almost full width. It shows the pot rim (bottom right), the pillow, the sheet fold and the bed frame (left), which no phone or desktop size shows. The bed and pot "invisible from room centre" assumption fails there.
2. **The pot is not invisible.** Up to 20,392 px are visible at 820×830. It cannot be dropped whole. About 39% of it (the lower outside facing the bed, behind the nightstand) never shows.
3. **The leaves are almost all visible somewhere.** Only 6 of 60 cards could go (−918 B).
4. **The bed is visible in small, different corners at different sizes.** The cut keeps those corners plus a margin.

## Method

**Coverage (per-triangle ID pass)** — `tools/tripass.js`, fixture build `stages/fixture`. The fixture is the exact D stage plus one line that exposes `__fx`. It is never a candidate.

- **What gets an ID:** each triangle of the 7 bed/plant primitives is drawn in its own ID colour (slot + triangle index), DoubleSide.
- **What occludes:** every other opaque, *static* mesh is a black occluder with its own side.
- **What is hidden (never occludes):** everything that moves or grows. That is the whole bonsai (GLB parts, procedural foliage, twigs and clumps), the console subtree, and the modelled and runtime cube. Also hidden: transparent materials, points, lines, sprites, and materials with no depth or colour write.
- **Why hiding movers is safe:** it can only raise counts. It also makes the occluders static, so visibility depends only on the camera pose.
- **Margins:**
  - frustum widened ×1.1 (tan(fov/2) and width)
  - ×2 supersampling
  - at every static state, 6 eye offsets of ±0.1 units in camera space
  - a pose fill that interpolates recorded frames (≤0.02 units, ≤0.2° per step)
- **Order check:** triangle order was checked against the Node decode by index and position checksums. They match exactly for all 7 primitives.

**Matrix** — 20 sessions, all passed (0 failures, 0 page errors, Chrome closed with `Browser.close`). See `coverage/union.json`.

- **Sizes:** 1280×800, 390×844, 844×390, 360×800, **820×830**, 830×820, 1600×450, 1280×540, 1920×1080.
- **Edge sessions:** room centre plus 4 pointer corners; lantern, clock, cube, bonsai and portrait focus, each with 4 pointer corners and Back; every transition frame.
- **Path sessions:** room, START → site, BACK TO THE ROOM, replay START → site, every rendered frame.
- **Lantern off:** desktop and phone.

**Plan** (`tools/plan.mjs`): keep = margin-visible triangles + 2 rings of neighbours (sharing a welded vertex). Leaves keep whole cards. Nothing is removed whole.

**Build** (`tools/build-cut.sh`): partial-mesh re-encode, with every other primitive left byte-identical.

1. `donor-cut.mjs` drops the unkept triangles and compacts the vertices. Kept values are untouched. It then re-encodes a throwaway donor with pack.mjs Draco settings (14/10/12, speeds 1/5).
2. `graft.mjs` (N's, copied) splices **only** the 7 cut primitives into the untouched c2s bytes.

**Validation** (`accepted/validate.json`, `tools/validate-cut.mjs`, name-keyed):

- **Non-target primitives:** all 76 have byte-identical Draco data, identical accessor JSON and identical Draco attribute ids, and decode equal value for value.
- **Bonsai:** all 10 Bonsai* primitives are listed with SHA-256 and are identical.
- **Images, nodes, materials:** all 11 images are identical. All nodes match (names, order, TRS/matrix, extras, children). All 48 materials are identical (textures resolved to image + sampler).
- **Cut primitives:**
  - The kept triangle set matches the plan exactly (value-matched, winding included).
  - Largest vertex deviation from the Draco re-quantization: position 6.1e-4 units (0.06 mm); lightmap UV (TEXCOORD_1) 1.1e-4, about 0.06 px on a 512 px map; normals 0.
- **Negative control:** the validator fails a GLB with BonsaiSoil re-encoded (`validation/negative-control-bonsaisoil.json`).

## Verification

**1. Same-frame A/B render check** (`tools/cutcheck.js`). This is the main evidence.

- **What it draws:** in the fixture, the real scene (real materials, lightmaps, lantern, foliage at its current growth and sway, console, cube, dust) is drawn twice in one JS task into 4×MSAA targets: A = c2s geometry, B = the planned cut. Time-driven state is identical, so any difference is caused by the cut.
- **When it draws:** on every rendered app frame, at static states (+6 eye offsets), and in an independent pose fill (different poses from the coverage fill).
- **Coverage:** the same 9 sizes × edge/path, lantern off on desktop/phone, plus a **nearly bare, regrowing bonsai** (saved tree via the app's own storage; screenshot confirms "Bare branches") at 1280×800 and 820×830.

| Check | Runs | Poses | Poses with any diff | Reproduced on replay |
|---|---:|---:|---:|---:|
| **cut-d-ring2 (accepted)** | 22 | 46,215 | 19 (max 37 px, Δ≤15) | **0 of 19** |
| identity control (B = all triangles, cloned geometry) | 7 | 14,933 | 10 (max 12 px, Δ≤15) | 0 of 10 |
| cut-x-r0 (no mesh margin) | 6 | 12,243 | 6 (max 5 px) | **1 persistent: 1 px, pot, 5/5 repeats** (+1 flaky 1/5) |
| rejected: whole pot removed (820×830) | 1 | 3,254 | 1,422 (~19,000 px per room pose, Δ≤249) | — |
| negative control: headboard removed | 1 | 2,737 | 2,008 (up to 143,731 px) | — |

- **Replay** (`tools/repro2.mjs`, `checks/repro/`): every recorded diff pose is re-rendered at rest in a fresh session. Each pose gets one warm-up A/B pair (discarded), then 5 full pairs, then per-cut attribution.
- **What the residue is:** the scattered 1–37 px differences in cut-d and the identity control are an intermittent artifact. It hits the first A/B pair after a camera jump. Several sit on the top screen row or on the Rubik's cube, far from any target. None reproduce.
- **Where the boundary is:** cut-x has one real, persistent 1 px pot difference at the 820×830 extreme. The 2-ring margin of cut-d closes it.

**2. Production-build app captures** (`captures/`, `compare/`). These use real builds with no fixture code. Seeded random, E's storage and waits.

- **Flows:** desktop/phone/phone-landscape full flow (5 focuses + Back, START → site, BACK, replay START → site); lantern off on desktop/phone; 820×830 full; 1600×450 static. Baseline repeats give the noise reference.
- **Health:** all 18 sessions completed. 0 failures, 0 page errors. Every model request was `.glb.br` 200 `br`. The only warning was the known `KHR_parallel_shader_compile`.
- **Room states:** at the baseline-repeat noise level. For example, desktop room centre: candidate 7,444 px vs repeat 6,792 px. The difference images show the clock minute, bonsai sway, dust and portrait water, not the bed or plant (see `compare/cut-d-squarish-portrait-on-room-center.png`).
- **Outliers, inspected:**
  - Phone-landscape lantern focus (180,807 px): a framing/timing difference. The candidate frame was taken mid-zoom. Lantern framing reads only lantern parts.
  - Phone and phone-landscape **site-replay** (~21–23 k px): the CRT scanline phase on the DOM site page.
  - Desktop bonsai-focus differences are below the repeat's (29,784 vs 122,147).
- These captures alone cannot prove pixel identity. Check 1 is the evidence for that.

**3. Full-scene model inspection views** (`full-scene/`). These are **GLB model views, not Blender screenshots**: L's exact cameras and viewer (byte copies), neutral lighting, all GLB parts.

- **Files:** `BEFORE-*.png` (c2s) and `AFTER-*.png` (cut-d), plus side-by-side `SHEET-*.png`.
- **Renderer check:** the BEFORE re-render matches L's c2s render (1 px, Δ1).
- **What shows:** the cut is visible here by design. The bed frame's foot rail and outer side and the mattress foot/side faces are open, the sheet fold is shorter, and the pot's lower front is open. See `full-scene/NOTE.md` and the zoom crops.
- **Not published.**

## Rejected or alternative candidates (kept as evidence)

| Candidate | Rule | Brotli | Verdict |
|---|---|---:|---|
| cut-a-r04-ring2 | ring 2 + 4 cm | 674,510 (−14.4 KB) | Safe (superset of cut-d), smaller gain. Not chosen |
| cut-c-r015-ring2 | ring 2 + 1.5 cm | 664,713 (−24.2 KB) | Safe (superset of cut-d), smaller gain. Not chosen |
| **cut-d-ring2** | ring 2 | **645,950 (−42.9 KB)** | **Accepted** |
| cut-x-r0 | margin-visible set only | 622,652 (−66.2 KB) | **Rejected:** a persistent 1 px pot difference at 820×830, and no mesh margin at all |
| rejected-pot-removed | cut-d + whole pot | 584,539 (−104.3 KB) | **Rejected:** about 19,000 px change at 820×830 |
| trial-desktop-only | desktop-only coverage | — | Superseded: the plan used desktop data only |

## Limitations

- These are finite samples, not a proof of visibility for every pose. Not covered: pointer drags beyond the corners, cube and bonsai turns (movers are hidden in coverage, which is conservative), sizes other than the 9 tested, DPR above 1 (×2 supersampling only approximates DPR 2), real phones and Safari. All "phone" sizes are desktop-Chrome emulation.
- The pose fill runs with the scene at rest and interpolates linearly, not along the eased path. The A/B check also ran at the real per-frame states.
- The ID and A/B passes ignore DOM panels over the canvas. Counts are therefore an upper bound on what a visitor sees.
- The cut geometry is visible in free-camera model views by design. The app has no free camera.
- The deployed-preview checks, Lighthouse and timing are not done here (stage 2). No startup, decode or FPS change is claimed.

## Failures and fixes during the work (records)

- **Redirects:** the first coverage and check matrix launches failed. The log redirect pointed at a folder created by the script itself. Re-run after `mkdir`.
- **Validator:** the first validator compared kept triangles by order. Draco re-encoding reorders vertices and faces, so it now matches by value.
- **Port clash:** one check (`checks/runs/FAILED-START-port-in-use-rejected-pot-removed`) did not start because the port was in use by a concurrent run. Re-run as `-r2`.
- **Background wait:** one background wait was started with a 10-minute limit. It was stopped with TaskStop before it launched any browser, and relaunched.
- **In-run attribution:** the per-cut attribution recorded during runs is unreliable for the intermittent residue. Use `checks/repro/` (warm-up + repeats) instead.
- **Preview host:** T3 `preview_status` and `preview_open` were both called. Both reported no preview automation host (`verification/preview-host.json`), so owned headless Chrome over CDP was used. Chrome's version was read over CDP (154.0.8037.57), not with `--version`.

## Protection and cleanup

- `identity-before.json` = `identity-after.json` (`verification/protection.json`, no differing keys). It covers HEAD, branch, refs, Git index, tracked hashes, git status, ignore files, accepted source, shared node_modules metadata and junction targets, N/E/F/P/D/L digests, D's upload stage and the policies.
- **Stages:** stages are copies of D's stage with per-package junctions (same targets). The baseline server reads N's built c2s stage read-only; its source equals D's upload stage file for file (`tools/check-up.mjs`).
- **Processes:** every owned Chrome closed with `Browser.close` (exit 0, none forced). Servers stopped through their own child handles. Final scan: no process has this folder in its command line, and nothing is listening on 4591–4596 or 9961–9966.

## For the follow-up deployment

- `upload-stage/`: exactly 94 files, 2,021,675 B, digest `0d1d29b7eba209b0e8fee47a93d6ecf7fcb4fb10310fb7aaaf771cf51521a314` (D's formula: lines `path NUL sha256`). Only `src/lib/boot/assets/bedroom.glb` differs from D's stage.
- **Manifest:** `upload-stage-manifest.json`, per-file bytes and SHA-256, including the base values.
- **Build check:** the same 94 files built locally (`stages/cut-d-ring2`: sync 0, build 0). The built Brotli is 645,950 B.
- `accepted/`: `bedroom.glb`, `bedroom.DyzOWy32.glb.br`, `masks.json` (kept triangle lists), `validate.json`, `bytes.json`.

## Files

- `results.json`: all numbers (coverage, checks, replay, capture metrics, bytes, upload manifest summary).
- `coverage/`: union, per-run results and screenshots, per-target strict maxima.
- `checks/`: A/B runs, replay, snaps.
- `candidates/<id>/`: masks, GLB, validate, bytes, inventory.
- `captures/`, `compare/`, `full-scene/`, `validation/`, `inventory/`, `verification/`.
- `tools/`: every script used. Copies of E/F/L/N tools are marked in their headers. New tools: tripass.js, cutcheck.js, cov.mjs, plan.mjs, donor-cut.mjs, cutprim.mjs (built for whole-primitive removal, used only by the rejected pot-removed variant), validate-cut.mjs, repro2.mjs, upload-stage.mjs.
- `profiles/`: fresh Chrome profiles. `stages/fixture` is diagnostic only.
