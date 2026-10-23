# Bed + floor-plant cut: preview, hosted checks, F1, Lighthouse and room-ready benchmarks (r1), 2026-10-15

Agent: test sub-agent, Claude Opus 5.5 (user-selected). Stage 2 of the cut work. I started no child agents. I made no merge, commit, push, production, account, domain, settings or Git-connection change, and no install. Nothing was uploaded from the main checkout.

## Deployment (user-authorized, one preview)

**https://portfolio-z1jbr6jar-neil-skarias-projects.vercel.app/lab/boot**

- `dpl_GSXdc9paoabAXGkH5TsSiQqFVrkM`, **READY**, target preview, project `portfolio` (QmTWQ3SU…PowRw), scope `neil-skarias-projects`.
- Inspector: https://vercel.com/neil-skarias-projects/portfolio/GSXdc9paoabAXGkH5TsSiQqFVrkM
- BEFORE (baseline) = c2s preview https://portfolio-1byb9d6mi-neil-skarias-projects.vercel.app/lab/boot (`dpl_Dxn4EkThRtiYLCDP66mfLgdeRysZ`). It is still READY.
- How it was deployed:
  - `tools/deploy.mjs`, a copy of D's: CLI 62.4.0 on Node 24.21.0. Child-only env `GIT_CEILING_DIRECTORIES=S`, `GIT_OPTIONAL_LOCKS=0`.
  - Hosted source build, no `--prebuilt`. One dispatch, exit 0.
  - Vercel downloaded 94 files and restored the build cache from Dxn4EkTh. Only 814.3 KiB was uploaded, which is the new GLB.
  - The build log shows `precompress: bedroom.DyzOWy32.glb 833884 -> 645950 bytes`.
  - Warnings: the same known ones as D (runed peer dependency, chunk size, "deploy subdirectory?") plus npm "Unknown env config cache-dir". Logs are in `deploy/`.
- Upload stage `upload-stage/`:
  - It is an owned byte copy of R/upload-stage (`tools/stage.mjs`). I copied it so CLI metadata could never touch R.
  - 94 files, 2,021,675 B, digest `0d1d29b7eba209b0e8fee47a93d6ecf7fcb4fb10310fb7aaaf771cf51521a314`.
  - Compared with D's actual stage, only `src/lib/boot/assets/bedroom.glb` differs (833,884 B, `715a3699…a059`). The atlas is unchanged.
  - It contains no .agents/.git/.vercel/node_modules or compressed files. A marker scan found no fixture or diagnostic strings (`__fx`, cutcheck, tripass and others) in any source file.
  - It was checked before the upload and again at the end (`verification/stage-copy.json`, `stage-final.json`), exact both times. Vercel wrote no `.vercel` folder into it.
- Served bytes (`verification/raw-brotli*.json`, checked at the start and at the end):
  - AFTER `bedroom.DyzOWy32.glb.br`: 200, `br`, **645,950 B, SHA `4f17c81f…4320`**. This equals R/accepted.
  - BEFORE: 688,868 B, `6fc32912…452a`. Unchanged.
- Preserved: the old c2s preview and the trim preview d8ciaj66d are READY (`verification/inspect-*-{initial,final}`). The production list is unchanged (`ls-production-*`).

## Hosted behaviour

T3 `preview_status`, then `preview_open`: both reported no preview automation host (`verification/preview-host.json`). I used owned headless Chrome 154.0.8037.57 over CDP. The version was read over CDP; `chrome.exe --version` was never run.

- **Functional sessions** (`tools/session.mjs`, D's with the new hash plus phone-land), at 1280×800, 390×844 and **844×390**: all **pass**.
  - Trusted START → site → BACK TO THE ROOM → lantern open/close → radio open (`playing`, ON AIR) → close → replay START → site.
  - 0 page errors, 0 rejections, 0 CDP exceptions, 0 local or external failures.
  - No diagnostic globals, controls or bundle markers.
  - Model `.glb.br` 200 `br`. Decoded 833,884 B, SHA `715a3699…a059`. No raw `.glb` request.
  - The atlas PNG and all 10 WebPs (8 private maps + props) match.
- **F2, phone-landscape lantern focus recaptured at rest** (`tools/hostcap.mjs`, `hosted-captures/`, `hosted-compare/`):
  - **Settle rule:** screenshots every 250 ms. A view counts as settled after ≥ 1.4 s (the focus tween is 1.1 s), with the focus/back state matching, and with 4 consecutive frame pairs each at ≤ 1.5% of pixels changing by Δ > 16.
  - **Why 1.5%:** the measured idle floor from dust, flicker and sway is 0.6–0.75%. Camera motion is above 30%.
  - **First attempt:** at 0.2% nothing ever settled. That run is kept as `FAILED-threshold-0.2pct-land-B1`.
  - **Runs:** B1, A1 and B2 (the baseline repeat). After two outliers I added one bounded extra A2.
  - **Lantern focus:** A1 vs B1 is 19,114 px; A2 vs B1 is 5,311 px; the repeat B2 vs B1 is 20,727 px. All states settled (about 3.7 s). **The views match at noise level.** The stage-1 180,807 px figure was a mid-zoom capture.
  - **Clock focus outlier:** A1 vs B1 is 34,756 px against a repeat of 35. It is run-to-run variance in the app, not the cut: A1 vs A2 on the same build differs by 36,017 px, and A2 vs B1 is 4,331 px. The diff is edges only, a small camera offset, and the clock has no cut parts. `thingOf` maps no cut mesh to any focus object, so focus framing cannot depend on the cut.
- **Square 820×820 DPR 2** (B1, A1, B2, A2):
  - Room centre, pointer-tr and cube focus all settled.
  - **Room and pointer views:** the candidate is at the repeat level with A1 (5,693 / 5,509 vs 5,613 / 5,866). A2 is higher (about 15.7 k). Its diff covers the clock digits (12:56 → 1:00), bonsai sway, the portrait edge and dust, not the bed or plant.
  - **At exactly 1:1 the app uses the landscape start view,** so the bed and pot are out of frame. The 820×830 extreme is not reached here.
  - **Gap 1 — lantern click missed:** the lantern click point (scaled from 820×830) missed at 820×820 in all 4 runs. That state is recorded as unsettled with no focus.
  - **Gap 2 — "focus-bonsai" opened the lantern:** that click opened the **lantern** focus, so the state named `focus-bonsai` is a lantern view. Its diffs (44 k / 76 k vs repeat 6 k) are edges across the whole frame: a camera offset plus the bonsai, regrown by an unseeded worker. The bed and plant are not involved. Bonsai focus itself was not captured at 820×820.
  - **Known difference:** the bonsai regrows in every fresh profile because the worker is not seeded.

## F1: same-frame check of the ACTUAL encoded GLB (new)

`tools/f1.js`, `tools/f1.mjs`, `tools/f1-server.mjs`, output in `f1/` and `f1-control/`.

- **Fixture:** R/stages/fixture, served read-only, plus one diagnostic route for R/accepted/bedroom.glb.
- **Decoding:** the 7 encoded primitives are decoded in the page with the bundle's own GLTFParser and a fresh instance of its DRACOLoader class.
- **Render:** A (live c2s), B (encoded) and C (R's planned index subset) are drawn in one JS task into 4×MSAA targets. That is 17 targeted poses × (1 warm-up + 3 repeats).
- **Poses:**
  - 820×830: room, pointer-tr (where the sheet is most visible), pointer-br, cube focus
  - 844×390: room, lantern focus, lantern + pointer-tl
  - 1920×1080: cube, portrait and lantern focus
  - 1600×450: pointer-tl
  - 820×820 at DPR 2: room, pointer-tr, cube focus, bonsai focus
  - 1280×800 at DPR 2: room, lantern focus

**Result: the encoded candidate is NOT pixel-identical to c2s.** C = A at 0 px in every pose, so R's planned-subset evidence still holds. But B ≠ A, and B is what ships.

- **Stability:** the differences are stable (the same count in every repeat and the warm-up). They are attributed only to the cut primitives, mainly Mattress, Headboard, SheetFold and Pillow1, plus a few pot or leaf pixels.
- **Size:** up to 71,218 px (1920×1080 cube focus). At 820×830 room it is 16,816 px; at 844×390 room, 6,784 px; at lantern focus, 1 px; at 820×820 DPR 2 room, 3,736 px.
- **Size of each change** (`f1/hist.json`):
  - more than 99% of the changed pixels change by ≤ 2 of 255 levels (`f1/img/*-dAB8x.png` shows faint contour banding on the bed surfaces)
  - at most 31 px per pose change by more than 8
  - at most 3 px change by more than 16 (max 25), and those are isolated sub-pixel silhouette pixels (`f1/crop-*.png`)
- **No holes** appeared at these poses.
- **Cause:** Draco re-quantization of the re-encoded primitives. R's `validate.json`: position ≤ 6.1e-4, TEXCOORD_0 ≤ 4.1e-4, TEXCOORD_1 ≤ 1.1e-4, normals 0.
- **Pipeline control** (`f1-control/`): decoding the **c2s** GLB through the same path gives A−B = 0 px at 4 poses, so the differences are real.
- **Production captures:** the hosted A/B app captures above are noise-limited, so they cannot see 1–2-level shading shifts. This is why they did not show this.
- **Setup took longer than the 10-minute timebox:**
  - Run 1 failed on a CDP evaluate timeout. The app calls `draco.dispose()` after load, and its wasm binary was transferred to the first worker, so reusing that loader hangs.
  - Run 2 hit a bug in my snippet (`delete r._bufs` removed the kept buffers).
  - Both are kept as `f1-FAILED-run*`. The debug sessions are `f1-debug-*`. All Chrome instances closed with exit 0.

## Benchmarks (user request)

All runs were sequential, after every check had closed. No build, capture or second browser ran at the same time. Lighthouse 13.5.0 was reused read-only from D's task-local install. Chrome 154.0.8037.57 and Node 24.21.0 (the deploy/inspect/Lighthouse/room-ready runner). Fresh profile per run.

- **Edge warm-up**, D's method, before each batch (`lighthouse/warm-*.json`): HTML plus 36 same-origin assets (37 URLs), 2 passes per site, each site's own URLs. All 200 and 36 HIT on each side. The `/lab/boot` HTML is MISS on both, as in D (SSR).
- **Lighthouse**, mobile default and `--preset=desktop`, order B,A,B,A,B,A:
  - **12 of 12 valid.** No runtimeError, no runWarnings, document 200 on the right host. Every run fetched the right model and all 8 private maps. Benchmark index 2746–2856.
  - **The LCP element in all 12 runs is the "NEIL SKARIA" H1 intro, not the room.**
  - Raw `.report.json` and `.report.html` files, stdout/stderr and `.run.json` are in `lighthouse/{mobile,desktop}/`.

| Median (range) | Mobile B | Mobile A | Desktop B | Desktop A |
|---|---|---|---|---|
| Score | 61 (48–64) | 61 (58–63) | 93 (92–98) | 94 (92–95) |
| FCP ms | 2016 (2011–2087) | 2013 (2008–2015) | 550 (484–559) | 546 (544–565) |
| LCP ms (simulated) | 9075 (6881–9081) | 8703 (6784–8850) | 1632 (588–1686) | 1363 (1345–1659) |
| LCP ms (observed paint) | 618 (585–1474) | 579 (579–604) | 650 (616–788) | 631 (616–649) |
| Speed Index ms | 4261 (4260–5601) | 4254 (4154–4426) | 1427 (1425–1485) | 1419 (1413–1451) |
| TBT ms | 421 (365–924) | 429 (365–594) | 34 (0.5–67) | 19 (18–79) |
| CLS | 0 | 0 | 0 | 0 |
| Total transfer B | 1,594,324 | 1,551,303 (−43,021) | 1,654,468 | 1,611,421 (−43,047) |
| Main-thread ms | 4194 (4042–5468) | 4090 (3991–4588) | 1047 (1011–1097) | 1063 (1022–1115) |

- **What changed:** only the bytes, by about 43 KB in every pair.
- **Timing:** every timing range overlaps. **No Lighthouse speed or score gain is shown.**
- **Simulated vs observed:** simulated LCP swings by seconds between runs of the same build. The observed paint of the H1 does not depend on the model.
- **Main thread:** main-thread time is a measurement only. In this batch it is slightly lower on mobile and slightly higher on desktop, with overlapping ranges. It is not CPU-cause evidence in either direction.

**Room-first readiness:**

- **Tool:** `tools/roomready.mjs`, D's, with the intro hook tightened to count only START's own introend (`event.target === button`). No bubbled introends occurred.
- **Setup:**
  - Real CDP throttle: 150 ms latency, down (1638.4×1024)/8 B/s, up 675×1024/8 B/s, CPU 4×. 412×823 at DPR 1.75, mobile.
  - Deliberate returning-visitor state: `boot-seen=1`, `room-place=room`. This is different from the first-visit flow Lighthouse measures.
  - 5 B + 5 A, alternating, fresh profile and cache per run, warmed edges.
- **Validity:** all 10 valid. Each fetched the right model file and 8 maps, with exactly one own introend and 0 exceptions, failures or rejections. Browser.close exit 0 every time.
- **Kept per run:** `result.json` and `start-ready.png` (correct START-ready room).

| ms, median (range) | B (c2s) | A (cut) | Median Δ | Pairs A−B |
|---|---|---|---|---|
| START own introend | 11,529 (11,378–11,610) | 11,354 (11,100–11,486) | −175 | −24, −125, −356, −428, −146 |
| GLB response end | 6,554 (6,436–6,685) | 6,330 (6,142–6,522) | −224 | −89, −32, −294, −435, −336 |
| Last private map end | 8,113 (8,014–8,239) | 7,886 (7,714–8,073) | −227 | −102, −40, −300, −430, −351 |
| responseStart | 273 (89–369) | 250 (132–467) | −23 | +256, +194, −42, −78, −120 |
| loadEventEnd | 1,482 (1,369–1,571) | 1,448 (1,311–1,671) | −34 | |
| Long tasks (count / total) | 18 / 2,765 | 18 / 2,737 | | +63, −155, +28, −131, +59 |
| GLB transfer B | 689,168 | 646,250 | −42,918 | |

**Reading:**

- **Bytes:** the byte saving is certain: −42,918 B on the model, and about −43 KB of page transfer.
- **Expected effect:** at this throttle that is about 0.20 s of download.
- **Observed:** all 5 pairs were lower, with a median of −175 ms. That fits the expected size.
- **Why it is not established:** the B and A ranges overlap. Document response jitter alone was −120…+256 ms between pairs. With 5 pairs this is **not shown to be a speed gain beyond run-to-run variance**.
- **Not claimed:** no FPS, animation or decode claim. This is a much smaller effect than the earlier, separate 1.4 s c2s gain (about 281 KB of maps). That older figure does not apply here.

## Correction to R's README (made here only, R is unchanged)

R says "56 of 60 cards are seen somewhere". The correct statement is: **44 cards strict-visible, 54 margin-visible, of 60; 54 kept.** 56 is the kept count of `cut-a-r04-ring2` (review Q1).

Review F3 still stands: the coverage is finite samples, not a universal proof. Untested: pointer drags beyond the canvas, aspect above about 3.9, real DPR 3 phones, Safari and physical devices.

## Recommendation (the decision is the user's)

**Lean: do not merge now. The preview is fine to keep.** If merged, merge only with the provenance note. Confidence: medium.

- **For merging:**
  - −42.9 KB Brotli on an asset every room visitor downloads (−6.2% of the model, about −2.6% of page transfer).
  - No functional regression on the preview.
  - Room views are at the noise level, and the landscape lantern (F2) recaptured clean.
  - Room-ready moved the right way in 5 of 5 pairs, by about the expected 0.2 s.
- **Against merging:**
  - No measurable Lighthouse gain. Room-ready gains are within variance.
  - The asset is hand-derived: any re-export or `pack-room` run drops it silently.
  - Any camera change (start views, focus framing, sway, aspect rules) can open holes, with no test guarding it.
  - New from F1: the shipped asset is not pixel-identical. The change is tiny (1–2-level shading, isolated edge pixels), but "identical at the tested poses" applies only to the planned subset.
- **If the user wants it anyway:**
  - Merge `upload-stage/src/lib/boot/assets/bedroom.glb` (SHA `715a3699…a059`) alone.
  - Add the provenance from `provenance.md`.
  - Treat coverage → plan → build → validate → F1-style encoded check as required after any camera or model change.
  - Nothing has been integrated.

## Files

- `comparison.html`: self-contained comparison of R's full-scene before/after (two angles, absolute `C:/` image paths), benchmark medians and ranges, and limits. Not published. Root will review and publish.
- `summary.json`: built by `tools/collect.mjs` from the raw records.
- `provenance.md`: base SHA, masks, recipe and tool hashes.
- `deploy/`: the deployment record.
- `verification/`: stage, raw Brotli, inspect, production list, preview-host and protection records.
- `hosted-{desktop,phone,phone-land}/`, `hosted-captures/`, `hosted-compare/`, `f1*/`, `lighthouse/`: evidence and raw reports.
- `tools/`: every script used. Copies of D/R tools say so in their headers. New tools: f1.js, f1.mjs, f1-server.mjs, f1-debug.mjs, f1-hist.mjs, f1-crop.mjs, hostcap.mjs, hostcmp.mjs, collect.mjs, and identity.mjs (extended).
- Chrome profiles are kept. The folder totals about 2.8 GB, mostly profiles in `lighthouse/` (558 MB), `f1/` (425 MB) and `hosted-captures/` (740 MB).

## Protection and cleanup

- **Identity:** `identity-before.json` = `identity-after.json` (`verification/protection.json`: unchanged, no differing keys). It covers HEAD `d82230a` on `redesign`, refs, Git index, tracked file hashes, git status, ignore files, accepted source, shared node_modules metadata and junction targets, N/E/F/P/D/L/R digests, the review and r10 folders, the D and R upload stages, R/accepted, and the policies. Git reads used `--no-optional-locks`.
- **Browsers:** every owned Chrome closed with `Browser.close`, exit 0, none forced. That covers 3 hosted sessions, 9 capture runs plus the failed threshold run, 6+6+4 F1 sessions, 2 debug sessions and 10 room-ready sessions. Lighthouse's chrome-launcher opened and closed its 12 audit Chromes.
- **Servers:** the local F1 server was stopped through its own child handle.
- **Final scan:** no process other than my scan shells had S in its command line. Ports 4611/9971/9972/9981/9991 had no listeners (TIME_WAIT only).
- I touched no other process, and did not touch the user's Chrome.

## Failures and side effects (all)

1. **F1 setup runs 1 and 2 failed:** a disposed-DRACOLoader hang, then my kept-buffer bug. Both are fixed and kept as evidence.
2. **First F2 settle threshold:** at 0.2% nothing ever settled. Kept as evidence; the threshold was then derived from the measured idle floor.
3. **820×820 click points:** lantern missed, and the bonsai point opened the lantern. Recorded as gaps above.
4. **Extra repeat A2:** one bounded A2 per hosted configuration, to classify two outliers. No other extra iterations, and no outliers were dropped.
5. **No T3 preview host,** so I used the owned Chrome fallback.
6. **No approval refusals.** One deployment only, no retries.
