# Round 2 — J: JavaScript and startup CPU

Plan only. The only repository output for this assignment is this report. Experiments are in `%TEMP%/perf/scratch/J/`. I read the round-2 brief, all four round-1 reports, the baseline, relevant application/three.js source, and the served production chunk.

**Decisions:** combine J1 with a corrected G2, after G1 removes early PMREM renders if its appearance passes. `compileAsync` already exists in the baseline. Combine J2 and G9 around a compact, deterministic geometry writer; a worker remains useful for responsiveness, but neither a worker nor smaller buffers automatically saves generation time. The asset track leaves essentially the current JS payload and procedural bonsai work intact.

Numbers below are marked **measured**, **assumed**, or **source-verified**. Arithmetic projections are assumed even when their inputs were measured. MB is decimal; MiB is 1,048,576 bytes. Proposed budgets, thresholds and effort are targets/estimates, not measurements.

## Critiques

### A — assets

- **Agree:** A2/A7/A3+A6 dominate cold-load bytes. Keep A9's exact lossless portrait conversion and A10's metadata stripping. Assets should precede small JS package surgery.
- **Overlap:** keep A1/A2 over L1's lossless leaf conversion after the owner's plant comparison passes. Lossless WebP remains the fallback; low risk is not approved. Keep A9/L1 once in the savings totals.
- **Agree with A's G10 correction:** room-lamp is already 1024². Do not budget a 2048²→512² reduction for it. A's measured 41 dB downsample result and the lattice lighting argue against adopting 512². A7 changes encoded bytes, not decoded dimensions; A8 changes both.
- **Interaction with J2:** `bonsai.ts` samples every third BonsaiWood vertex when finding twig attachment points. Welding, reordering or simplifying that mesh can change the generated tree despite an unchanged random seed. After A3, compare the generated bonsai and cuts, not just the GLB silhouette. Preserve or version a stable attachment-point input alongside the packed geometry.
- **A11: disagree with the deployment rationale, retain the provisional winner.** Missing automatic GLB compression does not prevent explicit static precompression and correct delivery. A's rounded compressed geometry comparison suggests about 430 KB extra for meshopt, minus about 50 KB decoder savings: approximately 1.9 s extra transfer at the brief's rate (**assumed arithmetic**). That can exceed the remaining decode benefit after A3–A6. Keep Draco provisionally, but compare the same final geometry, UVs, quality settings, actual response encoding and decoder costs. Raw meshopt is not the right comparison once precompression is allowed.
- **D1/L6:** at about 400 KB of final lightmaps (**assumed scenario in the brief**), their entire ideal transfer is about 2 s. A second low-resolution set spends part of that gain and adds decode/upload, switching and quality complexity. Drop L6 from the initial plan; revisit only if a final-asset experiment demonstrates a substantially earlier, visually acceptable preview.

### L — loading

- **Agree/merge:** L2+L5 and J3 are one dependency graph. Fetch GLB bytes, decoder, lightmaps, portrait and chime alongside engine import. Concurrency does not remove the byte floor. Schedule decode, scene attachment and GPU upload separately so simultaneous responses do not become one large CPU burst.
- **Overlap:** merge J4 into that graph. The earlier, smaller chime will usually be ready before a click; it should not gate room readiness. Preserve gesture-time audio resume, mute state and the existing synthesized fallback. An early `Promise.all` that still waits for audio would retain the dependency.
- **Agree:** L3's exit must work before `createRoom` returns. It needs cancellation/generation tokens, not only `engine?.skipToSite()`. Terminate pending generation and dispose resources that arrive after exit.
- **Choose L4 over my round-1 background-preload policy:** returning visitors reading the page get downloads only by default. Do not build foliage, create WebGL or compile because one idle callback fired. Promote on entry intent. J1's slices still apply after intent and on first entry. Respect Save-Data.
- **Re-rank:** L1's portrait remains excellent; its leaf conversion becomes A2's fallback. L6 and L10 stay out initially. L9 is cache hygiene with no cold-load saving.

### G — GPU/runtime

- **Agree on G1, subject to quality:** removing runtime capture removes work and duplicate no-environment variants. Reduced-resolution 8-bit cubeUV is not automatically equivalent to half-float PMREM. Check color-space handling, clipped highlights and roughness levels on shell/screen/cube close-ups. Exposure compensation cannot recover clipped radiance. Regenerate after any captured-room appearance change, including asset repacking, not only a Blender rebake.
- **Correct G2:** `engine.ts:686` already awaits `renderer.compileAsync(scene, camera)`, confirmed in the served chunk. It runs after `fromScene` at line 630, foliage generation and the chime. Adding that call has **zero incremental benefit**. Ordering, submission batches, CPU overlap and missing-variant warm-up are the actual changes.
- **Do not add G1+G2+G11's round-1 link savings.** My passive capture places about 1.59–1.67 s of shader-related GL calls inside PMREM (**measured**). The later existing async call already yields during its wait. After G1/G11, no standalone G2 seconds are guaranteed.
- **Agree/merge G9 with J2, revise the memory claim:** measured foliage is 360,426 vertices and 20,183,856 bytes. A straightforward 21-byte layout saves 12.61 MB (**assumed arithmetic**); keeping Float32 position/anchor gives a safer 8.29 MB saving with packed normal/color. The larger end of 12–17 MB is unsupported by this layout.
- **G3/G4/G5 are high-value runtime work.** Apply G4 first, then remeasure G3 instead of adding baseline CPU percentages. Full render-on-demand freezes motes, sway and portrait unless their cadence remains or reduced motion is selected. `parallax.lerp(pointer, 0.05)` at line 1048 is frame-dependent: use elapsed-time damping or full-rate settling. `turnTree(spin)` followed by time-based decay also needs review if throttling can occur during coasting. A blind rAF throttle is not a finished scheduler.
- **G7/G8:** fewer draws are worthwhile, but instancing changes cube picking from parent-piece assumptions to `instanceId`. Static merging must exclude movable/focusable parts and preserve thing identity, lightmap UV/group, lantern uniforms and outline selection. G7 changes shader variants too.
- **G10:** keep off-thread ImageBitmap decoding separate from resolution changes. Preserve lightmap orientation/channel and portrait orientation/filtering. Small encoded files can still upload large images. Off-thread decode does not move GL upload off the main thread.
- **G11:** common feature flags can help, but adding clearcoat/maps to unify programs may alter both appearance and per-pixel cost. Check final distinct programs and frame cost as well as startup stalls.

## Experiments (method, result)

### E1 — live foliage inventory through CDP (D4)

T3 preview status/open both explicitly reported no automation host. I used the brief's headless Edge/CDP pattern against `http://localhost:4173/lab/boot`. The sandboxed browser could not answer `Page.enable`; approved command-level escalation let the same probe run. There was no rebuild or alternate server.

`probe.mjs` intercepts only the existing engine chunk through CDP Fetch, adds references to the actual foliage/bonsai/renderer, and reads them after START appears. It passively records actual `bufferData` calls. Viewport/DPR and 4× CPU throttle match the brief. **Network was unthrottled for these CPU/inventory runs**, and GPU was the desktop RX 590. These are not new phone-interactive benchmarks.

**Measured:** `BonsaiShoots` is non-indexed, with 360,426 vertices (120,142 triangles), 910 shoots and 11,339 growth nodes.

| Attribute | Components | Current type | Buffer bytes, measured |
|---|---:|---|---:|
| position | 3 | Float32 | 4,325,112 |
| normal | 3 | Float32 | 4,325,112 |
| color | 3 | Float32 | 4,325,112 |
| shootId | 1 | Float32 | 1,441,704 |
| node | 1 | Float32 | 1,441,704 |
| anchor | 3 | Float32 | 4,325,112 |
| **Total** | **14** | **56 bytes/vertex** | **20,183,856 (19.25 MiB)** |

The upload log independently contains exactly four 4,325,112-byte uploads and two 1,441,704-byte uploads. Total observed buffer upload payload is 34,421,264 bytes (**measured**); foliage is about 59% (**assumed arithmetic**). These are array/upload payloads, not driver-allocated VRAM or total heap measurements. Growing JS number arrays, metadata and temporary vectors add generation memory; packing only after those arrays exist does not remove that peak.

**Measured ranges:** shootId 0–909, node 0–20. Uint16 and Uint8 preserve them exactly; use `normalized=false` with ordinary float shader inputs. The following are **assumed layout arithmetic**, not implemented variants:

| Layout | Bytes/vertex | Foliage bytes | Saving |
|---|---:|---:|---:|
| Integer IDs only; everything else unchanged | 51 | 18,381,726 | 1,802,130 |
| Above + SNORM8 normal + UNORM8 linear color; Float32 position/anchor | 33 | 11,894,058 | 8,289,798 |
| Above + bounded UNORM16 position/anchor | 21 | 7,568,946 | 12,614,910 |

Round-tripping the real arrays gave maximum SNORM8 normal angular error 0.3734 degrees and maximum UNORM8 linear-color error 0.001960783 (**measured**). Neither establishes invisibility, especially for dark greens. Keep color precision if the comparison fails. Position/anchor quantization requires bounds and shader reconstruction; it is a later, higher-risk step.

**Clump trap:** `clump()` currently slices position/normal/color and constructs new attributes without retaining `normalized`. Packed normals/colors would render incorrectly unless that is fixed. Quantized positions must be decoded to Float32 before the clump's `applyMatrix4`, bounds and translation. Growth interpolation, sway's position-based phase/height, ray tests and bounds must also use reconstructed coordinates. A foliage-only screenshot pass is insufficient.

### E2 — passive startup and compile measurements (D3)

The old `gl.mjs` calls `getProgramParameter(LINK_STATUS)` immediately after every `linkProgram`. That forces completion and changes parallelism. Its cost ranking is useful; it is not a clean async-compilation A/B. The separate original trace remains evidence of a real startup stall.

My wrapper adds no GL status queries. It times existing link/diagnostic/reflection calls and separates synchronous submission from the `compileAsync` promise. The first inventory probe omitted shader-info-log timings; the following two baselines include them.

| Stage | Baseline run 2, measured ms | Baseline run 3, measured ms |
|---|---:|---:|
| createBonsai, inclusive | 1,229.1 | 1,131.0 |
| PMREM fromScene, inclusive | 4,072.6 | 3,886.1 |
| Shader-related GL calls within PMREM | 1,669.6 | 1,590.3 |
| compileAsync synchronous submission | 161.4 | 217.0 |
| compileAsync total wall duration, including submission | 433.7 | 475.3 |
| Largest observed main-thread task | 5,790 | 5,457 |

The first inventory run measured bonsai at 1,095.8 ms and the async call at 467.9 ms. Timings vary and include instrumentation overhead. The fully instrumented baselines each recorded 33 links. Most observed shader waiting was charged to `getProgramInfoLog`, not the `linkProgram` JS call. Disabling diagnostics can move required synchronization to reflection/use; it is not the proposed fix.

**D3 resolution: combine with this staged createRoom design.**

1. **Acquire:** start assets before engine import completes. Returning-page work stops at downloads until intent. Use one initialization promise, abort/generation state and a resource-disposal ledger.
2. **Decode/generate:** retain Draco's worker path. Start a dedicated foliage job once stable wood/transform inputs exist. Decode maps/portrait off-thread where supported, with bounded concurrency.
3. **Assemble in slices:** create renderer once; establish final material substitutions, lights, tone mapping and approved prefiltered environment. Set texture/geometry flags and shader hooks before compilation. Traverse/build in resumable batches. Use `scheduler.yield()` with a task-based fallback; `Promise.resolve()` only yields a microtask. A 5–10 ms JS budget is an **assumed target**, not a way to interrupt a native GL call.
4. **Submit stable groups:** sequentially submit small `compileAsync(subtreeOrRepresentative, camera, finalScene)` calls, yielding between groups. The third argument supplies the real scene lighting/environment without reparenting meshes. Initial `compile()` is synchronous, as the measured 161–217 ms submissions show. Keep program-affecting state fixed while promises are pending: this version's readiness loop reads each material's `currentProgram`.
5. **Overlap independent work:** finish picking metadata and other sliced CPU tasks while shader promises wait. Attach returned worker geometry and compile its final bonsai group. Do not render unready groups or mutate lights/env/feature flags mid-compile. For different variants of a shared material use stable representatives/clones with custom hooks/cache keys retained, rather than flipping one material while promises reference it.
6. **Warm actual interaction variants:** mapped boot screen, radio-on materials, cut clumps, mask/occluder and outline pass, and final instanced forms if G7 lands. Compiling the scene does not visit an unattached clump or later map toggle. This version's compile traversal does not substitute `scene.overrideMaterial`; use explicit representatives with the actual mask materials. Offscreen warm-up must match eventual output-color-space/render-target settings.
7. **Upload/present:** compiling does not upload all textures/buffers. Initialize textures in bounded tasks; distribute necessary geometry warm-up draws behind the loading layer after compiler readiness. Render the complete final frame, publish the Room and expose START. Check cancellation after every await and dispose late worker/assets on exit.

Without the extension, this three version's `isReady()` considers programs ready immediately; `compileAsync` waits a timer and first use can still stall. Use staged warm-up draws/checks and cheaper/fewer programs. There is no promise-only fallback that makes a native link interruptible. If G1 is rejected, current `fromScene` remains a substantial indivisible operation: J1 alone cannot promise to eliminate the longest task.

**G2 after G1/G11:** adding the call saves nothing because it exists. Scheduling/prewarming still matters, but the final combined variant was not measured. Do not count all inclusive PMREM time as removed: some uploads migrate to first use. G11 can shorten an async wait rather than a blocking task. Withdraw a guaranteed 0.8–1.2 s standalone G2 saving; budget **0 s guaranteed and unmeasured incremental wall benefit**.

**Android extension availability:** treat support as optional on both Adreno and Mali. Chromium exposes it only when the context advertises it ([Blink source](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/modules/webgl/khr_parallel_shader_compile.cc)). ANGLE's GL backend checks native compiler-thread entry points and a feature gate ([GL capability code](https://raw.githubusercontent.com/google/angle/main/src/libANGLE/renderer/gl/renderergl_utils.cpp)); Vulkan gates it on `enableParallelCompileAndLink` ([Vulkan capability code](https://raw.githubusercontent.com/google/angle/main/src/libANGLE/renderer/vulkan/vk_caps_utils.cpp)). That establishes conditional implementation support, not shipping-device prevalence.

ANGLE's current table has blank cells for this extension in its sampled Pixel 4/Adreno 640 and Pixel 6/Mali-G78 Vulkan configurations. Those samples are old, not current Chrome runtime tests ([table/configuration notes](https://github.com/google/angle/blob/main/doc/ExtensionSupport.md)). I cannot substantiate “present on typical Android Chrome” from this evidence. RX 590 returned true here (**measured**, not Android). Feature-detect on the owner's device. The extension guarantees a nonblocking completion query, not reduced total compilation time ([Khronos specification](https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/)).

### E3 — bonsai hot loop; worker versus attributes (D4)

A CDP-only variant hoisted the node normal transform/normalization and anchor transform out of the per-vertex writer, and removed the redundant clone of its temporary position argument. It measured 1,206.0 ms versus baseline 1,095.8 / 1,229.1 / 1,131.0 ms (**measured**, 4× CPU). All six attribute counts and buffer hashes matched the hashed baseline. That supports preserved geometry; it is neither screenshot approval nor collision-proof equality.

**No demonstrated speedup:** the variant falls within baseline variation. Withdraw my round-1 200–400 ms real-CPU saving. Retain the simplification only as part of a cleaner writer if broader measurements justify it.

**Order:** define the compact buffer/metadata contract; write typed arrays directly; move that same pure generator to a worker if it still blocks materially. Integer IDs are exact, normal/color packing needs owner comparison, coordinate quantization is optional later work. Do not build huge number arrays and then clone them into a worker. Transfer final ArrayBuffers and shoot-node/range metadata; reconstruct only the small runtime object layer on main. Copy needed model inputs rather than detaching buffers still used by live geometry.

The worker must not import `engine.ts`, a renderer or the monolithic scene-construction function. Use minimal generation/math dependencies to avoid another renderer-bearing bundle. Preserve seed, shoot order, saved-growth indexing and clump triangle ranges. Apply saved lengths/elapsed growth on main after the result arrives. Terminate on cancellation; late replies cannot resurrect an exited room.

A worker can move roughly the measured 1.1 s baseline generator off main (**assumed upper opportunity before refactoring overhead**), but total CPU remains and readiness needs the result. After optimizing the writer, do not add the entire baseline amount again. G9 reduces retained arrays/upload payload/vertex-fetch traffic; it does not eliminate arithmetic or vertex count. Combine the mechanisms; do not sum their full baseline claims.

### E4 — JS after the asset track (D7)

`bundle.mjs` re-read the baseline network log and compressed the unchanged production chunk in memory. **Measured:**

- Main chunk: 777,644 raw bytes; gzip level 9 211,073 bytes; Brotli quality 11 175,823 bytes. Actual preview response: 212,241 bytes including response overhead.
- All Script-classified requests before readiness: 267,081 transferred bytes. Draco wrapper is a separate Fetch of 12,012 bytes; preview WASM is another 192,639 bytes uncompressed. Do not omit them because the request type is Fetch.
- Original trace `v8.compileModule` events total 7.299 ms, including 3.454 ms for the streamed main chunk. These are partial categories, **not** all parsing/evaluation CPU. Summed `EvaluateScript` time of 559.938 ms includes CDP polls and workers, so is not a bundle-evaluation estimate.

**Assumed arithmetic:** main-chunk transfer alone needs about 1.06 s gzip or 0.88 s Brotli at 1.6 Mbps before request latency. All current Script responses consume about 1.34 s of aggregate throughput. A1–A10 remove none of that JS, its initialization, procedural foliage, runtime PMREM or idle loop. Script transfers are about 12% of A's approximately 2.25 MB final budget; JS plus production-compressed Draco roughly 14–15%, subject to actual CDN encoding. Do not add those times to the whole-site transfer floor again.

The renderer/core remains needed. Removing the app's `PMREMGenerator` import does not guarantee its code disappears: WebGLRenderer has internal environment-handling dependencies. Inspect the final bundle. A worker can move or duplicate code without reducing cold bytes.

J8 remains an **assumed 6–8 KiB gzip** opportunity; selective J7 another **assumed 3–8 KiB**. Together that is only about 0.05–0.08 s ideal transfer, possibly outweighed by a deferred-request/first-action hitch. J9's unused decoder copy has **zero measured transfer**. J11 concerns `/`, not this route. After asset work, execution and responsiveness deserve more attention than tiny package substitutions.

**Planning envelope, not measured outcomes:**

| Work landed | Assumed phone room-ready range | Basis/limits |
|---|---:|---|
| Assets only | 19–22 s | A's approximately 2.25 MB implies 11.25 s transfer floor; serial dependencies and much CPU/compile remain, with some decode reduction. |
| Assets + loading graph | 16–19 s | Roughly 2–3 s of avoidable discovery/serial waiting can disappear; downloads share bandwidth. |
| All accepted startup work | 13–16 s | Final bytes including env/worker assumed approximately 2.1–2.4 MB: 10.5–12 s floor, plus remaining discovery/decode/upload/assembly. Requires G1 approval and useful overlap; not a real-Android prediction. |

Use the high end until final environment bytes and a combined trace exist. A 400 KB lightmap result lowers A's WebP case by about 0.9 s ideal transfer (**assumed**); count it once. G3/G4/G5 improve running cost, not another readiness subtraction. Yielding and a worker may make waiting responsive without making readiness earlier. Single-digit all-track seconds are inconsistent with this byte/bandwidth budget.

## Revised ranked list

These are J's priorities; A's approved byte reductions and G's idle/runtime work remain panel-level priorities alongside them.

1. **Early asset graph: J3/J4 + L2/L5.** Savings: **assumed 1–3 s after assets**, shared with L, chime/portrait counted once; no inherent byte reduction. Risk: medium, lifetime/request competition/first-click audio. Effort: **assumed 1–2 days**. Re-bake: **no**. Verify final encoded waterfall, earlier GLB/decoder, no serial lightmap groups, immediate START click with audio/mute/radio, exit/cancellation and decode bursts.
2. **Interruptible creation + correctly ordered compile: J1 + corrected G2, with G1/G11.** Savings: **0 guaranteed CPU/byte saving from yielding**; responsiveness opportunity against **measured 5.3–5.8 s tasks**, no duplicate G2 seconds. Risk: medium/high, cancellation and shader coverage. Effort: **assumed 2–4 days**. Re-bake: **no** for scheduling; G1 needs its separately generated environment. Verify traces, responsive exit, first hover/cut/boot/radio, dive/return/context loss, downloads-only returning-page policy and extension-absent fallback.
3. **Compact foliage generator contract: G9 + J2.** Savings: **assumed 1.80 MB** from exact IDs, **8.29 MB** with approved normal/color packing, **12.61 MB** only with later coordinate quantization. Worker opportunity starts from **measured 1.10–1.23 s**; post-refactor/wall gain unmeasured. Risk: medium/high, clumps/packing/saved-state/worker lifecycle. Effort: **assumed 2–4 days**, more for coordinate quantization. Re-bake: **no**. Verify counts/hashes for exact changes, actual uploads, generation/transfer/attachment timings, worker bundle, trim/water/regrow/turntable and owner comparisons.
4. **Stable precomputed picking hulls: J5 + A12.** Savings: **assumed up to 150–210 ms** from round-1 CPU evidence; likely smaller after geometry changes, not newly measured. Code-byte saving unmeasured. Risk: medium, generated canopy and export transforms. Effort: **assumed 1 day**. Re-bake: **no**; regenerate from final packed geometry and stable bonsai inputs. Verify every object's pick results, pot/canopy gap, floating hover, portrait focus and cube placement. A small sliced hull job remains a fallback if the offline contract is awkward.
5. **Narrow bundle cleanup after remeasurement: J8 + selective J7.** Savings: **assumed 6–8 KiB gzip**, potentially another **3–8 KiB** of initial controllers; no final-build delta measured. Risk: low/medium, fades and first-action latency. Effort: **assumed 0.5–1 day**. Re-bake: **no**. Verify identical fades/dive/return, compressed bytes and no mini-game first-action hitch. Visible objects/startup templates remain eager.

Dropped/merged: J4 is no longer separate; J6 is a benchmark decision, not a codec migration; J9 is build hygiene; J10 follows L4; J11 is another route; J12 has no established benefit. The earlier J2 loop-hoist CPU estimate is withdrawn.

## Open disputes for round 3

1. **D3 combined measurement:** G should provide G1+G11 with final materials, separating submission, completion wait, first-use diagnostics and uploads. Passive instrumentation only—no forced LINK_STATUS after links. J1+G2 is the chosen design; its final budgets remain unvalidated.
2. **D3/D8 Android:** conditional support is established; typical enabled Adreno/Mali prevalence is not. Cheapest credible next check is the owner's Android over USB, Chrome remote debugging and preview port forwarding ([official debugging](https://developer.chrome.com/docs/devtools/remote-debugging/), [local-server forwarding](https://developer.chrome.com/docs/devtools/remote-debugging/local-server)). Record device/Chrome/GPU/extension, long tasks, real frames and temperature state. Do not add 4× CPU throttle on the real phone. Test cold/repeat entry, first hover/cut/boot and idle/active play. One phone is a credible check, not both-GPU-family coverage. No phone was attached in this round.
3. **D4 layout/worker gate:** exact IDs can proceed in the implementation plan. Owner comparisons decide normal/color packing. Defer coordinate quantization until clumps/sway decode correctly. Measure the optimized writer before committing to worker complexity; no measured worker wall-time or energy saving is claimed.
4. **D1/D2 quality:** A's lantern-extreme/portrait-focus and G's environment comparisons determine the accepted budget. PSNR and the compile argument do not approve appearance.
5. **D6/D7 accounting:** obtain one final-geometry codec comparison including static compression/decoder cost, plus a production-encoding waterfall. Retain Draco and the ranges above meanwhile. L should remove duplicate audio/discovery credits; G should remove overlapping compile credits and remeasure idle savings after trail/ring fixes.

Evidence: `probe.mjs`, `baseline-4.json`, `baseline2-4.json`, `baseline3-4.json`, `hoist-4.json`, `summary.json`, `bundle.mjs`, `bundle.json`, `sources.mjs`, `more.mjs`, all in `%TEMP%/perf/scratch/J/`. The loop experiment existed only in an intercepted response, not in repository code or other browser sessions.

