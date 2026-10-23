# Lighthouse diagnosis: /lab/boot

## The two answers and recommendation

**1. Mobile points are mainly lost to blocking work. The 8–14 second Lighthouse LCP is predominantly a simulation artefact, not a heading that takes that long to paint.** On the current deployed preview, the definitive Chrome medians were **76 mobile / 95 desktop**. Mobile lost **19.5 TBT points, 2.9 Speed Index points, 0.75 LCP points, 0.30 FCP points and zero CLS points**. Desktop median contributions were **3.25 LCP, 1.10 SI, 0.90 TBT, zero FCP/CLS**. These are independent medians, so they need not sum to the median rounded score. The heading's observed LCP was **0.480 s mobile / 0.523 s desktop**, against simulated **2.018 / 1.282 s**. Local builds recorded the same heading at median 0.312–0.393 s while reporting simulated mobile LCP of 8.233–8.51 s.

The strongest controlled evidence: delaying only the model/decoder/engine requests by 1.2 s changed local median simulated LCP from **10.001 to 2.057 s**, recovering **24 LCP contribution points**, while actual first room appearance became **1.44 s later** and the recorded heading paint became 56 ms later. Median overall score rose **62 → 71** despite the slower room. Two of three paired tests showed this effect; the third remained a long-LCP outlier. This is a diagnostic result, not an optimization recommendation.

**2. The corrected Stage 5 prototype changed mobile median score 60.5 → 63 (+2.5 points), and desktop 90.5 → 94.5 (+4.0).** Mobile SI improved **5.179 → 4.05 s**, TBT changed **355.8 → 433.5 ms**, and simulated LCP **8.233 → 6.972 s**. Desktop SI **1.373 → 0.843 s**, TBT **32.5 → 18.8 ms**, and LCP **1.89 → 1.533 s**. In three separately throttled phone runs, the first room appeared **14.541 → 13.136 s** (1.405 s sooner), while full readiness was **14.358 → 15.14 s**. The final prototype preserves the drawing buffer so the existing one-pixel warm-up does not erase its early reveal; the filmstrip verifies it stays visible.

This is a small, variable local-score result, not proof that progressive reveal alone delivers that many production points. It still duplicates temporary/final preparation, and LCP/TBT changed along with SI. An earlier prototype with a brief flash lost mobile score, and a deliberately corrected offscreen variant incurred substantial blocking; all cohorts are retained below.

**Recommendation:** prioritize the current deployed preview's mobile TBT for the goal of getting close to 100. Stage 5 has a measured earlier-room benefit, but do not approve it solely on a promised Lighthouse gain: sample variability and rendering details materially change the score. The SI-only ceiling is **3.95 mobile / 1.25 desktop points** on local Stage 4, and **2.90 / 1.10** on the current deployed build. Test the small CSS alternatives in the owner's Chrome/GPU setup before choosing one; these samples do not establish a universal CSS culprit or a guaranteed production gain.

The owner's exact **80 / 89** on ocio was **not reproduced**. Chrome with a working hardware Vulkan renderer was the closest valid setup tried on this machine: **66 / 69** on that build, rather than Edge's **63 / 68**. Broken GPU runs scoring 98–100 were rejected because the room never initialized.

## Measurement setup and reproduction gap

All primary audits used **Lighthouse 13.5.0 CLI**, performance only, default **simulated** throttling, mobile default or `--preset=desktop`, fresh temporary profiles, no extensions, empty storage and cache. Three alternating runs per deployed build/device; four mobile plus two desktop alternating per local build. Odd rounds ran base → Stage 4 → prototype (or ocio → SKIP → current); even rounds reversed the order. Runs were serial: no competing browser audit or build. Samples were retained, including outliers; no statistical significance is claimed from these small sets.

The requested `C:/Program Files/Google/Chrome/Application/chrome.exe` was absent. Chrome was found at **`C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`**, version **154.0.8037.57**; Edge was version 155. The owner used Chrome 151. The main command used `--chrome-flags="--use-angle=vulkan --enable-gpu --window-position=-32000,-32000"`, without headless. Chrome-launcher's default flags disable extensions and background/occlusion throttling. The window was offscreen; this is a headed CLI audit, not the owner's visible DevTools workflow.

WebGL2 probes established a material setup problem: default ANGLE and forced D3D11 failed with **OES_packed_depth_stencil required**. The application caught that error and removed the room, producing meaningless near-perfect scores. WARP did render but used Microsoft Basic Render Driver, with extreme blocking and timeouts; SwiftShader rendered but scored around 37 mobile / 50 desktop in calibration. The valid hardware renderer was **ANGLE Vulkan 1.3.260, AMD Radeon RX 590, AMD proprietary driver**. Vulkan lacked `KHR_parallel_shader_compile`. Installed adapters included the Radeon (driver 31.0.21925.1001) and SudoMaker Virtual Display Adapter. These are measurements of this machine, not proof of which adapter/path the owner used.

Headless versus headed Chrome Vulkan calibration on ocio was **64 / 70 versus 65 / 70** (mobile / desktop, single calibration runs). Thus headless alone did not explain the owner's gap. The valid three-run Chrome and Edge comparisons are separate cohorts; browser/GPU/cache/driver effects cannot be isolated from the owner's one reported result. No browser/GPU setting was changed globally.


| Build / device | Chrome benchmarkIndex median (range) | Owner benchmarkIndex |
| --- | --- | --- |
| Phases 0–6 (ocio) / mobile | 2573.5 (1935–2618.5) | 2862 (reported on ocio) |
| Phases 0–6 (ocio) / desktop | 2547.5 (2492.5–2577) | 2862 (reported on ocio) |
| SKIP fix (btp) / mobile | 2558.5 (2434–2659.5) | 2862 (reported on ocio) |
| SKIP fix (btp) / desktop | 2575.5 (2563.5–2582.5) | 2862 (reported on ocio) |
| Stages 1–3 (g7 / fb9ce37) / mobile | 2608.5 (2534–2625) | 2862 (reported on ocio) |
| Stages 1–3 (g7 / fb9ce37) / desktop | 2600.5 (2446.5–2610) | 2862 (reported on ocio) |

The representative current mobile benchmark was 2608.5, roughly 9% below the owner's 2862. That documents a CPU difference; it does not by itself explain ocio TBT of 2.46 s here versus 0.70 s for the owner. Lighthouse does not normalize every shader/driver/microtask cost to this benchmark. The owner's raw LHR, trace and exact GPU renderer were unavailable, so the remaining gap cannot be fully attributed or eliminated. The prior 40 / 57 Edge results are historical observations supplied in the brief, not interchangeable samples in this cohort.

## Deployed previews: metrics and points at stake

All primary runs identified the LCP node as **`h1.text-2xl`, text `NEIL SKARIA`, under `main#boot-page > header > div`**. “Observed” is the timestamp actually recorded in the unthrottled gather trace; “simulated” is the numeric value used for scoring. The heading can be recorded as LCP while a room/loading layer covers the page; this is not a claim that the visitor sees the heading then, or that the room canvas is an LCP candidate.


| Build / device | n | Score median (range) | FCP s | LCP simulated s | LCP observed s | TBT ms | SI s | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Phases 0–6 (ocio) / mobile | 3 | 66 (39–67) | 1.399 | 1.999 | 0.439 | 2464.5 | 5.535 | 0.002376 |
| Phases 0–6 (ocio) / desktop | 3 | 69 (69–70) | 0.389 | 0.569 | 0.468 | 913.5 | 1.705 | 0.000387 |
| SKIP fix (btp) / mobile | 3 | 66 (65–66) | 1.397 | 1.922 | 0.417 | 2247.5 | 5.395 | 0.002376 |
| SKIP fix (btp) / desktop | 3 | 70 (69–70) | 0.386 | 0.568 | 0.478 | 896.4 | 1.696 | 0.000387 |
| Stages 1–3 (g7 / fb9ce37) / mobile | 3 | 76 (76–77) | 1.399 | 2.018 | 0.48 | 826.8 | 4.574 | 0 |
| Stages 1–3 (g7 / fb9ce37) / desktop | 3 | 95 (94–98) | 0.486 | 1.282 | 0.523 | 98.4 | 1.324 | 0 |



| Build / device | FCP points | LCP points | TBT points | SI points | CLS points |
| --- | --- | --- | --- | --- | --- |
| Phases 0–6 (ocio) / mobile | 0.3 | 0.75 | 28.8 | 4.6 | 0 |
| Phases 0–6 (ocio) / desktop | 0 | 0 | 27.9 | 2.5 | 0 |
| SKIP fix (btp) / mobile | 0.3 | 0.5 | 28.2 | 4.4 | 0 |
| SKIP fix (btp) / desktop | 0 | 0 | 27.9 | 2.5 | 0 |
| Stages 1–3 (g7 / fb9ce37) / mobile | 0.3 | 0.75 | 19.5 | 2.9 | 0 |
| Stages 1–3 (g7 / fb9ce37) / desktop | 0 | 3.25 | 0.9 | 1.1 | 0 |

The SKIP fix did not produce a material cold-load score change in this cohort. Stages 1–3 improved mobile median TBT from 2465 to 827 ms, and desktop from 914 to 98 ms, with the qualifications about different deployed builds and this GPU setup.

For the owner's reported mobile numbers, running the installed 13.5 scoring functions gives **FCP loss 0.20, LCP 0.25, TBT 17.40, SI 2.30, CLS zero**, total 20.15 lost → 79.85 → rounded 80. The owner's desktop TBT of 265 ms alone costs **10.20 points**. Its other metric values were not supplied, so an exact owner-desktop SI ceiling cannot be computed.

Points are calculated as **metric weight × (1 − Lighthouse metric score)**, using each audit's actual scored curve output, not linear milliseconds or guessed percentages. Weights: FCP 10, LCP 25, TBT 30, SI 10, CLS 25. The installed implementation applies log-normal curves and its precision/rounding rules; summing losses in an individual run reconstructs its unrounded weighted score. Median losses across runs do not necessarily reconstruct the median score. [Chrome's scoring documentation](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) explains the weighted curves; the exact installed parameters used here are:


| Metric | Mobile p10 / median | Desktop p10 / median |
| --- | --- | --- |
| FIRST CONTENTFUL PAINT | 1800 / 3000 | 934 / 1600 |
| LARGEST CONTENTFUL PAINT | 2500 / 4000 | 1200 / 2400 |
| TOTAL BLOCKING TIME | 200 / 600 | 150 / 350 |
| SPEED INDEX | 3387 / 5800 | 1311 / 2300 |
| CUMULATIVE LAYOUT SHIFT | 0.1 / 0.25 | 0.1 / 0.25 |

Times in that parameter table are milliseconds; CLS is unitless. “p10” is the curve parameter that maps approximately to a 0.90 metric score, not a perfect score or a 10th-percentile measurement from this experiment.

## Why a heading painted early gets an 8–14 s simulated LCP

I replayed the saved traces and request logs through the installed Lighthouse/Lantern computation. Its optimistic LCP graph includes requests before the observed LCP cutoff, except low-priority images; the pessimistic graph includes more CPU/layout work. The estimate is the largest simulated end time of retained nodes, combining optimistic and pessimistic estimates equally, and clamping to FCP. It does not require a retained model, decoder, engine chunk or audio file to be the heading's actual resource dependency. This behavior is in the installed Chromium trace-engine `LargestContentfulPaint.js`, reached through Lighthouse's `LanternLargestContentfulPaint`. The replayed values match the primary reports; a few exploratory A/B values differ by small rounding/simulation-order amounts.

Concrete examples:

- The earlier saved Edge profile reported **8.576 s simulated LCP**, but the heading's recorded LCP was **0.634 s**. The longest LCP graph endpoints were engine JS, ending at **8.417 / 8.736 s** in the optimistic/pessimistic simulations.
- The ocio Chrome mobile outlier reported **11.872 s**, versus **1.444 s observed**. Its optimistic endpoint was **`gba-boot…mp3`**, simulated to end at **11.797 s**. Audio is not the painted heading.
- The normal current mobile run 1 had **0.512 s observed / 2.018 s simulated**, with a route JS endpoint at 2.002 s rather than a model-heavy endpoint. Small shifts in when the gather paint occurs change which early requests remain in the graph, causing a large simulated jump.
- In the separate genuinely throttled phone runs, the heading's LCP was **about 1.0–1.2 s** while the room first appeared at **approximately 13–15 s from navigation start**. The room's long loading time is real; attributing all of that to heading paint is not.

### Controlled interventions on the current deployed preview

CDP Fetch interception read and re-served the main document, inserting only the listed stylesheet or removing the exact inline boot head script. Controls used identical interception without modifications. Font tests blocked the Inter `.woff2` request while retaining the heading's CSS. Interception logs and computed state at page load verify the applied style, head-script removal, `data-intro`, layer display/opacity and heading font. These were browser-only edits to the deployed response; nothing was deployed or edited on its branch.

**This interception harness changes absolute timing**, so its controls must be compared with its treatments, not pooled with the normal 76/95 audits. Mobile controls ranged **53–89**; desktop controls were **90 and 96**. Some treatments also had outliers. Median differences below describe these small samples, not promised gains on the normal deployed build. The heading's computed font was the built-in monospace stack in every isolated font-blocking test; Inter serves other text.


| Intervention / device | n | Score (range) | Sim LCP s | Observed LCP s | LCP contribution recovered points | Overall median score change |
| --- | --- | --- | --- | --- | --- | --- |
| Unmodified matched control / mobile | 3 | 88 (53–89) | 2.411 | 0.484 | 0 | 0 |
| Loading-layer opacity .999 → 1 / mobile | 3 | 90 (86–91) | 1.954 | 0.401 | 1.5 | 2 |
| CRT will-change: transform → auto / mobile | 3 | 89 (88–90) | 2.257 | 0.444 | 0.75 | 1 |
| Block Inter font only / mobile | 3 | 87 (84–87) | 2.084 | 0.467 | 1.25 | -1 |
| Remove CRT SVG filter / mobile | 3 | 89 (63–91) | 2.404 | 0.439 | 0 | 1 |
| Remove inline boot head script / early data-intro / mobile | 1 | 54 (54–54) | 7.65 | 1.479 | -19 | -32 |
| Unmodified matched control / desktop | 2 | 93 (90–96) | 1.249 | 0.815 | 0 | 0 |
| Loading-layer opacity .999 → 1 / desktop | 2 | 98 (98–98) | 0.711 | 0.546 | 3.38 | 5 |
| CRT will-change: transform → auto / desktop | 2 | 97.5 (97–98) | 0.699 | 0.457 | 3.38 | 4.5 |
| Block Inter font only / desktop | 2 | 98 (98–98) | 0.679 | 0.559 | 3.38 | 5 |
| Remove CRT SVG filter / desktop | 2 | 98 (98–98) | 0.688 | 0.441 | 3.38 | 5 |
| Remove inline boot head script / early data-intro / desktop | 2 | 96 (96–96) | 0.838 | 0.586 | 2.87 | 3 |

The normal current build has only **0.75 mobile / 3.25 desktop LCP points** left to recover, holding other metrics fixed. The larger A/B desktop LCP recovery (3.375 points) reflects its worse control, not extra points beyond that normal ceiling.

What these tests support:

- **Layer opacity affects the paint/simulation path:** making it fully opaque gave the largest repeated mobile median improvement, **+2 overall / +1.50 LCP contribution points** in this harness; desktop **+5 / +3.375**. It did not remove the heading as the LCP node. This is a small candidate for a further owner-browser check, not evidence of a real 10-second heading wait.
- **Removing promotion was not reliably harmful or beneficial:** initial screening gave a 13.248 s simulated / 1.520 s observed LCP, but the three repeats had 2.0–2.5 s-scale simulated LCP and a median +1 overall / +0.75 LCP contribution. The initial regression did not reproduce; it would be wrong to claim `will-change` alone is the cause or a proven safeguard.
- **Fonts are not the heading's required font resource:** blocking Inter left its monospace family unchanged and still painted it early. It gave **−1 mobile overall / +1.25 LCP contribution**, versus **+5 desktop overall / +3.375 LCP contribution**. Network/layout timing can change the simulation graph even when the heading does not use that font. These data do not establish Inter as the principal cause of the long heading LCP.
- **Removing the CRT filter did not fix mobile LCP consistently:** median LCP contribution recovery was **zero mobile**, overall +1, and a 13.262 s simulated outlier remained. Desktop +5 overall / +3.375 LCP contribution is promising in the matched harness, but this changes the design and is not isolated evidence for a single root cause.
- **Removing the inline script / early `data-intro` is not a supported mobile fix:** one screening run fell **86 → 54**, observed LCP worsened **0.550 → 1.479 s**, and lost an additional **19.00 LCP points**. It changes the startup display path (layer initially `display:none`). Desktop two-run median gained +3 overall / +2.875 LCP contribution but increased TBT to 104 ms. The script and the attribute it sets were removed together, so their individual effects cannot be separated by this test.
- A screening run hiding the entire room layer gave **83 versus 86 control**, observed heading LCP 0.444 s, simulated 2.411 s: deleting the experience was not an automatic score win. Forcing Arial everywhere plus font blocking scored 86, but changes typography and was not used as the isolated font result. Combining opacity/promotion removal scored 60 in one screening run and was not assumed additive.

### Controlled 3D-request delay on local fb9ce37

With HTML/CSS unchanged, Fetch interception delayed only the model `.glb.br`, Draco wrapper/WASM and engine JS request by **1200 ms each**, independently. All three controls and three treatments used the same browser, interception and frame observer. “First room” here is the actual unthrottled Lighthouse gather navigation timestamp, measured from a RAF observer when the canvas becomes visible; it is not the real-throttled phone result reported for Stage 5. Repeated observer notifications were deduplicated for these statistics.


| Round / variant | Score | Sim LCP s | Observed LCP s | Actual first-room s | TBT ms | SI s | LCP points lost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 control | 62 | 13.464 | 2.328 | 2.315 | 148 | 6.402 | 25 |
| 1 delay3d | 57 | 13.661 | 2.635 | 3.386 | 314.7 | 7.69 | 25 |
| 2 control | 64 | 10.001 | 0.317 | 1.77 | 285 | 5.12 | 25 |
| 2 delay3d | 71 | 2.057 | 0.382 | 3.458 | 882 | 6.943 | 1 |
| 3 control | 59 | 8.496 | 0.326 | 1.947 | 430.9 | 5.191 | 24.75 |
| 3 delay3d | 83 | 2.047 | 0.343 | 3.113 | 360.3 | 6.359 | 1 |

The treatment intentionally worsens real room delivery. In rounds 2 and 3 it excluded room resources from the early LCP graph and recovered **24.00 / 23.75 LCP contribution points**, even though the heading paint was slightly later. Round 1 retained a late observed paint and did not recover LCP points. This proves a mechanism for the large simulation artefact and shows why such a delay is not a robust product optimization. It does not prove that every 8–14 s report is identical; each saved graph endpoint is available below.

## Stage 5 prototype and local comparison

The throwaway worktree is **`C:/projects/neilskaria.com-diag`**, branch **`diag/stage5-proto`**, based on **`perf/stage4` / aaab469**. It renders a temporary scene as soon as the shell parse, its lightmaps and initial shader/texture preparation finish; it forces the canvas visible without a fade and hides the loader. Each object group is added independently when parsed and compiled. It starts bonsai growth from the bonsai group, as Stage 4 does. Full controls still wait for the original controller. The final prototype uses `preserveDrawingBuffer` so warm-up stays in the existing screen rendering path while retaining the early image. There is no new bake, drop animation, deployment, push, merge or commit. Materials/shadows in the temporary scene are crude, as requested. Some final initialization is duplicated; this is an experiment, not a proposed implementation.

The local baseline, Stage 4 and prototype were built from their own source snapshots in this worktree, then served serially at **4260** with local-only Vite cache and the Stage 4-style Brotli middleware. Each `.glb.br` response had **`Content-Encoding: br`** and **`Content-Type: model/gltf-binary`**, so the browser decoded it correctly. Brotli quality 11 sizes: baseline model **965,768 bytes**; Stage 4/prototype shell **611,828**, SP **85,612**, cube **20,179**, clock **47,541**, bonsai **206,864** (total **972,024**, slightly more than baseline). The expected adapter-vercel symlink EPERM occurred after completed Vite output; the local complete output was used, and no adapter output was deployed.


| Build / device | n | Score median (range) | FCP s | LCP simulated s | LCP observed s | TBT ms | SI s | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local fb9ce37 / mobile | 4 | 55.5 (43–60) | 2.012 | 8.51 | 0.393 | 499.6 | 5.711 | 0 |
| Local fb9ce37 / desktop | 2 | 88 (87–89) | 0.531 | 2.132 | 0.367 | 23 | 1.342 | 0 |
| Local Stage 4 / aaab469 / mobile | 4 | 60.5 (55–67) | 1.947 | 8.233 | 0.312 | 355.8 | 5.179 | 0 |
| Local Stage 4 / aaab469 / desktop | 2 | 90.5 (90–91) | 0.518 | 1.89 | 0.383 | 32.5 | 1.373 | 0 |
| Local Stage 5 prototype / mobile | 4 | 63 (49–65) | 1.969 | 6.972 | 0.322 | 433.5 | 4.05 | 0 |
| Local Stage 5 prototype / desktop | 2 | 94.5 (93–96) | 0.529 | 1.533 | 0.371 | 18.8 | 0.843 | 0 |



| Build / device | FCP points | LCP points | TBT points | SI points | CLS points |
| --- | --- | --- | --- | --- | --- |
| Local fb9ce37 / mobile | 1.65 | 24.62 | 12.45 | 4.95 | 0 |
| Local fb9ce37 / desktop | 0.05 | 10.5 | 0 | 1.15 | 0 |
| Local Stage 4 / aaab469 / mobile | 1.4 | 24.5 | 8.1 | 3.95 | 0 |
| Local Stage 4 / aaab469 / desktop | 0 | 8.38 | 0 | 1.25 | 0 |
| Local Stage 5 prototype / mobile | 1.5 | 23.5 | 10.65 | 2.05 | 0 |
| Local Stage 5 prototype / desktop | 0 | 5.25 | 0 | 0.1 | 0 |

Relative to fb9ce37, the final prototype changed mobile score **55.5 → 63**, SI **5.711 → 4.05 s**, LCP **8.51 → 6.972 s**, TBT **499.6 → 433.5 ms**; desktop score **88 → 94.5**, SI **1.342 → 0.843 s**, LCP **2.132 → 1.533 s**, TBT **23 → 18.8 ms**. The first room was **0.181 s sooner than fb9ce37**. Compare the within-cohort ranges and per-run data before attributing every changed point to progressive reveal.

### Actual phone-profile appearance, separately measured

The supplied `%TEMP%/perf/baseline.mjs` phone profile was reused: **412×915, DPR 2.625, CPU ×4, 150 ms latency, download 200,000 B/s, upload 93,750 B/s, cache disabled**, fresh profile/storage. Its original startup CPU profiler/trace was retained; later idle/interaction sections were omitted. Chrome/Vulkan replaced unavailable working Edge/D3D. A RAF observer records first visible canvas opacity above 0.01; prototype marks distinguish shell draw, two-RAF shell frame and final draw. The original harness polls START for full readiness; that value has roughly 50 ms polling granularity and a small host/CDP clock offset. No screenshots were taken in these timing runs. “Frame” is a browser-side visibility/draw proxy, not a camera/photodiode measurement of a physical display.


| Build | First room median s (range) | Full-ready median s | FCP median s | Runs / browser errors |
| --- | --- | --- | --- | --- |
| Local fb9ce37 | 13.317 (13.265–13.473) | 13.11 | 1.056 | 3 / 0 |
| Local Stage 4 / aaab469 | 14.541 (14.463–14.717) | 14.358 | 1.08 | 3 / 0 |
| Local Stage 5 prototype | 13.136 (12.759–13.405) | 15.14 | 1.06 | 3 / 0 |



| Build / run | First-room s | Full-ready s | Heading LCP s | Model response encoding |
| --- | --- | --- | --- | --- |
| Local fb9ce37 / 1 | 13.473 | 13.316 | 1.136 | br |
| Local fb9ce37 / 2 | 13.265 | 13.107 | 1.032 | br |
| Local fb9ce37 / 3 | 13.317 | 13.11 | 1.056 | br |
| Local Stage 4 / aaab469 / 1 | 14.717 | 14.579 | 1.116 | br |
| Local Stage 4 / aaab469 / 2 | 14.541 | 14.358 | 1.072 | br |
| Local Stage 4 / aaab469 / 3 | 14.463 | 14.288 | 1.08 | br |
| Local Stage 5 prototype / 1 | 12.759 | 14.431 | 1.06 | br |
| Local Stage 5 prototype / 2 | 13.136 | 15.14 | 1.248 | br |
| Local Stage 5 prototype / 3 | 13.405 | 15.496 | 1.02 | br |

The four optional groups finished parsing before the shell in every final prototype phone run. The group and shell marks are shown below. Objects therefore did not need a prolonged download wait after the shell appeared; the gain chiefly avoids waiting for all final preparation before showing something. Smaller/reprioritized shell assets could change this, but were not measured.


| Run | Optional group parse s (SP / cube / clock / bonsai) | Shell parse s | Shell frame s | Complete draw s |
| --- | --- | --- | --- | --- |
| 1 | 8.262 / 8.287 / 8.307 / 8.83 | 12.208 | 12.773 | 14.398 |
| 2 | 8.325 / 8.337 / 8.349 / 8.987 | 12.472 | 13.154 | 15.042 |
| 3 | 8.602 / 8.621 / 8.646 / 9.252 | 12.677 | 13.42 | 15.409 |

### Filmstrips

Lighthouse filmstrips below are the **observed gather screenshots**, not screenshots taken at the simulated SI/LCP timestamps. Each uses the middle-lower SI sample (second sorted sample of four), rather than the best score. The separate real-throttled screencast is illustrative and has capture overhead; do not substitute its timings for the three-run phone medians.

Local fb9ce37: [Lighthouse filmstrip](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-filmstrip.png>); [real-throttled filmstrip](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/real-filmstrip.png>); [all real-throttled frames and timestamps](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/real-film/frames.json>).

Local Stage 4 / aaab469: [Lighthouse filmstrip](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-filmstrip.png>); [real-throttled filmstrip](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/real-filmstrip.png>); [all real-throttled frames and timestamps](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/real-film/frames.json>).

Local Stage 5 prototype: [Lighthouse filmstrip](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-filmstrip.png>); [real-throttled filmstrip](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/real-filmstrip.png>); [all real-throttled frames and timestamps](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/real-film/frames.json>).

### Speed Index ceiling

With all other metrics fixed, perfect SI recovers **exactly its current points lost**, at most the 10-point SI weight. It cannot by itself fix TBT or LCP. These are medians of per-run ceilings; overall scores remain rounded.


| Baseline | Mobile SI-only maximum gain | Desktop SI-only maximum gain |
| --- | --- | --- |
| Phases 0–6 (ocio) | 4.6 points | 2.5 points |
| SKIP fix (btp) | 4.4 points | 2.5 points |
| Stages 1–3 (g7 / fb9ce37) | 2.9 points | 1.1 points |
| Local fb9ce37 | 4.95 points | 1.15 points |
| Local Stage 4 / aaab469 | 3.95 points | 1.25 points |
| Local Stage 5 prototype | 2.05 points | 0.1 points |
| Owner reported ocio | 2.30 points | Unknown: desktop SI not supplied |

For the owner's mobile baseline, perfect SI changes the reconstructed 79.85 to **82.15**, approximately **80 → 82**, not close to 100. In the final local cohort the prototype recovered **1.9 SI contribution points mobile / 1.15 desktop**. TBT contribution changed by **-2.55 points mobile / 0 desktop** (positive means recovery); LCP contribution by **1 / 3.12**. These independent median contributions are not additive to median rounded score changes.

### Retained exploratory local cohorts

Visual QA of the initial prototype found a brief flash during final one-pixel warm-up. It was corrected and all three builds were remeasured, rather than carrying that cohort into the final result. An offscreen render-target fix then added large GPU/driver blocking in this setup. The final prototype instead enables `preserveDrawingBuffer` and keeps its early-reveal state through controller startup. In its final four mobile runs, the prototype scored 49–65 versus Stage 4’s 55–67; the ranges overlap substantially. Its two desktop samples were 93–96 versus 90–91, but most of that gain came from changed simulated LCP, not SI alone. That is a measurement-only tradeoff, not a production recommendation; its idle/memory cost was not measured.

The earlier samples are retained as measurements of those exact variants, not discarded good/bad runs of the final variant. They show how rendering implementation changes can dominate the score. Fresh browser profiles do not establish that driver-level caches are reset. Baseline runs also varied substantially across cohorts; the final order was again alternated to limit order bias.



| Variant cohort / build / device | n | Score (range) | TBT ms | SI s | Raw evidence |
| --- | --- | --- | --- | --- | --- |
| first-cohort base mobile | 4 | 63 (62–64) | 311.7 | 4.909 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base-first-cohort>) |
| first-cohort base desktop | 2 | 88.5 (88–89) | 29.5 | 1.223 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base-first-cohort>) |
| first-cohort stage4 mobile | 4 | 66 (64–66) | 251.7 | 5.16 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4-first-cohort>) |
| first-cohort stage4 desktop | 2 | 90.5 (90–91) | 17 | 1.22 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4-first-cohort>) |
| first-cohort proto mobile | 4 | 60 (49–61) | 485.7 | 4.252 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto-first-cohort>) |
| first-cohort proto desktop | 2 | 91 (91–91) | 37 | 0.772 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto-first-cohort>) |
| offscreen-cohort base mobile | 4 | 58 (56–61) | 451.7 | 5.183 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base-offscreen-cohort>) |
| offscreen-cohort base desktop | 2 | 91.5 (90–93) | 20.2 | 1.274 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base-offscreen-cohort>) |
| offscreen-cohort stage4 mobile | 4 | 61.5 (43–64) | 376.4 | 5.27 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4-offscreen-cohort>) |
| offscreen-cohort stage4 desktop | 2 | 90 (90–90) | 27.5 | 1.205 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4-offscreen-cohort>) |
| offscreen-cohort proto mobile | 4 | 44.5 (42–47) | 2630.2 | 4.442 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto-offscreen-cohort>) |
| offscreen-cohort proto desktop | 2 | 74.5 (73–76) | 385.7 | 0.984 | [raw cohort](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto-offscreen-cohort>) |

## Evidence index and all primary run data

The report is the only file written in the main checkout. Raw data and reproducible harnesses are in `%TEMP%/impl/diag`; that is temporary storage and should be retained before it is cleaned by the OS. The branch/worktree retain the prototype source. Each `lh-…json` has a sibling `.summary.json`, `.log`, `-0.trace.json`, and `.json-assets/` containing original artifacts, request log, trace and `diagnostic.json` replay. Invalid GPU, no-FCP and unapplied interception experiments are retained in separate/labelled folders and excluded from all definitive tables.


| Artifact | Location |
| --- | --- |
| Raw audit/timing directory | [diag](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag>) |
| Full aggregation | [summary.json](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/summary.json>) |
| Replay/phone aggregation | [analysis-summary.json](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/analysis-summary.json>) |
| Scoring parameters and owner reconstruction | [scoring-curves.json](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/scoring-curves.json>) |
| CLI audit harness | [audit.mjs](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/audit.mjs>) |
| Build/Brotli setup | [prepare.py](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/prepare.py>) |
| Serial local server/test harness | [local.mjs](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/local.mjs>) |
| Phone trace harness | [phone.mjs](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/phone.mjs>) |
| Validated CDP A/B harness | [ab.mjs](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ab.mjs>) |
| Lantern replay | [replay.mjs](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/replay.mjs>) |
| Prototype diff | [proto.diff](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto.diff>) |
| Prototype engine source | [engine.ts](<C:/projects/neilskaria.com-diag/src/lib/boot/engine.ts>) |


### Deployed runs


| Run (raw summary) | Score | FCP s | Sim LCP s | Obs LCP s | TBT ms | SI s | CLS | Points lost: FCP / LCP / TBT / SI / CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ocio mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-mobile-1-vulkanheaded.json.summary.json>) | 67 | 1.399 | 1.474 | 0.379 | 2369 | 5.471 | 0.002376 | 0.3 / 0 / 28.5 / 4.5 / 0 |
| [ocio mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-mobile-2-vulkanheaded.json.summary.json>) | 39 | 2.099 | 11.872 | 1.444 | 2595.5 | 6.121 | 0.002376 | 1.9 / 25 / 28.8 / 5.6 / 0 |
| [ocio mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-mobile-3-vulkanheaded.json.summary.json>) | 66 | 1.399 | 1.999 | 0.439 | 2464.5 | 5.535 | 0.002376 | 0.3 / 0.75 / 28.8 / 4.6 / 0 |
| [ocio desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-desktop-1-vulkanheaded.json.summary.json>) | 69 | 0.402 | 0.569 | 0.461 | 893.2 | 1.768 | 0.000387 | 0 / 0 / 27.9 / 2.8 / 0 |
| [ocio desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-desktop-2-vulkanheaded.json.summary.json>) | 69 | 0.389 | 0.572 | 0.477 | 962 | 1.693 | 0.000387 | 0 / 0 / 28.2 / 2.5 / 0 |
| [ocio desktop 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-desktop-3-vulkanheaded.json.summary.json>) | 70 | 0.377 | 0.559 | 0.468 | 913.5 | 1.705 | 0.000387 | 0 / 0 / 27.9 / 2.5 / 0 |
| [skip mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-mobile-1-vulkanheaded.json.summary.json>) | 65 | 1.397 | 1.922 | 0.947 | 2213.5 | 6.302 | 0.002376 | 0.3 / 0.5 / 28.2 / 5.8 / 0 |
| [skip mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-mobile-2-vulkanheaded.json.summary.json>) | 66 | 1.251 | 1.666 | 0.417 | 2638.5 | 5.395 | 0.002376 | 0.1 / 0.25 / 28.8 / 4.4 / 0 |
| [skip mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-mobile-3-vulkanheaded.json.summary.json>) | 66 | 1.397 | 1.997 | 0.368 | 2247.5 | 5.333 | 0.002376 | 0.3 / 0.75 / 28.2 / 4.3 / 0 |
| [skip desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-desktop-1-vulkanheaded.json.summary.json>) | 69 | 0.386 | 0.568 | 0.478 | 947.5 | 1.696 | 0.000387 | 0 / 0 / 28.2 / 2.5 / 0 |
| [skip desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-desktop-2-vulkanheaded.json.summary.json>) | 70 | 0.375 | 0.573 | 0.487 | 896.4 | 1.703 | 0.000387 | 0 / 0 / 27.9 / 2.5 / 0 |
| [skip desktop 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-desktop-3-vulkanheaded.json.summary.json>) | 70 | 0.391 | 0.561 | 0.467 | 851.7 | 1.646 | 0.000387 | 0 / 0 / 27.6 / 2.3 / 0 |
| [current mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-mobile-1-vulkanheaded.json.summary.json>) | 76 | 1.402 | 2.018 | 0.512 | 826.8 | 4.661 | 0 | 0.3 / 0.75 / 19.5 / 3.1 / 0 |
| [current mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-mobile-2-vulkanheaded.json.summary.json>) | 77 | 1.399 | 2.018 | 0.445 | 804.5 | 4.574 | 0 | 0.3 / 0.75 / 19.2 / 2.9 / 0 |
| [current mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-mobile-3-vulkanheaded.json.summary.json>) | 76 | 1.395 | 2.016 | 0.48 | 858 | 4.549 | 0 | 0.3 / 0.75 / 20.1 / 2.9 / 0 |
| [current desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-desktop-1-vulkanheaded.json.summary.json>) | 94 | 0.495 | 1.404 | 0.512 | 66 | 1.324 | 0 | 0 / 4.25 / 0.3 / 1.1 / 0 |
| [current desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-desktop-2-vulkanheaded.json.summary.json>) | 95 | 0.379 | 1.282 | 0.523 | 102.2 | 1.256 | 0 | 0 / 3.25 / 0.9 / 0.9 / 0 |
| [current desktop 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-desktop-3-vulkanheaded.json.summary.json>) | 98 | 0.486 | 0.591 | 0.53 | 98.4 | 1.387 | 0 | 0 / 0.25 / 0.9 / 1.3 / 0 |


### Local runs


| Run (raw summary) | Score | FCP s | Sim LCP s | Obs LCP s | TBT ms | SI s | CLS | Points lost: FCP / LCP / TBT / SI / CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [base mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-1-vulkanheaded.json.summary.json>) | 57 | 2.471 | 13.632 | 1.36 | 402.6 | 5.681 | 0 | 3.2 / 25 / 9.9 / 4.9 / 0 |
| [base mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-2-vulkanheaded.json.summary.json>) | 43 | 1.983 | 8.435 | 0.338 | 1518.5 | 5.968 | 0 | 1.5 / 24.5 / 26.1 / 5.3 / 0 |
| [base mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-3-vulkanheaded.json.summary.json>) | 54 | 2.022 | 8.584 | 0.394 | 596.6 | 5.265 | 0 | 1.7 / 24.75 / 15 / 4.1 / 0 |
| [base mobile 4](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-4-vulkanheaded.json.summary.json>) | 60 | 2.002 | 7.953 | 0.391 | 400.5 | 5.74 | 0 | 1.6 / 24.25 / 9.6 / 5 / 0 |
| [base desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-desktop-1-vulkanheaded.json.summary.json>) | 89 | 0.539 | 2.045 | 0.353 | 21 | 1.241 | 0 | 0.1 / 9.75 / 0 / 0.8 / 0 |
| [base desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-desktop-2-vulkanheaded.json.summary.json>) | 87 | 0.524 | 2.22 | 0.381 | 25 | 1.443 | 0 | 0 / 11.25 / 0 / 1.5 / 0 |
| [stage4 mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-1-vulkanheaded.json.summary.json>) | 55 | 1.948 | 8.234 | 0.314 | 598.8 | 5.083 | 0 | 1.4 / 24.5 / 15 / 3.8 / 0 |
| [stage4 mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-2-vulkanheaded.json.summary.json>) | 67 | 1.942 | 8.22 | 0.31 | 208.3 | 5.204 | 0 | 1.4 / 24.5 / 3.3 / 4 / 0 |
| [stage4 mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-3-vulkanheaded.json.summary.json>) | 66 | 1.947 | 8.231 | 0.309 | 240 | 5.153 | 0 | 1.4 / 24.5 / 4.5 / 3.9 / 0 |
| [stage4 mobile 4](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-4-vulkanheaded.json.summary.json>) | 55 | 2.501 | 13.66 | 1.322 | 471.6 | 5.527 | 0 | 3.3 / 25 / 11.7 / 4.6 / 0 |
| [stage4 desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-desktop-1-vulkanheaded.json.summary.json>) | 91 | 0.515 | 1.765 | 0.377 | 35 | 1.449 | 0 | 0 / 7.25 / 0 / 1.5 / 0 |
| [stage4 desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-desktop-2-vulkanheaded.json.summary.json>) | 90 | 0.522 | 2.016 | 0.388 | 30 | 1.297 | 0 | 0 / 9.5 / 0 / 1 / 0 |
| [proto mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-1-vulkanheaded.json.summary.json>) | 62 | 1.942 | 8.212 | 0.337 | 431.1 | 4.013 | 0 | 1.4 / 24.5 / 10.5 / 2 / 0 |
| [proto mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-2-vulkanheaded.json.summary.json>) | 65 | 1.968 | 7.058 | 0.306 | 359 | 4.087 | 0 | 1.5 / 23.5 / 8.4 / 2.1 / 0 |
| [proto mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-3-vulkanheaded.json.summary.json>) | 64 | 1.97 | 6.305 | 0.294 | 436 | 3.743 | 0 | 1.5 / 22.5 / 10.8 / 1.5 / 0 |
| [proto mobile 4](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-4-vulkanheaded.json.summary.json>) | 49 | 1.984 | 6.886 | 0.374 | 1063.5 | 4.849 | 0 | 1.5 / 23.5 / 22.5 / 3.4 / 0 |
| [proto desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-desktop-1-vulkanheaded.json.summary.json>) | 93 | 0.529 | 1.708 | 0.372 | 20.5 | 0.831 | 0 | 0 / 6.75 / 0 / 0.1 / 0 |
| [proto desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-desktop-2-vulkanheaded.json.summary.json>) | 96 | 0.53 | 1.359 | 0.37 | 17 | 0.854 | 0 | 0 / 3.75 / 0 / 0.1 / 0 |


### Long-task list for every deployed run

The following is the complete Lighthouse `long-tasks` audit list, ordered by start time, written as **start → duration ms : attributed URL**. These are **simulated diagnostic task timings**, not an additive reconstruction of TBT. TBT subtracts 50 ms from qualifying task segments and uses its own metric window. “Unattributable” is Lighthouse's result, not a guess that the task is JavaScript or GPU work. Absolute URL hostnames are omitted for compactness; the raw report preserves them.

The current mobile run 1's two largest observed un-attributed tasks were **84.921 and 164.875 ms**, predominantly `RunMicrotasks`; Lantern expands them to **340 / 660 ms**. Other observed long tasks were **78.645 / 62.226 ms** attributed to engine chunk `DE0Zr2N4.js` (module evaluation/microtasks). Those are evidence of the blocking segments, but the trace does not identify the exact source function for the two largest microtasks. It would be unjustified to assign every remaining TBT point to bonsai, fonts or shader compilation from this data alone.

**ocio mobile run 1** (8 tasks):

- 828.4 → 60 ms : /lab/boot
- 888.4 → 54 ms : Unattributable
- 942.4 → 79 ms : Unattributable
- 1021.4 → 611 ms : Unattributable
- 1632.4 → 1000 ms : Unattributable
- 8968.4 → 289 ms : /_app/immutable/chunks/Cf0UIj2h.js
- 9257.4 → 1093 ms : /_app/immutable/chunks/Cf0UIj2h.js
- 10350.4 → 60 ms : /_app/immutable/chunks/Cf0UIj2h.js

**ocio mobile run 2** (8 tasks):

- 888.3 → 83 ms : /lab/boot
- 971.3 → 69 ms : Unattributable
- 1082.3 → 814 ms : Unattributable
- 1896.3 → 1187 ms : Unattributable
- 9430.3 → 315 ms : /_app/immutable/chunks/Cf0UIj2h.js
- 9745.3 → 1314 ms : /_app/immutable/chunks/Cf0UIj2h.js
- 11059.3 → 102 ms : /_app/immutable/chunks/Cf0UIj2h.js
- 11161.3 → 155 ms : Unattributable

**ocio mobile run 3** (7 tasks):

- 829.5 → 73 ms : /lab/boot
- 902.5 → 63 ms : Unattributable
- 965.5 → 678 ms : Unattributable
- 1643.5 → 1030 ms : Unattributable
- 9012.5 → 219 ms : /_app/immutable/chunks/Cf0UIj2h.js
- 9231.5 → 1178 ms : /_app/immutable/chunks/Cf0UIj2h.js
- 10409.5 → 65 ms : /_app/immutable/chunks/Cf0UIj2h.js

**ocio desktop run 1** (4 tasks):

- 360.4 → 210 ms : Unattributable
- 596.4 → 246 ms : Unattributable
- 1603.3 → 116 ms : Unattributable
- 1719.3 → 563 ms : /_app/immutable/chunks/Cf0UIj2h.js

**ocio desktop run 2** (4 tasks):

- 401.2 → 216 ms : Unattributable
- 650.2 → 226 ms : Unattributable
- 1638.5 → 109 ms : Unattributable
- 1747.5 → 611 ms : /_app/immutable/chunks/Cf0UIj2h.js

**ocio desktop run 3** (4 tasks):

- 378 → 218 ms : Unattributable
- 629 → 250 ms : Unattributable
- 1618.6 → 117 ms : Unattributable
- 1735.6 → 545 ms : /_app/immutable/chunks/Cf0UIj2h.js

**skip mobile run 1** (7 tasks):

- 812.4 → 79 ms : /lab/boot
- 891.4 → 74 ms : Unattributable
- 965.4 → 614 ms : Unattributable
- 1579.4 → 940 ms : Unattributable
- 8861.4 → 233 ms : /_app/immutable/chunks/E2jh4b8j.js
- 9094.4 → 1074 ms : /_app/immutable/chunks/E2jh4b8j.js
- 10168.4 → 54 ms : /_app/immutable/chunks/E2jh4b8j.js

**skip mobile run 2** (9 tasks):

- 876.7 → 73 ms : /lab/boot
- 994.7 → 79 ms : Unattributable
- 1113.7 → 652 ms : Unattributable
- 1765.7 → 966 ms : Unattributable
- 2731.7 → 57 ms : /_app/immutable/chunks/CuKERsJE.js
- 8938.7 → 141 ms : /_app/immutable/chunks/E2jh4b8j.js
- 9079.7 → 182 ms : Unattributable
- 9261.7 → 1139 ms : /_app/immutable/chunks/E2jh4b8j.js
- 10400.7 → 62 ms : /_app/immutable/chunks/E2jh4b8j.js

**skip mobile run 3** (8 tasks):

- 820.7 → 58 ms : /lab/boot
- 878.7 → 56 ms : Unattributable
- 934.7 → 53 ms : Unattributable
- 987.7 → 590 ms : Unattributable
- 1577.7 → 1003 ms : Unattributable
- 8926.7 → 219 ms : /_app/immutable/chunks/E2jh4b8j.js
- 9145.7 → 1085 ms : /_app/immutable/chunks/E2jh4b8j.js
- 10230.7 → 51 ms : /_app/immutable/chunks/E2jh4b8j.js

**skip desktop run 1** (4 tasks):

- 384.9 → 139 ms : Unattributable
- 539.9 → 303 ms : Unattributable
- 1592.9 → 115 ms : Unattributable
- 1707.9 → 603 ms : /_app/immutable/chunks/E2jh4b8j.js

**skip desktop run 2** (5 tasks):

- 274.2 → 50 ms : Unattributable
- 356.2 → 208 ms : Unattributable
- 594.2 → 226 ms : Unattributable
- 1616.6 → 123 ms : Unattributable
- 1739.6 → 562 ms : /_app/immutable/chunks/E2jh4b8j.js

**skip desktop run 3** (4 tasks):

- 356.9 → 191 ms : Unattributable
- 575.9 → 225 ms : Unattributable
- 1613.4 → 119 ms : Unattributable
- 1732.4 → 560 ms : /_app/immutable/chunks/E2jh4b8j.js

**current mobile run 1** (10 tasks):

- 827 → 72 ms : /lab/boot
- 899 → 340 ms : Unattributable
- 1239 → 660 ms : Unattributable
- 1899 → 123 ms : Unattributable
- 2069 → 91 ms : Unattributable
- 2203 → 70 ms : Unattributable
- 2273 → 106 ms : Unattributable
- 2423 → 59 ms : Unattributable
- 8354.8 → 157 ms : /_app/immutable/chunks/DE0Zr2N4.js
- 8511.8 → 124 ms : /_app/immutable/chunks/DE0Zr2N4.js

**current mobile run 2** (12 tasks):

- 821.9 → 66 ms : /lab/boot
- 887.9 → 294 ms : Unattributable
- 1181.9 → 665 ms : Unattributable
- 1846.9 → 143 ms : Unattributable
- 1989.9 → 110 ms : Unattributable
- 2237.9 → 64 ms : Unattributable
- 2301.9 → 74 ms : Unattributable
- 2375.9 → 118 ms : Unattributable
- 2539.9 → 57 ms : Unattributable
- 8438.9 → 148 ms : /_app/immutable/chunks/DE0Zr2N4.js
- 8586.9 → 104 ms : /_app/immutable/chunks/DE0Zr2N4.js
- 8690.9 → 50 ms : /_app/immutable/chunks/DE0Zr2N4.js

**current mobile run 3** (11 tasks):

- 821.2 → 84 ms : /lab/boot
- 905.2 → 282 ms : Unattributable
- 1187.2 → 738 ms : Unattributable
- 1925.2 → 147 ms : Unattributable
- 2127.2 → 111 ms : Unattributable
- 2238.2 → 65 ms : Unattributable
- 2303.2 → 106 ms : Unattributable
- 2409.2 → 56 ms : Unattributable
- 2465.2 → 55 ms : Unattributable
- 8413.2 → 156 ms : /_app/immutable/chunks/DE0Zr2N4.js
- 8569.2 → 95 ms : /_app/immutable/chunks/DE0Zr2N4.js

**current desktop run 1** (4 tasks):

- 295.3 → 81 ms : Unattributable
- 386.3 → 140 ms : Unattributable
- 1608.9 → 85 ms : Unattributable
- 1693.9 → 50 ms : Unattributable

**current desktop run 2** (3 tasks):

- 276.8 → 76 ms : Unattributable
- 363.8 → 145 ms : Unattributable
- 1557.6 → 72 ms : Unattributable

**current desktop run 3** (4 tasks):

- 294.7 → 86 ms : Unattributable
- 396.7 → 171 ms : Unattributable
- 1591.9 → 74 ms : Unattributable
- 1665.9 → 66 ms : Unattributable

### LCP simulation endpoints for every primary run

Replay uses the installed v13.5 computation. Endpoints below are the latest optimistic/pessimistic simulated node, which is an actual graph result; they are not an assertion of a DOM dependency. Each raw diagnostic also includes the next seven endpoints, their parents, priorities and all observed long tasks.


| Replay | Observed s | Simulated s | Optimistic endpoint | Pessimistic endpoint |
| --- | --- | --- | --- | --- |
| [ocio mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-mobile-1-vulkanheaded.json-assets/diagnostic.json>) | 0.379 | 1.474 | /_app/immutable/chunks/CuKERsJE.js @ 1.399 s | /_app/immutable/chunks/CuKERsJE.js @ 1.549 s |
| [ocio mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-mobile-2-vulkanheaded.json-assets/diagnostic.json>) | 1.444 | 11.872 | /_app/immutable/assets/gba-boot.DcboyRJk.mp3 @ 11.797 s | /_app/immutable/assets/gba-boot.DcboyRJk.mp3 @ 11.947 s |
| [ocio mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-mobile-3-vulkanheaded.json-assets/diagnostic.json>) | 0.439 | 1.999 | /_app/immutable/nodes/3.DTx_hmYB.js @ 1.999 s | /_app/immutable/nodes/3.DTx_hmYB.js @ 1.999 s |
| [ocio desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-desktop-1-vulkanheaded.json-assets/diagnostic.json>) | 0.461 | 0.569 | RunTask @ 0.569 s | RunTask @ 0.569 s |
| [ocio desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-desktop-2-vulkanheaded.json-assets/diagnostic.json>) | 0.477 | 0.572 | RunTask @ 0.572 s | RunTask @ 0.572 s |
| [ocio desktop 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/ocio/lh-desktop-3-vulkanheaded.json-assets/diagnostic.json>) | 0.468 | 0.559 | RunTask @ 0.559 s | RunTask @ 0.559 s |
| [skip mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-mobile-1-vulkanheaded.json-assets/diagnostic.json>) | 0.947 | 1.922 | /_app/immutable/chunks/CuKERsJE.js @ 1.847 s | /_app/immutable/nodes/3.Bd4-nwvl.js @ 1.997 s |
| [skip mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-mobile-2-vulkanheaded.json-assets/diagnostic.json>) | 0.417 | 1.666 | /_next-live/feedback/feedback.js @ 1.666 s | /_next-live/feedback/feedback.js @ 1.666 s |
| [skip mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-mobile-3-vulkanheaded.json-assets/diagnostic.json>) | 0.368 | 1.997 | /_app/immutable/nodes/3.Bd4-nwvl.js @ 1.997 s | /_app/immutable/nodes/3.Bd4-nwvl.js @ 1.997 s |
| [skip desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-desktop-1-vulkanheaded.json-assets/diagnostic.json>) | 0.478 | 0.568 | RunTask @ 0.568 s | RunTask @ 0.568 s |
| [skip desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-desktop-2-vulkanheaded.json-assets/diagnostic.json>) | 0.487 | 0.573 | RunTask @ 0.573 s | RunTask @ 0.573 s |
| [skip desktop 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/skip/lh-desktop-3-vulkanheaded.json-assets/diagnostic.json>) | 0.467 | 0.561 | RunTask @ 0.561 s | RunTask @ 0.561 s |
| [current mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-mobile-1-vulkanheaded.json-assets/diagnostic.json>) | 0.512 | 2.018 | /_app/immutable/nodes/3.C9SQ7XEf.js @ 2.002 s | RunTask @ 2.033 s |
| [current mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-mobile-2-vulkanheaded.json-assets/diagnostic.json>) | 0.445 | 2.018 | /_app/immutable/nodes/3.C9SQ7XEf.js @ 1.999 s | RunTask @ 2.038 s |
| [current mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-mobile-3-vulkanheaded.json-assets/diagnostic.json>) | 0.48 | 2.016 | /_app/immutable/nodes/3.C9SQ7XEf.js @ 1.995 s | RunTask @ 2.036 s |
| [current desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-desktop-1-vulkanheaded.json-assets/diagnostic.json>) | 0.512 | 1.404 | /draco/draco_decoder.wasm @ 1.383 s | /draco/draco_decoder.wasm @ 1.426 s |
| [current desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-desktop-2-vulkanheaded.json-assets/diagnostic.json>) | 0.523 | 1.282 | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 1.261 s | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 1.303 s |
| [current desktop 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/current/lh-desktop-3-vulkanheaded.json-assets/diagnostic.json>) | 0.53 | 0.591 | /_next-live/feedback/feedback.html @ 0.591 s | /_next-live/feedback/feedback.html @ 0.591 s |
| [base mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-1-vulkanheaded.json-assets/diagnostic.json>) | 1.36 | 13.632 | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 13.632 s | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 13.632 s |
| [base mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-2-vulkanheaded.json-assets/diagnostic.json>) | 0.338 | 8.435 | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 8.435 s | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 8.435 s |
| [base mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-3-vulkanheaded.json-assets/diagnostic.json>) | 0.394 | 8.584 | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 8.584 s | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 8.584 s |
| [base mobile 4](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-mobile-4-vulkanheaded.json-assets/diagnostic.json>) | 0.391 | 7.953 | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 7.953 s | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 7.953 s |
| [base desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-desktop-1-vulkanheaded.json-assets/diagnostic.json>) | 0.353 | 2.045 | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 2.045 s | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 2.045 s |
| [base desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/base/lh-desktop-2-vulkanheaded.json-assets/diagnostic.json>) | 0.381 | 2.22 | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 2.22 s | /_app/immutable/assets/bedroom.mDI30nfq.glb.br @ 2.22 s |
| [stage4 mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-1-vulkanheaded.json-assets/diagnostic.json>) | 0.314 | 8.234 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.234 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.234 s |
| [stage4 mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-2-vulkanheaded.json-assets/diagnostic.json>) | 0.31 | 8.22 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.22 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.22 s |
| [stage4 mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-3-vulkanheaded.json-assets/diagnostic.json>) | 0.309 | 8.231 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.231 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.231 s |
| [stage4 mobile 4](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-mobile-4-vulkanheaded.json-assets/diagnostic.json>) | 1.322 | 13.66 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 13.66 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 13.66 s |
| [stage4 desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-desktop-1-vulkanheaded.json-assets/diagnostic.json>) | 0.377 | 1.765 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 1.765 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 1.765 s |
| [stage4 desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/stage4/lh-desktop-2-vulkanheaded.json-assets/diagnostic.json>) | 0.388 | 2.016 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 2.016 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 2.016 s |
| [proto mobile 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-1-vulkanheaded.json-assets/diagnostic.json>) | 0.337 | 8.212 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.212 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 8.212 s |
| [proto mobile 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-2-vulkanheaded.json-assets/diagnostic.json>) | 0.306 | 7.058 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 7.058 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 7.058 s |
| [proto mobile 3](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-3-vulkanheaded.json-assets/diagnostic.json>) | 0.294 | 6.305 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 6.305 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 6.305 s |
| [proto mobile 4](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-mobile-4-vulkanheaded.json-assets/diagnostic.json>) | 0.374 | 6.886 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 6.886 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 6.886 s |
| [proto desktop 1](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-desktop-1-vulkanheaded.json-assets/diagnostic.json>) | 0.372 | 1.708 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 1.708 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 1.708 s |
| [proto desktop 2](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto/lh-desktop-2-vulkanheaded.json-assets/diagnostic.json>) | 0.37 | 1.359 | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 1.359 s | /_app/immutable/assets/room-shell.-Q40vLGb.glb.br @ 1.359 s |


Installed source used for the replay: [Lantern LCP graph and coefficients](<C:/Users/Neil Skaria/AppData/Roaming/npm-cache/_npx/0f94ee7615faf582/node_modules/@paulirish/trace_engine/models/trace/lantern/metrics/LargestContentfulPaint.js>). The final prototype can be recreated on a fresh aaab469 scratch worktree by applying [the full diff](<C:/Users/NEILSK~1/AppData/Local/Temp/impl/diag/proto.diff>) (including local Vite/Brotli configuration), then building and serving it with the serial local harness. The early preparation scripts alone recreate the initial variant, not the final buffer-preserving one.

## Limits and cleanup

- The exact owner Chrome 151/DevTools/hardware path and raw report were unavailable; the reported 80/89 could not be reproduced. We established that this machine's default GPU path fails and that headless alone is not the explanation, but cannot quantify the remainder of the owner gap.
- The 8–14 s LCP simulation mechanism is proved by trace replay and controlled request delays. CSS/opacity/promotion/filter/font timing can alter observed cutoff and thus simulation, but these variable A/B samples do not identify one universal CSS culprit. Head script and `data-intro` were tested together, not independently.
- The phone profile is browser emulation on this PC, not a physical handset. First-frame timestamps use DOM/canvas visibility and draw markers, with separate filmstrip verification.
- No production Stage 5/CDN measurement was possible because the prototype was deliberately never deployed. Local JS/WASM/assets and network protocol are not identical to Vercel's delivery, so compare local builds only with each other; do not interpret the local 66 as the deployed current 76 or owner's 80.
- The prototype's duplicated temporary/final preparation inflates its TBT. A future implementation could avoid that, but its score or first-frame gain was not measured here. The SI-only ceilings remain the measured upper bound for changes solely to SI; a change to TBT/LCP can change the overall outcome beyond that ceiling.
- The initial single mobile no-head/room-hidden/combined-style screens are exploratory; those exact variants were not all repeated. Per-variant sample counts and outliers are explicit.
- Main tracked files remain unchanged. Only this report was written in the main checkout; prototype source changes remain on the throwaway branch. Owned port-4260 servers and diagnostic browsers were stopped. The worktree node_modules junction was removed without deleting its target. Nothing was pushed, merged, committed or deployed.
