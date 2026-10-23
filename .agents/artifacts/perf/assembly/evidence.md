# Evidence supporting the assembly plan

10 October 2026. Read-only inspection of `redesign`, HEAD `5a9cf09`; an in-memory geometry/compression experiment. No application edits, builds, Blender runs, installs, servers, commits or deployments. Existing unrelated untracked files were left alone.

## Current code

- `engine.ts:126` immediately constructs WebGLRenderer. The large continuation begins around 257; bonsai at 418, hulls around 645, all-images gate at 698, graphics preparation at 756–778. Existing `breathe()` provides real task yields only at selected boundaries.
- `engine.ts:847` overwrites object transforms each frame in `pose()`. Compose landing offsets there or in dedicated parent groups; competing GSAP position tweens will be overwritten. Capture final rest transforms before animation; compute bounds/hulls/framing in rest space.
- `engine.ts:1307` identifies objects by names/ancestry. Several objects are many root-level parts. Separate assets need stable roots, optional controllers and readiness-aware picking, not merely multiple loaders.
- Disposal around `engine.ts:2112` assumes initialization completed. Route exit during `await createRoom()` can miss the eventual engine. Add a lifecycle token/abort signal from the start, reject stale results and clean up exactly once. SKIP means continue background preparation at lower priority; navigation away means cancel.
- `BootIntro.svelte:194–235` fetches/imports then awaits the engine. SKIP works after hydration. Initial phase is `page`, so the conditional SKIP button is absent from server HTML even when the head script displays the room layer. An initial fallback/early event path must retain click intent through hydration, handle storage errors and avoid reopening the room.
- Returning visits preload during idle except reduced motion/precious data. Preserve full background preparation. Reduced motion already bypasses automatic entry. First-visit Save-Data is not equivalent today: any choice to suppress its automatic room download must be explicit and retain a way to request the room.
- `fetches.ts` memoizes one set of promises, gates image/audio requests behind model completion, has no AbortSignal and no retry reset. Its percentage compares decoded stream bytes with potentially compressed Content-Length. Use consistent manifest-based progress or honest stage text, and distinguish download completion from ready-to-use.
- `sound.ts:4` constructs AudioContext before awaiting the chime. Deferral can move the same pause onto the first tap; verify immediate feedback, gesture activation and earliest sound rather than hiding the cost.
- `scripts/precompress.mjs` only matches `bedroom.<hash>.glb`. New groups need corresponding Brotli siblings/headers. Local preview's mis-served `.br` fallback is already documented in the fresh profile; use deployed encoding for network claims.
- Version discrepancy: this checkout declares SvelteKit `^3.0.0`, Svelte `^5.57.1`, Three `^0.186.1`; the brief says SvelteKit 2. Check installed lockfile versions when implementing; do not add a framework migration.

## Export and lighting

Direct GLB JSON inspection: **1,183,392 bytes uncompressed; 97 nodes, 96 meshes, 103 primitives, 53 materials, 15 embedded images**. These are model counts, not runtime draw calls. Mesh nodes by lightmap tag: live 43; props 20; plant 1; bed 8; room 21; wall 3. Six interactive identities: SP, cube, clock, lantern, bonsai, wall portrait. The floor plant is separate from the bonsai.

`build_scene.py:292–348` groups the nightstand, clock and baked bonsai/lantern parts under props. The separate floor plant uses plant; the portrait uses wall. Lines 324–346 build a bake-only bonsai shadow proxy from `assets/3d/bonsai-foliage.json`. This 387 KB file is **not** the complete interactive buffers. The Game Boy is hidden from the bake at 678–680 and has a runtime soft shadow (`engine.ts:681`).

The bake includes direct and indirect diffuse lighting, excludes surface colour, and writes sun/sky and lamp layers. Each map has its own brightness scale. Selecting a receiver group does not remove other objects as blockers or bounce contributors; exporting an object separately is different from baking it in isolation.

At `build_scene.py:682–693`, a second UV layer named Lightmap is packed across each group. Export retains the `lightmap` extra and both coordinate sets. glTF calls this `TEXCOORD_1`; Three r186 calls it `uv1`, selected by `Texture.channel = 1` in `baked-material.ts`. It is often called “UV2” informally; do not create an attribute named `uv2` by mistake. `pack.mjs` removes unused first coordinates, not required lightmap coordinates.

Split at packing time while preserving coordinates, extras, names and world transforms. Share atlas URLs and explicitly avoid embedded-albedo duplication. Revalidate roots after Draco; splitting changes compression bounds and parsing task sizes. Hull/bounds data must use correct rest transforms; bonsai has two hulls. Existing global startup assumptions must become per-object readiness contracts, including camera framing and state restoration.

For temporary empty-room lighting, freeze the source geometry/UV layout before hiding objects. Do not rerun UV packing on smaller groups. Keep today's final maps. Temporary maps need their own normalization scales or encoding into final scales. Blend **linear lighting contributions**, separately for day/lamp, before tone mapping; apply the saved lantern tint to both lamp states. Preserve glass/emissive paper treatment. Soft dark decals cannot reproduce overlapping shadows and bounced colour exactly.

The cheap temporary-to-final bridge is an approximation during assembly. Review intermediate frames and fall back to a grouped reveal if needed. Extra maps cost sampler slots, shader preparation, memory and disposal. Current precomputed reflections may show an object before it lands; inspect that too. Re-capture the environment if the final scene changes, not automatically for a temporary reveal.

## Bonsai size experiment

This was isolated in-memory inspection, not an asset build or browser timing benchmark. Node decoded today's GLB through installed glTF-Transform/Draco. A minimal Three hierarchy retained bonsai node world transforms and position geometry. Node TypeScript stripping loaded today's `bonsai.ts` from a data URL with today's frozen roots. `createBonsai()` ran without loading/saving localStorage. Final arrays were compressed with Node Brotli quality 9. Shoot records and growth pace were serialized as JSON for a conservative metadata estimate. No mesh file was written.

| Data | Raw bytes | Brotli bytes, separate streams |
| --- | ---: | ---: |
| Foliage positions, Float32 | 4,325,112 | 3,447,364 |
| Normals, normalized Int8 | 1,081,278 | 42,403 |
| Linear colours, Float32 | 4,325,112 | 69,112 |
| Shoot IDs, Uint16 | 720,852 | 2,230 |
| Node IDs, Uint8 | 360,426 | 2,802 |
| Anchors, Float32 | 4,325,112 | 127,673 |
| Twig positions, Float32 | 124,416 | 29,914 |
| Twig normals, Float32 | 124,416 | 30,729 |
| Shoot metadata and pace, JSON | 1,022,809 | 373,715 |

**Concatenated:** 16,409,533 bytes raw; **4,122,544 bytes Brotli**. Separately compressed totals differ slightly. Counts: **910 shoots, 11,339 nodes, 360,426 foliage vertices, 10,368 twig vertices**. Today's foliage is 42 bytes/vertex, not the earlier proposal's 33: colours remain Float32. All geometry attributes total 15,386,724 bytes before metadata.

Budget roughly **3.8–4.2 MB** for a straightforward lossless packed-buffer design with improved metadata, pending actual format validation. This estimate is anchored by the 4.12 MB experiment; it is not a universal compression lower bound. Positions alone consume about 3.45 MB compressed here. At 200,000 bytes/s, the trial takes 20.6 s of transfer before latency/decode. Quantization, geometry compression or a procedural recipe could be smaller but require their own appearance/decode/triangle-order checks; do not book hypothetical savings.

A worker adds a small generator module instead of those megabytes. It still spends device CPU and uploads buffers; complete-room time may not improve. Bound concurrency with Draco and image work. Transfer typed arrays/compact metadata rather than Three object graphs. A direct typed-array writer can reduce allocation if it preserves RNG order; today's code still grows large number arrays before conversion.

Preserve seed 11, five roots, pad/RNG order, 910 shoot IDs, node order/counts, neat lengths, hubs, pace, triangle ranges, all attributes and normalized flags. Preserve `bonsai-shoots` `{count, at, lengths}`, deci-node encoding and one elapsed-growth replay. Equal count is insufficient. Future generator versions must not reinterpret legacy trees. Test bare/partial/neat/overgrown fixtures at 0/2/30 days and malformed storage. Clumps copy contiguous triangles, so untracked vertex reordering breaks behaviour.

## Lighthouse 13.5 details

Checked the profiler's installed Lighthouse **13.5.0**, using `@paulirish/trace_engine 0.0.65`. Public upstream links corroborate the inspected code; local installed code was the version-specific authority.

1. **Simulation.** Lantern models network/CPU dependencies from the observed trace, not a replay at uniformly slowed times. Predicted tasks can reorder. The installed simulator applies half the configured CPU multiplier to layout-containing tasks: the fresh profile saw ~2× for scene building and ~4× for late graphics. Splitting a task can change that classification. Do not derive scored TBT by adding diagnostic rows. [Throttling](https://github.com/GoogleChrome/lighthouse/blob/v13.5.0/docs/throttling.md).
2. **TBT.** Simulate optimistic/pessimistic cases on the full graph; clip each CPU task to the case's FCP-to-interactive interval, subtract 50 ms from the clipped duration and sum positive remainders. Optimistic TBT uses pessimistic FCP plus optimistic interactive; pessimistic TBT uses optimistic FCP plus pessimistic interactive. Average the totals equally. [Calculation](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/metrics/TotalBlockingTime.ts), [clipping](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/metrics/TBTUtils.ts).
3. **Interactive endpoint.** Simulation takes the later of LCP and the last simulated CPU task longer than 50 ms. The optimistic graph filters toward critical work, the pessimistic graph retains all work. The observed algorithm instead searches for five seconds without long tasks and with at most two eligible in-flight requests, then reports a qualifying earlier point, not that point plus five seconds. Short animation does not automatically prevent either endpoint; long frames can. Network traffic affects observed quietness and simulated dependencies differently. [Simulated](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/metrics/Interactive.ts), [observed](https://github.com/GoogleChrome/lighthouse/blob/v13.5.0/core/computed/metrics/interactive.js).
4. **Observed Speed Index.** Lighthouse requests Speedline's speedIndex in fast mode. It compares RGB histograms relative to initial/final captured frames, not exact spatial pixel equality or completed-object counts. SI accumulates time weighted by unfinished visual progress. A similarly coloured early room may help even while incomplete; choreography is not inherently rewarded. [Wrapper](https://github.com/GoogleChrome/lighthouse/blob/v13.5.0/core/computed/speedline.js), [Speedline](https://github.com/paulirish/speedline/blob/master/core/lib/speed-index.js).
5. **Simulated SI.** Optimistic input is observed SI; pessimistic input is a weighted mean of simulated layout-task completion times, using log2(duration) weights and a pessimistic-FCP floor. Coefficients vary with round-trip latency: at 150 ms, 1.4 × observed SI + 0.4 × layout estimate, then floored at simulated FCP. This is a regression formula, not a normalized average or 4× filmstrip replay. [Implementation](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/metrics/SpeedIndex.ts).
6. **LCP.** The observed marker seeds dependency graphs; simulations estimate relevant work before that marker, with additional layout nodes in the pessimistic case. Estimates blend equally and are floored at simulated FCP. Canvas remains ineligible; this page's heading can benefit indirectly from less competition, but room readiness is separate. [Implementation](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/metrics/LargestContentfulPaint.ts), [eligible content](https://web.dev/articles/lcp).

`await Promise.resolve()` only yields to microtasks. Use real task boundaries (`scheduler.yield()` or timer fallback); avoid simultaneous promise completions doing substantial work. Count rendering/animation in the same budget. Idle callbacks alone cannot guarantee completion under load. Module evaluation, GC, context creation, individual uploads and synchronous compile/render submission can still block. `compileAsync` does not make every setup step asynchronous. Worker generation reduces main-thread TBT, not all device CPU/battery cost.

Green metric thresholds are not a promise of 100. Weighted scoring curves, other metrics and run variation matter. The approximately 100 ms tap goal is an interaction acceptance target, not a Lighthouse threshold.

## Whole-renderer worker

Recommend **later**, triggered by remaining graphics blocking after Stage 3, not never. Detect worker WebGL2 capabilities in the actual path rather than just the presence of OffscreenCanvas. [HTML standard](https://html.spec.whatwg.org/multipage/canvas.html#the-offscreencanvas-interface), [Three.js guide](https://threejs.org/manual/pages/offscreencanvas.html).

The main-thread bridge must own HTML panels/layer styles, accessibility, font readiness, resize/visibility, pointer capture, local/session storage, radio and audio gesture activation. The Game Boy/clock 2D textures and slash trail need deliberate ownership. GSAP/render timing needs a worker-safe clock; input/state messages need ordering, cancellation and bounded frequency. Failure after canvas transfer needs a fresh canvas for main-thread fallback. Validate font matching, touch cube turns, cuts, START/return sync, worker loaders/Draco/bitmaps, context loss and disposal.

Worker input can stall while that worker is busy; the same GPU still renders. Hydration/layout remain on main. A score improvement alone is insufficient if taps, memory, battery or room readiness regress. No blanket browser-support percentage or universal zero-blocking guarantee is assumed.

