# Round 2 — L — Loading strategy

Recommendation: ship A's asset reductions first, keep a deliberately scheduled loading graph, and drop progressive lightmaps (L6). Forecasts on the original phone **emulation** are approximately **20–22 s after assets, 16–18 s after assets + loading, and 14–16 s after all four tracks**, using the measured WebP candidates. These are simulations, not measured optimized builds or real Android results. A quality-approved 400 KB lighting set could remove roughly another second, depending on overlap.

Scope: plan only. The sole repository output is this report. Experiments are in `%TEMP%\perf\scratch\L\`; no source, asset, build, server or deployment was changed. Read: the brief, all round-1 reports, baseline, raw phone request log, baseline/GL harnesses, loading/rendering source and relevant scratch scripts. No new browser startup benchmark or real-device test was performed.

Number labels: **M** = measured file/artifact or recorded baseline; **I** = source inspection; **S** = simulated/calculated with stated assumptions; **A** = assumed budget or proposed test setting. KB/MB are decimal unless explicitly KiB. Ranks and test counts are recommendations. No visual candidate is considered owner-approved merely because its size was measured.

## Critiques

### A — assets

- **Agree; replace my L1 leaf recommendation.** The plant-group bug makes A1/A2 much better than lossless-only conversion. Leaf **1,282,699 → 37,320 B (M, A's candidate rechecked)** supersedes my **803,102 B lossless candidate (M, round 1)**. Keep the pipeline fix and reproducible packing script. Keep A9's exact portrait WebP. Count these bytes under A once, not again under L.
- **Agree on A7/A8 conditionally.** The candidate WebP lighting set is **582,124 B (M)**, not 400 KB. A complete smaller AVIF set is still a scenario. Atlas PSNR is screening, not proof of invisible final shading at saturated tint/brightness. Room-lamp is **1024² (M, A)**; reject G10's permanent reduction to **512²** given A's **41 dB (M, A)** result and the floor lattice shadows. Wall 1024² still needs portrait-focus approval. Both day and lamp layers must be present at first finished display.
- **Disagree with treating 1.05 MB as a working final GLB.** `v8-norm10.glb` has empty Cube* nodes; `engine.ts:363–385` requires their meshes for bounds, face orientation and materials **(I)**. Its script also downsizes BonsaiWood despite A recommending 1024². I measured retained wood at **32,124 B versus 13,310 B in the candidate (M)**. Supply actual proxy geometry or explicit metadata and preserve wood. My forecast reserves **22,000 B (A)** for these corrections; this is an allowance, not implemented geometry.
- **Pipeline correction:** A's `v8.mjs` registers `KHRONOS_EXTENSIONS`, omitting EXT classes it uses. Its log warns that unregistered extensions will not be written **(I)**. `v8-norm10.glb` has WebP images without declaring `EXT_texture_webp`; final `v9-meshopt.glb` has **zero meshopt bufferViews (M/I)**. Register the EXT classes or `ALL_EXTENSIONS`. The earlier `meshopt-high.glb` is correctly extension-declaring; the defect is specific to the later script/output.
- **A11: retain the conclusion, narrow the reasoning.** An automatic-compression allowlist does not prove explicitly encoded static responses are impossible. Compare both codecs compressed when precompression is permitted. The corrected comparison still favors Draco by **488,535 B including decoders (M)**, or **2.44 s transfer (S)**. Delivery support must be verified on a disposable deployment; local compression proves no CDN behavior.
- **A10/J4 overlap:** strip artwork and fetch the sound early. Byte reduction and elimination of a late fetch are different effects. With the mono candidate, J4's old **0.75–0.9 s** becomes about **0.4–0.6 s (A)** of recoverable late fetch/decode wait; do not subtract both full estimates.

### G — GPU/runtime

- **Agree with G1 as a quality-gated experiment.** An offline environment removes the dependency on rendering the loaded room to capture it, but adds a download. I budget **60 KB (A)**; each extra **100 KB costs 0.5 s exposed transfer (S)**. Validate cubeUV layout, sRGB/exposure interpretation, roughness levels and reflections on Game Boy shell/screen cover/cube. Preserve relative material intensities. Generate it from accepted assets and invalidate it with lighting changes.
- **G2 correction:** `engine.ts:686` already awaits `compileAsync` **(I)**, after synchronous `pmrem.fromScene` at line 630. The change is to eliminate/restructure first-use capture, establish final environment/light/material flags before first use, and warm remaining interaction variants. It is not “add compileAsync.” G1/G2/G11 affect overlapping shader work; their savings cannot be summed.
- **Combine G2 with J1.** Yielding JavaScript cannot interrupt a blocking WebGL call; asynchronous shader polling does not slice bonsai generation or hull construction. Local three.js `compileAsync` itself calls synchronous `compile` traversal before polling **(I, `WebGLRenderer.js:1515`)**. Both approaches are needed for responsiveness, with residual work measured after G1/G11.
- **Measurement correction:** `gl.mjs` explicitly calls `getProgramParameter(..., LINK_STATUS)` immediately after intercepted `linkProgram` **(I)**. This forces completion and perturbs asynchronous behavior. Use its diagnostic costs/counts cautiously; use the uninjected trace for elapsed-time claims. Its link totals are not additive to the trace's nested blocking durations.
- **Agree with the loader half of G10, reject its room-lamp size claim.** Preserve channel 1, sRGB and orientation matching current `flipY=false`; check portrait orientation independently. Remeasure on A's smaller assets, without also subtracting G10's entire baseline saving. Compression alone does not reduce decoded dimensions or GPU allocation.
- **Agree with G3/G4/G5 and G7/G8 for running cost.** Render-on-demand needs scheduled invalidations for continuous motes, sway, portrait and clock updates. Lower idle cadence requires owner-approved recordings; active parallax/interaction must not be classified as idle. G4's lazy trail is the useful concrete version of my broad L7.
- **G9 before freezing J2's worker contract.** Remove redundant attributes/transforms, then define compact transferable buffers. Attribute savings and worker relocation are complementary but touch the same foliage pipeline. G/J should provide actual vertex/attribute counts; I did not remeasure them here.

### J — JavaScript/CPU

- **Agree with J1 without booking CPU eliminated.** It improves responsiveness. Reassess its scope after A/G shrink the monolithic task. A single idle callback around the entire initializer still blocks once entered; returning visitors should not create a renderer in that callback.
- **Agree with J2/J5 in dependency order.** Reduce redundant bonsai work first, coordinate buffers with G9, transfer rather than clone. A worker cannot overlap generation with downloading geometry it needs. Generate picking hulls from final simplified geometry and preserve hover/picking behavior. Main-thread time removed is not the same as elapsed time saved.
- **Merge J3 + L2 + L5 + G15 under one owner.** Move the lightweight manifest ahead of the engine dependency; start useful GLB/Draco downloads early; remove the five serial lighting-group gates and portrait gate. Protect module/geometry delivery, overlap geometry-only work with lighting transfer, and budget decode/upload bursts separately. Launching everything together is not sufficient scheduling.
- **Merge J4 into that graph, preserving normal audio.** Fetch early and decode while other work proceeds; resume on the real gesture. Do not wait until the first START press to begin normal chime preparation and silently use the synthesized fallback on an otherwise successful load. Verify earliest START, timing, mute and radio. Failed optional audio must not strand loading.
- **J6 remains a comparison, not a presumed switch.** Corrected compressed sizes below disfavor meshopt here. J8 is small; J9 saves no transfer; J11 is outside `/lab/boot`; J12 has no observed critical-path gain. J10 belongs with L4's returning-reader background budget.

## Experiments (method, result)

### 1. D1 / L6 — progressive lightmaps after asset compression

`L/measure.mjs` assembled the full set from A's sharp-YUV q95 room-day/room-lamp/props-lamp, A's 1024² wall pair and the other existing maps. It created an extra low pass from A's decoded PNG intermediates using ImageMagick resize, `webp:use-sharp-yuv=true`, method 6, q95. Low maps are **512² except plant at 256² (experiment settings)**. These PNGs are not all original pristine bake outputs: this is a byte experiment, not production encoding or fidelity approval. Files and detailed results are in `L/*-low.webp` and `L/measurements.json`.

| Pair | Full candidate B (M) | Low pass B (M) |
| --- | ---: | ---: |
| props | 171,496 | 95,830 |
| bed | 109,708 | 70,446 |
| room | 154,134 | 63,518 |
| wall | 35,098 | 20,462 |
| plant | 111,688 | 61,464 |
| Total | **582,124** | **311,720** |

Low-first removes **270,404 B (M arithmetic)** initially: at most **1.35 s transfer (S)** at 200,000 B/s. Reaching final quality then transfers **893,844 B of lightmaps (S)** instead of 582,124 B, adds a second decode/upload pass and potentially retains both sets. A more aggressive low-pass encode might save more but needs its own fidelity test.

The model below gives **1.35 s earlier initial readiness (S)** under broad concurrency, versus **0.52 s (S)** when prioritizing the GLB and overlapping geometry preparation with lighting. Low-scene readiness is not accepted final-quality readiness.

For a **400,000 B full set (A)**, extrapolating this low/full ratio gives **214,190 B low-pass (A)**, and an exposed transfer advantage of **0.93 s (S)**. In the GLB-prioritized graph, readiness changes **15.91 → 15.83 s (S)** after assets/loading, or **13.87 → 13.80 s (S)** after all tracks. Geometry-dependent work dominates. Read these tiny differences as approximately zero, not an 80 ms prediction.

**Decision: drop L6.** My old approximately five-second claim used the original heavy maps and did not account for the asset/loading tracks. Keep an optional static poster separate from final-quality readiness. Reopen only if post-optimization device traces show a material exposed network wait and the owner approves the transition. Runtime PMREM would capture the low maps; G1 removes that problem but not extra bytes, uploads or visible changes.

### 2. D7 — calibrated waterfall simulation

`L/waterfall.mjs` produces `L/waterfall.json`. Serial replay uses `base/baseline-phone-1.json` request timing and encoded byte counts. The alternative is a shared-link discrete-event model: **200,000 B/s aggregate bandwidth, 150 ms request latency (baseline settings)**. Each parallel request shares that link. HTTP/2/3 priority implementation, TCP/radio dynamics, actual mobile image decode and mobile GPU behavior are not modeled.

The log total is **6,551,563 B (M)**, including a **242 B version request after START (M)**. Strict pre-START transfer is **6,551,321 B (M)**. This distinction has no material impact.

| Baseline gate | Seconds from navigation (M) |
| --- | ---: |
| engine request / completion | 1.463 / 2.801 |
| GLB request / completion | 3.152 / 23.992 |
| first lightmap group begins | 25.595 |
| last lightmap group completes | 34.530 |
| portrait completes | 35.941 |
| chime request / completion | 41.178 / 41.926 |
| START detected | 42.693 |

Serial replay reproduces these gates exactly by calibration, not independent validation. Retained residuals are: GLB transfer overhead **0.560 s (M-derived)**; GLB-finish to lighting-start **1.603 s (M)** including decoder download/initialization; portrait-finish to chime-start **5.237 s (M)**; chime-finish to START **0.767 s (M)**. The lighting groups add only about **1.0 s (M-derived)** beyond aggregate payload transfer, not nine seconds recoverable by parallelization.

Assumptions for forecasts:

- Working GLB budget **1,070,256 B (A)** = corrected candidate **1,048,256 B (M)** plus wood/proxy allowance **22,000 B (A)**. Portrait **14,060 B (M)**, mono chime **56,469 B (M)**, lighting **582,124 B (M)**. Small header allowances and original shell/decoder wire sizes are retained. Assets/loading payload is **2.279 MB (S)**.
- Asset-only decoder/parse gate reduction **0.15 s (A)** and scene-preparation reduction **0.55 s (A)**. No shader saving is credited. Without those assumptions, asset-only readiness is **21.33 s (S)** instead of 20.63 s.
- Graph discovery **1.463 s (A, matching baseline engine discovery)**. Module/decoder/geometry/lighting compete on one link. GLB parse adds **0.30 s (A)** after prerequisites. Geometry/picking preparation **1.30 s (A)** can overlap lighting; subsequent rendering preparation **3.387 s (A)** and final readiness **0.60 s (A)** remain.
- All tracks replace those geometry/rendering stages with **1.0 s / 1.35 s (A)** and add a **60 KB environment asset (A)**. This is one combined G/J reduction, not separately additive PMREM/compile/variant/worker estimates. Runtime scheduler savings are not separately subtracted from startup.
- Priority sensitivity: engine/decoder weight **8**, GLB **4 or 12**, each lightmap **1 or 0.2 (A)**. These fluid-model weights are not guaranteed browser fetch priorities. Broad request bursts delay the engine in the model; implementation should protect bootstrap delivery and verify actual contention.

| Track; same localhost encoding as baseline | Payload MB (S unless marked) | START forecast s (S unless marked) | Planning range s (A) |
| --- | ---: | ---: | ---: |
| baseline | 6.551 (M) | 42.693 (M) | — |
| assets only, existing serial chain | 2.279 | **20.63** | **20–22** |
| assets + loading; GLB priority / broad concurrency | 2.279 | **16.40 / 18.00** | **16–18** |
| all four; GLB priority / broad concurrency | 2.339 | **14.66 / 15.96** | **14–16** |

Illustrative all-track GLB-prioritized timeline **(all S)**: engine available **5.97 s**; GLB complete **10.67 s**, decoded **10.97 s**; geometry preparation complete **11.97 s**; lighting/network complete **12.71 s**; rendering preparation and readiness finish **14.66 s**. This demonstrates overlap and the need to protect module delivery, not an observed future waterfall.

With the **400 KB lighting assumption**, assets alone become **19.72 s (S)** and all tracks with GLB priority **13.87 s (S)**. Do not promise sub-ten-second cold startup from this plan: the full WebP/all-track payload alone takes **11.70 s (S)** with perfect link utilization.

Production is different: recorded localhost WASM is uncompressed. Vercel's current automatic list includes WASM and omits `model/gltf-binary`. Actual headers still need checking. [Vercel compression documentation](https://vercel.com/docs/how-vercel-cdn-works/compression)

Using **66 KB total Draco transfer and 36 KB less engine JS (A, encoded-size budgets)** removes **0.87 s payload transfer (S)**. Production all-track forecasts become **13.79–15.09 s (S)** with WebP, before new connection/CDN/radio delays. Asset-only sensitivity changes just the late decoder gate by **0.70 s (A)** to **19.93 s (S)**, leaving early shell timing unchanged. These are not deployment results. Explicit GLB compression is an additional conditional saving, not already included.

Ideas that lose value: L6; lossless-only leaf conversion; treating parallel requests as additional bandwidth; eliminating font readiness with no observed wait; speculative controller splitting; summing G1/G2/G11; a room-precaching service worker; unconditional returning-reader scene setup. Versioning Draco remains cache hygiene, not a cold-load improvement.

### 3. D6 / L8 — matched codec comparison, both precompressed

Reused A's scratch dependencies and preparation, with EXT classes registered. Both candidates start from the repository GLB, apply the same removals/simplification/texture preparation and encode at **12/10/12 position/normal/UV settings (experiment settings)**. Meshopt uses high mode; Draco uses A's encode/decode settings. Both retain the size-candidate wood/proxy caveats. Files/scripts/reports: `L/meshopt.mjs`, `L/draco.mjs`, `*-valid.glb`, `*-valid.json`. Compression settings: **gzip level 9 / Brotli quality 9**.

| Candidate | Raw B (M) | gzip B (M) | Brotli B (M) |
| --- | ---: | ---: | ---: |
| corrected Draco GLB | 1,048,256 | 884,812 | 874,851 |
| corrected meshopt GLB | 2,373,700 | 1,439,440 | 1,421,804 |
| Draco WASM | 192,420 | 63,395 | 54,943 |
| Draco wrapper | 58,456 | 11,667 | 10,840 |
| meshopt decoder | 29,256 | 7,804 | 7,365 |

Corrected meshopt declares its required extension and has **240 compressed bufferViews (M)**. A's final v9 has none, and its **2,803,418 B Brotli size (M)** must not be presented as a meshopt result.

Including decoders: **1,429,169 B meshopt versus 940,634 B Draco (M arithmetic)**, a **488,535 B / 2.44 s transfer disadvantage (S)**. A's desktop decode advantage extrapolates to roughly **0.4–0.6 s on the profile (A)** and can partly overlap other work. Keep Draco for cold slow 4G. Reopen if actual phone decode savings exceed the exposed byte penalty; fast links/warm visits are a separate comparison.

Precompressing Draco alone saves **173,405 B (M)**, at most **0.87 s exposed transfer (S)**. This is smaller than my original-GLB compression claim. Verify explicit encoded static delivery on a disposable deployment: correct content type/encoding, negotiation or fallback, cache separation where representations vary, and GLTFLoader success without a duplicate request. Renaming compressed bytes or changing MIME to sneak onto the allowlist is not a valid delivery design. Include any added request, decoder or server work in the result.

### 4. D3 / D8 — cheapest credible real-device check

Use the owner's Android over USB with Chrome remote DevTools and port forwarding. This measures its real CPU/GPU without a paid service or public deployment. Enable USB debugging, authorize the computer on the phone, inspect its Chrome tab at `chrome://inspect/#devices`, and forward baseline and separate scratch servers. **4173 stays baseline; 4174 is a proposed scratch port (A)**. Disable screencasting while timing: Chrome documents its frame-rate cost. [Android debugging](https://developer.chrome.com/docs/devtools/remote-debugging), [local port forwarding](https://developer.chrome.com/docs/devtools/remote-debugging/local-server)

Proposed protocol; no device results collected:

1. Record model, SoC/GPU, Android/Chrome versions, refresh rate, canvas dimensions/DPR, battery-saver and thermal state. Use native device CPU/GPU: **do not apply the desktop 4× CPU throttle again**. Fix brightness and cool between paired runs. A powerful phone can find regressions but cannot validate all mid-range phones.
2. Set custom **1.6 Mbps down / 0.75 Mbps up / 150 ms latency (proposed settings)**, not a named preset that may change. Also test unthrottled local loading to expose computation. USB-forwarded traffic is not real 4G; follow with a small real-cellular check on an authorized hosted preview when available. [Chrome network controls](https://developer.chrome.com/docs/devtools/network/reference#throttling)
3. Compare isolated baseline, assets, assets/loading, and all-track builds. Run **three cold loads each (A minimum)**, alternating baseline/candidate order. Clear HTTP cache and relevant first-visit/session state. Separately test repeat visits and explicit return to room. HTTP cache clearing does not establish a cold driver shader cache: distinguish first-process from subsequent runs where practical.
4. Capture encoded bytes, request initiators and stage marks: engine ready, GLB decoded, lighting decoded, shader ready, first room frame, input ready. Retain START detection for baseline comparison, but DOM presence alone does not prove a presented frame or responsive tap. Record long tasks and first-hover/cut/boot stalls. Keep heavy profiling separate from uninstrumented wall-time runs.
5. Query `gl.getExtension('KHR_parallel_shader_compile')` on the room's actual context. Compatibility data documents Chrome/Android support from **76**, but does not prove availability or useful parallelism on every Adreno/Mali driver. Khronos specifies nonblocking completion polling, not guaranteed shorter linking. Retain a fallback; record the handset result. [Browser compatibility data](https://chromium.googlesource.com/external/github.com/mdn/browser-compat-data/+/refs/heads/flat-diff/api/KHR_parallel_shader_compile.json), [Khronos specification](https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/)
6. Record idle/active intervals of **30 s each (A)** and a **five-minute soak (A)** for thermal drift, frame times, memory growth and context loss. Exercise cube, bonsai trim/growth/turntable, portrait, radio, boot dive and return. Count actual rendered frames: a scheduler can render at 24 fps while rAF continues at display rate. CDP TaskDuration is renderer main-thread occupancy, not system CPU, GPU utilization or battery drain. Do not relabel CPU savings as measured energy savings.
7. Make separate device/desktop visual comparisons at matching cameras: plant/pot, cloth, wall/portrait focus, lantern warm/red/blue at required **brightness 1.5**, and reflective objects. Obtain owner side-by-side approval. Record motion separately from timing. Check outlines and all mini-games; desktop mouse tests cover hover absent from touch.
8. Check returning-reader responsiveness during byte warming and report intent-to-room latency independently. Include early exit, failed fetch, Save-Data and reduced motion. Verify the first possible START still plays the normal timed chime.

A current physical WebPageTest Moto G slot, browser version and price could not be verified from accessible primary documentation in this round. Historical availability is not proof of a current physical-device option; emulation is not a substitute. WPT can be a secondary hosted-network waterfall check once its actual device is confirmed, not a replacement for interactive/visual tests. Start with USB if the owner has a suitable phone; no purchase or paid run is required.

## Revised ranked list

These savings are not additive where work overlaps. None requires a new lighting bake.

### 1. L1 → A1/A2 + A9: fix asset representation first

- **Keep:** plant pipeline fix, optimized embedded WebP, preserved BonsaiWood, exact portrait, correct extension registration and cube contracts. A owns packing.
- **Saving:** embedded images **2,239,837 → 175,476 B (M, A all-512 candidate)** plus **18,814 B (M)** to retain wood. Portrait **240,270 → 14,060 B (M)**. Together approximately **2.27 MB / 11.36 s transfer (S)** before geometry/lightmap savings. Replaces my old lossless-only package; do not add it to A again.
- **Risk / effort:** low–medium visual risk; small packing edit, medium reproducibility/contract work. **Re-bake: no.**
- **Verify:** extensions/dimensions, working cube orientation/materials, owner-approved close-ups, exact portrait pixels, repeatable packing budget.

### 2. L2 + L5 + J3/J4: one scheduled loading graph

- **Keep:** early lightweight manifest/GLB/Draco; independent lighting/portrait fetches; early audio; geometry work overlapping network; controlled uploads/compilation; deduplicated promises and cancellation. First completed room has both lighting layers and functional visible objects.
- **Saving:** **2.6–4.2 s incremental after assets (S)**; no inherent byte reduction. Subsumes J3/J4/G15.
- **Risk / effort:** medium contention, lifecycle and audio-timing risk; medium effort. **Re-bake: no.**
- **Verify:** actual waterfall, one request per asset, removed group gates, protected module delivery, first-frame/input marks, earliest START sound, abort/failure handling and return animation.

### 3. L4 with J1: byte-only warming for returning visitors

- **Keep:** separate fetch/cache warming from renderer, PMREM, upload and compilation. Prepare on intent with J1 stages and G's corrected compile strategy. Provide a working entry affordance before the engine exists; today's `openRoom` returns immediately without one **(I)**. Coordinate radio preparation.
- **Saving:** avoids background initialization and its measured multi-second task while reading. No cold-room byte saving. Remaining avoided work after A/G/J must be measured. Explicitly trades some intent-to-room delay for page responsiveness; cannot promise universally instant return.
- **Risk / effort:** medium lifecycle/state risk and effort. **Re-bake: no.**
- **Verify:** no WebGL/scene generation before intent; responsive reading; touch/hover intent, retry, disposal and repeated returns; Save-Data/reduced-motion honored.

### 4. L3: usable early exit and honest loading; poster optional

- **Keep:** “Continue to site” without an engine; progress stages; cancel/ignore late results. Apply data-saving policy to first visits too; current Save-Data handling is returning-only **(I, `BootIntro.svelte:285–303`)**. Preserve entry back to room.
- **Saving:** earlier usable site access; **zero intrinsic room-ready gain**. Optional poster target **30 KB (A)** costs **0.15 s shared-link transfer (S)**. Drop my automatic 50–100 KB poster assumption; the exit does not need one.
- **Risk / effort:** low–medium UI/state risk; small–medium effort. **Re-bake: no.**
- **Verify:** keyboard/touch exit before import completes and on failures, no late unwanted reveal, honest readiness, approved poster handoff if used.

### 5. L8 + L9: compressed delivery proof and decoder versioning

- **Keep:** post-pack encoded-GLB delivery experiment; correct headers/fallback; hashed or content-versioned immutable Draco URLs. Keep Draco unless actual device evidence overturns the tradeoff.
- **Saving:** GLB **173,405 B (M)**, up to **0.87 s exposed transfer (S)**. Decoder compression on production is an environment correction, not a new optimization. URL versioning saves **zero on a cold visit**.
- **Risk / effort:** medium delivery/configuration risk; small–medium effort. **Re-bake: no.**
- **Verify:** deployed encoded bytes, browser decompression/loader success, cache behavior after version change, identity fallback where needed, no double compression or duplicate downloads.

Dropped/merged: **L6 dropped**; L7 narrowed to G4's lazy trail; L10 service worker unjustified. G/J own CPU/rendering/runtime work. Real-device verification is a completion requirement, not an extra optimization with invented savings.

## Open disputes for round 3

1. **D1:** owner-approved codec/tint/portrait comparisons and a complete measured 400 KB set. L6 is closed as “do not implement” unless post-optimization evidence demonstrates a material exposed wait.
2. **D2:** G1's actual payload, cubeUV/color/exposure correctness, reflective screenshots, material intensities, invalidation and residual shader cost. The modeled 60 KB remains assumed.
3. **D3:** account for existing compileAsync and synchronous first-use capture. Measure incremental G2 after G1/G11 without forced LINK_STATUS stalls; obtain actual Adreno/Mali extension results.
4. **D4/D5:** actual foliage buffers and worker contract; rendered cadence and responsiveness after scheduling; owner-approved motion. No battery number without energy measurement.
5. **D6:** working packed model with cube proxies/metadata and preserved wood, proper extensions, actual-host encoded delivery proof. Corrected precompressed meshopt still loses the byte comparison.
6. **D7:** a functional combined scratch build and repeated traces. Scheduling spans roughly 1–2 s here; mobile CPU/GPU benefits remain assumptions. Verify audio, first-frame readiness and shader-cache effects. Never present 14–16 s as measured Android performance.
7. **D8:** identify the owner's handset and execute paired USB tests. If unrepresentative, obtain another GPU family when practical; retain desktop smoothness/hover checks.
