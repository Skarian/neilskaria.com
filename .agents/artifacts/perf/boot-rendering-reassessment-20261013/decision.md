Decision brief: boot rendering reassessment, 13 October 2026

**Advance one clean, atlas-only experiment against the exact original. Do not advance the context hint as a universal fix.** The atlas now has a proportionate purpose: remove repeated boot painting and texture uploads without the hint's demonstrated CPU penalty. This recommendation permits an experiment, not production acceptance.

This research used GPT-6 Astra with extra-high reasoning. It follows .agents/models.md and the STE100 plain-report skill. No browser, build, test, raw-trace analysis, implementation, or deployment occurred.

**Why the decision changes.**

The affected Android comparison supports both alternatives. Original first/replay means were 33.905/32.682 ms. Hint means were 16.683/16.685 ms. Atlas means were 16.688/16.686 ms. The user reported similar smoothness for hint and atlas, with consistent atlas text. Atlas callback totals were about 6.2–6.7 ms lower than hint. These are callback measurements, not GPU execution or physical presentation measurements. [Affected-device evidence](../affected-three-mode-analysis-20261013/findings.md)

The clean Windows native pairs change the tradeoff. Both canvas variants scheduled text near 16.7 ms, but hint renderer-thread CPU was about 2.0–2.5 times original. Corrected task bounds preserve that difference. Under matched CPU4 stress, original first/replay means were 17.70/17.31 ms, versus hint 24.10/22.87 ms. Counts of gaps at least 25 ms rose from 11/7 to 54/50. The stress comparison has one pair, but both complete boots show lost frame margin. CPU4 is desktop stress, not Android emulation. [Native review](../clean-canvas-trace-review-20261013/review.md), [repaired stress evidence](../clean-canvas-stress-trace-repair-20261013/findings.md)

The hint changes a costly path. It does not remove that path. The atlas removes the repeated boot raster/upload work, including powered solid returns. Its larger source diff can therefore be justified. Neither result proves an exclusive raster, driver, compositor, or GPU cause.

The atlas still has material costs:

- The 2048×1024 PNG contains 37,034 bytes. Its nominal RGBA8 mip chain is 10.67 MiB, versus 3.125 MiB for the original texture.
- The corrected loader retains its ImageBitmap until atlas disposal. Bitmap plus mip-chain estimates total 18.67 MiB. These estimates exclude copies and driver overhead. They are not measured allocation.
- The shader attempts up to eleven mask lookups: ten letters plus the domain. Opacity and bounds checks skip some texture samples. GPU cost remains unmeasured.
- The affected capture showed create-to-ready of 1842.6 ms, versus 1257.5 ms for hint and 1107.7 ms for original. The +585.1/+734.9 ms differences remain warnings.
- Atlas decoding took 140 ms. A 362 ms long task overlapped assets-to-compile-wait. That interval lasted 404.6 ms, versus about 90.5 ms for canvas. The actual compile-promise wait was only 0.8 ms.
- Atlas loaded uncached resources into an initial room. Canvas sessions reused assets and began at the site. These observations do not isolate shader or asset costs. Atlas readiness also preceded the asset boundary, so decode duration cannot simply be added to startup.

The observed delay prevents startup acceptance. Unequal initial states prevent rejection based on that delay alone. A clean comparison must resolve this. The atlas does not fix lantern or radio stalls.

**Actual code and the clean experiment.**

The corrected source is in [prototype/source-stage](../gpu-boot-atlas-prototype-20261012/source-stage/), not a separate correction/source-stage directory. The [correction manifest](../gpu-boot-atlas-failure-correction-20261012/source-manifest.json) points there. I checked its engine, atlas-module, and PNG hashes against the files. All three match.

Compare with [the exact original stage](../clean-canvas-automated-profile-20261013/original/source/), commit a796e9aea60def6e0849cb75a151fd6570942339. That original already includes the approved camera state. Do not use d82230a, the rejected prepared-panel/cache work, or bcc409e as the baseline.

The source inspection supports this narrow port:

1. Start from the original 91-file allowlist. Change engine.ts and add boot-atlas.ts, boot-atlas-metrics.json, and the existing PNG. Expected allowlist: 94 files.
2. Create one atlas unconditionally. Assign its ShaderMaterial to the existing screen mesh. Preserve geometry, UVs, render count, camera, audio, and animation timelines.
3. Replace boot canvas creation, painting, dirty flags, power switching, and solid-return filling with the atlas prepare/power calls. Preserve BOOT_DURATION from boot-screen.ts. Remove the drawBootScreen import.
4. Remove all context selectors and canvas branches. Do not copy diagnostic.ts, context-control.ts, recorder UI, query controls, or diagnostic globals.
5. Remove diagnostic imports, mark calls, texture counters, submitted(), and the diagnostic screen.onAfterRender callback. Remove the onUpdate callback if it only records submissions.
6. Retain the immediate rejection observer on ready. Its removal would restore the early unhandled-rejection defect. Keep ready itself rejecting at the existing asset boundary.
7. Retain AbortController, idempotent disposal, late-decoded-bitmap closure, and the corrected asset-failure cleanup. Adapt cleanup references after removing unused canvas resources.
8. Keep the existing parallel loading, compilation, font wait, and warm-draw sequence. Remove only the obsolete canvas-screen material and its extra lit-screen compilation. Add no warm draw, delay, or deferred first-use work.

The corrected atlas module is 197 lines before diagnostic removal. The original drawing module has comparable drawing logic. This replaces a drawing implementation, but also requires the roughly 60-line failure path. A proposal that omits that path is smaller but incomplete.

Essential runtime data are mask bounds, regions, scales, letter slots, domain metrics, and atlas dimensions. Keep the existing asset and metrics for this experiment. Preserve the generator and font provenance as authoring evidence outside the runtime allowlist. No runtime font measurement or AI image generation belongs in this path.

In [boot-atlas.ts](../gpu-boot-atlas-prototype-20261012/source-stage/src/lib/boot/boot-atlas.ts), lines 61–83 retain explicit texture gradients before clipping. Lines 98–120 own loading and rejection. Lines 178–185 close the bitmap during disposal. Do not remove mipmaps or replace them with linear-only filtering. Previous attempts produced seams or jagged edges.

The corrected engine cleanup handles failure at its asset boundary. Earlier initialization failure and loading-time route cancellation remain inherited limitations. A prerequisite that never settles can delay cleanup. Do not describe this port as a general lifecycle repair. [Correction evidence](../gpu-boot-atlas-failure-correction-20261012/README.md)

**Minimum autonomous screen: at most four measured app sessions.**

Wait until the lantern worker releases the browser and CPU. Run browsers sequentially. Keep the exact browser, renderer backend, viewport, DPR, storage seed, delivery configuration, and observer code matched. Use the established Chrome154/RX590/Vulkan configuration for continuity. Record actual command lines and successful throttle commands.

Use two variants only: O, exact original, and A, clean atlas. Each session must complete trusted START, site, BACK, powered return, and a second full START. Reuse the established room-first storage seed. Click as soon as the unchanged START introduction completes. Do not wait for an extra asset, timer, idle period, or hidden warmup.

1. O at CPU1, with a fresh owned profile and cold browser resource cache.
2. A at CPU1, with a separate fresh profile and the same cold-cache policy.
3. A at CPU4, with a fresh browser/renderer using session 2's disk profile.
4. O at CPU4, with a fresh browser/renderer using session 1's disk profile.

The measured native sessions supply the warmed disk profiles. No separate warmup session is needed. Record actual cache hits. OS and driver caches remain uncontrolled.

This supplies native cold startup and warmed CPU4 startup, plus first/replay cadence at each CPU level. Variant order reverses between levels. It is not within-level counterbalancing, and it does not independently separate CPU level from cache state. Four sessions cannot establish population variance or startup neutrality.

Stop after a decisive failure. Do not automatically add reverse pairs. If order or small differences prevent a decision, report inconclusive. A later reverse pair must address that specific uncertainty, not start another matrix. This four-session cap is a screening limit, not a statistical acceptance claim.

Use the repaired external CDP harness. Capture no screenshots, video, pixel reads, or serialized results during timed phases. Require trace completion, stream EOF, loss=false, and valid clock alignment. Bound event storage. Do not add synchronous GL queries or debugger pauses. Observer overhead can differ by render path. If it obscures the difference, report inconclusive.

Replace the canvas-only phase detector for atlas. Observe existing uniform-location lookups and uniform writes. Mark the first screen draw with powered=true and first-letter alpha>0. Use a lightweight original N-paint marker for O. Keep the hook installed identically in both variants. Do not issue new reflection queries. If matching fails, do not fabricate atlas glyph timestamps or compare unequal windows.

Measure these decision fields:

- **Startup:** navigation and document responseEnd to START DOM and introduction completion. Also record trusted click to first active screen draw and site completion. Keep raw and response-normalized values.
- **Startup work:** resource URL/hash, encoded bytes, decoded bytes, cache status, response failures, and loading overlap. Capture atlas fetch/decode, first upload/mipmap calls, program-link service spans, first-use waits, renderer CPU, and longest task.
- **Attribution:** map shader source hashes and program IDs through existing API calls. Separate link-service duration, API wall time, thread CPU, and overlapping decode. Do not assign unobserved time to shaders.
- **Cadence:** use the same 3150 ms text window after the first-letter event. Report interval count, mean, p95, maximum, and the existing descriptive gap counts. Measure powered return, camera prefix, fade, and handoff separately.
- **CPU and uploads:** require zero recurring boot texture updates after initial atlas upload. Attribute other uploads separately. Compare renderer task CPU with coverage and boundary bounds. Keep statistical sample time separate from CPU duration.
- **Memory and bytes:** inventory actual texture dimensions, internal format, mip levels, bitmap lifetime, and emitted JS/asset transfer changes. Check disposal without observer-owned strong references. Heap size and texture count do not measure VRAM.

First-use upload and link costs count wherever they occur. An apparently fast START fails if it moves the missing work into activation. The existing compilation/warm draws do not authorize additional preparation.

Use matched delivery with the existing compressed assets. Do not repeat the old local compressed-model 404/raw fallback as a hosted-startup result. Network timing explains these sessions only. No additional network matrix is necessary. If link or memory measurements are unavailable, preserve that uncertainty.

**Conditions that can reject the candidate.**

Reject the clean port for any altered audio/camera/font timing, additional startup wait, hidden fallback, repeated boot upload, readiness failure, or cleanup regression. Recheck immediate HTTP/network/decode failures and disposal during pending decode in bounded lifecycle probes before browser timing. Those probes are future implementation validation, not work performed here.

Reject performance advancement if native cadence worsens systematically, CPU4 retains the hint-like repeated gaps, or first-use stalls migrate to START, return, or handoff. Also reject an attributable startup penalty, even if loaded text improves. A repeated delay near the observed half-second warning would contradict the user's stated goal. Do not convert that warning into a universal numeric threshold.

Require native cadence to remain comparable to the matched original. Require lower text CPU/upload cost and no material CPU4 cadence loss relative to original. If original misses intervals, atlas should reduce those losses to justify its costs. Use the distributions and aligned work evidence. A lone maximum or a one-frame difference cannot establish a regression.

A clean result can justify advancing this preview candidate. It cannot prove universal reliability or resolve actual GPU execution cost. A headless compositor supplies virtual presentation feedback only. Keep the physical Android positive evidence separate, including its existing user report. Request no new user files or manual matrix.

Exact visual identity is already unproven. Existing 45 comparisons reached whole-image RGB mean difference 0.585/255, but edge-channel difference reached 250. Settled word bounds differed by one pixel. Font fallback on Android remains unknown. Those results are not acceptance tolerances. [Visual review](../gpu-boot-atlas-review-20261012/review.md)

Require unchanged mask bytes, metrics, shader, and preparation arithmetic in the clean port. Retain the previous fixed-time comparisons. After timing, use the same owned browser for focused fixed-time fidelity checks. Compare original and cleaned atlas at arrival, overlap, settled text, glint, fade, powered-off, and solid-return states. Compare edge detail and clipping, not only whole-image averages. Screenshots at equal wall delays do not establish equal animation time. If the harness cannot control time, report that limitation. Do not request another user test.

**One conditional asset adjustment, only if memory or asset work blocks acceptance.**

The shader reads only atlas alpha. If the PNG candidate fails on texture/bitmap storage or decode/upload cost, consider the same masks as one immutable R8 data asset. Keep 2048×1024 dimensions, every alpha byte, gutters, layout, and explicit-gradient mip sampling. Change the sampled component from .a to .r.

Extract the alpha bytes offline. Fetch a compressed static byte asset into a Uint8Array/DataTexture. Preserve LinearMipmapLinearFilter, LinearFilter, generateMipmaps=true, and NoColorSpace explicitly. Validate the byte length. Keep immediate rejection ownership, abort/disposal handling, and the existing readiness boundary. Do not decode a PNG and extract alpha through canvas at startup.

Installed Three 0.186.1 maps RED plus UNSIGNED_BYTE to R8. Its DataTexture path uploads typed data and can generate mipmaps. DataTexture defaults require explicit filter/mipmap overrides. [Three DataTexture documentation](https://threejs.org/docs/pages/DataTexture.html), [WebGL2 format specification](https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE)

Nominal R8 storage is 2 MiB base, 2.67 MiB with mips, plus a retained 2 MiB source buffer. That replaces the 18.67 MiB RGBA/bitmap estimate with about 4.67 MiB. Actual allocation and sampling speed still need measurement. Validate compressed transfer size and Content-Encoding before any timed comparison. If existing delivery cannot serve it compactly, stop rather than add a runtime decompressor or new service.

This adjustment removes unused channels without reducing glyph resolution. Equal base alpha bytes do not prove equal mip generation. Repeat the edge and fade checks after any representation change. It does not reduce eleven-mask shader arithmetic or cure a proven shader-link stall. Preserve the PNG candidate for attribution. Do not implement R8 in the first experiment or run a third simultaneous renderer.

Do not close the current bitmap at onUpdate as an undocumented shortcut. Three calls onUpdate after upload submission, not measured hardware completion. Closing detaches bitmap data, leaving no source for a later reupload. [Three Texture documentation](https://threejs.org/docs/pages/Texture.html#onUpdate), [HTML ImageBitmap close specification](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#dom-imagebitmap-close)

The execution recommendation remains one clean port of the corrected PNG atlas, followed by the bounded screen above. Keep lantern/radio work separate. Keep UA/GPU selectors, runtime benchmarks, cached glyph preparation, prepared panels, and new video/worker architectures outside this experiment.
