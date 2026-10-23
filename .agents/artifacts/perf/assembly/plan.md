# A room that loads without holding the page up

Planning only · 10 October 2026 · `redesign` at `5a9cf09`

**Approve a small motion trial and the CPU fixes first. Use a bonsai worker. Treat progressive assembly as a separate visual decision; defer a worker for the whole renderer.** Lighthouse 100 is a target, not a credible promise yet.

The current slow-connection room takes about **12.5 seconds** to offer START and transfers **2.03 MB**. Bonsai construction is the largest tap-blocking task. Removing it should improve responsiveness and Total Blocking Time, but will not remove two seconds from room-ready: much of it already overlaps downloads. These are findings from the [fresh profile](../profile/report.md), not redesign forecasts.

The owner's 89 desktop / 80 mobile and the profiler's lower scores are different baselines. Compare changes under identical conditions; do not average the two. The [earlier plan](../plan.md) is history, not another set of savings to add. Current code still constructs the bonsai and picking hulls at runtime.

## Verdict on the proposal

- **Immediate escape: strengthen what exists.** SKIP already works before the engine finishes, after Svelte starts handling events. It is absent from the initial server-rendered loading state and cannot respond during a long task. Provide a tiny early escape handler and real page-link fallback. “Never blocks” is too absolute: WebGL setup, browser layout and individual graphics calls cannot be interrupted by a scheduler.
- **Objects arriving: prototype first.** Keep the lantern and wall portrait with the first room view. Prioritize Game Boy, then cube/clock, then bonsai. Keep the camera still. An object appears when its lighting and graphics are ready, not merely when its download ends. Do not enforce serial downloads or make a ready object wait for a slow neighbour.
- **One work budget: yes.** Start with roughly 3–5 ms of our own work, then let the browser paint and handle input. Share the budget across startup and animation. A queue cannot split a single 200 ms library call: precompute it, split its internals, or move it to a worker. Record exceptions instead of claiming a guarantee.
- **Finished bonsai buffers: reject as the default.** An in-memory experiment produced **4.12 MB with Brotli**, including trimming metadata—twice today's entire page transfer. That adds about **20.6 seconds of transfer** at the profiled 200 KB/s. Positions dominate, so smaller metadata will not rescue it. Generate in a dedicated worker and transfer the arrays without copying. A compact build-time representation remains an optional experiment.
- **Blurry-to-sharp lighting: later, conditional.** It adds downloads, uploads and visible change. Tiny atlases can bleed light between surfaces. Test the complete preview payload; do not assume “a few KB” for the whole room.
- **Whole-room OffscreenCanvas: later if graphics remain the blocker.** It can move rendering off the page's main thread, but cannot remove download bytes, GPU work, hydration or all input latency. This engine is coupled to HTML, sound, storage and GSAP. A bonsai worker addresses the largest known problem with much less change.

## What Lighthouse rewards

Lighthouse 13.5 normally records a load, then simulates slower conditions. The predicted timeline is not the actual slow-phone timeline. Score weights are: blocking time 30%, largest content paint 25%, layout stability 25%, first content paint 10%, visual progress/Speed Index 10%. [Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

**TBT counts time beyond 50 ms in tasks between first paint and “interactive”.** This version's simulated interactive endpoint follows the last simulated task over 50 ms, with a lower bound based on largest content paint. It does **not** apply the familiar five-second quiet-window rule of the observed calculation. Truly short tasks do not automatically postpone it; later long tasks during assembly can extend it. Moving work later is not a dependable escape from scoring. [Exact calculation and sources](evidence.md#lighthouse-135-details).

**Speed Index does not reward assembly itself.** Its observed input measures visual progress toward the last captured frame using colour distributions. An early background close to the final room helps; prolonged drops, an empty tabletop and late brightness changes may not. Its simulation also uses layout timing, so a better canvas reveal has no guaranteed point gain. [Visual progress](https://github.com/paulirish/speedline/blob/master/core/lib/speed-index.js), [simulation](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/metrics/SpeedIndex.ts).

**LCP currently measures the page heading, not the room.** Canvas content is ineligible. Protect the heading's early paint and measure room readiness separately. A static room image could improve perceived speed, but could become a new LCP element and needs its own audit. [Eligible content](https://web.dev/articles/lcp).

## Lighting and export feasibility

There are **six interactive objects**, not six meshes: Game Boy, cube, clock, lantern, bonsai and wall portrait. The GLB has 97 nodes, 96 meshes and 103 mesh parts before runtime replacements. A separate decorative floor plant also exists. Split useful object groups, not every mesh.

The five lighting atlases—props, bed, room, wall and plant—each have day and lamp layers. The nightstand shares `props` with the clock, lantern and bonsai parts; the portrait uses `wall`. Geometry can be exported separately while preserving these shared maps and the second texture-coordinate set. Repacking each object's coordinates independently would break the lighting.

**Soft shadows alone cannot preserve the finished bake.** Blender includes bounced light and a bonsai stand-in that blocks the lantern; effects extend beyond the table. The Game Boy is already excluded from baking and already has a soft shadow, making it the safest trial.

For later assembly, keep today's final maps. Bake a temporary room without the arriving objects, retaining the same geometry and texture coordinates and keeping the lantern present. Temporary landing shadows can bridge the motion; blend affected day/lamp maps to today's final lighting as assembly finishes, then remove the temporary shadows. The settled image stays intact, but the transition needs owner approval. If it looks wrong or costs too much, use a shorter grouped reveal. Exact independent per-object shadow/bounce layers require more bakes and data and are not the default.

## Stages to approve

Each stage ends at an independently shippable candidate. Days below are rough implementation effort, excluding owner review and unattended baking. Stage 1 is the requested design checkpoint; the next stages prioritize likely Lighthouse benefit per effort. Visual approval does not authorize deployment.

### 1. Feel one landing and establish the baseline — 1–2 days

**Change:** reproduce the owner's audit settings. Make SKIP available before full hydration. Behind a development flag, use the existing complete room to lower the Game Boy into place over roughly 350–500 ms, with a small settle and its existing shadow. Optionally trial the cube, labelling its baked shadow as a prototype limitation. Include instant placement and reduced motion. No asset split yet.

**Files:** `BootIntro.svelte`, `engine.ts`, optional `assembly-motion.ts`; early escape support in `src/routes/lab/boot/+page.svelte` if needed.

**Visible / approval:** approve the motion, height, settling and which objects should animate. This is a motion sample, not proof of faster loading. Assign focused motion direction to **Claude Opus 5.5**, implementation to **GPT-6.1 Sol**; check the live model catalog when assigning.

**Verify:** phone/desktop recordings, final fixed-camera screenshot, SKIP before hydration/during import, keyboard/sound controls and three matching audits. The escape fix can ship independently; motion stays disabled until approved. No score gain promised from motion.

### 2. Move bonsai generation off the page thread — 2–3 days

**Change:** extract deterministic generation into a dedicated worker. Pass frozen roots, seed and transforms; transfer geometry and compact shoot metadata back. Attach in bounded steps through a shared startup queue. Retain a sliced fallback if the worker fails. Preserve saved trimming, growth, clumps and outlines.

**Files:** `bonsai.ts`, `engine.ts`; new `bonsai-generator.ts`, `bonsai.worker.ts`, `startup-queue.ts`. Keep roots/storage compatible.

**Visible / approval:** none intended. **Gain:** removes the measured 1.3–1.55 s generation stretch from the main thread. Measure simulated TBT; slow-4G complete-room time may barely change.

**Verify:** geometry/ID/metadata hashes; saved trees at 0/2/30 days; cuts/regrowth; stale replies and route exit; matching bonsai screenshots; audits and room-ready. Reject a large main-thread reconstruction task on receipt.

### 3. Break up remaining preparation — 2–4 days

**Change:** extend the one queue to scene/cube assembly, decoded-image attachment and graphics work. Precompute touch-picking hulls and bounds. Warm shader variants and textures in small groups with final material settings. Create AudioContext on a sound-enabled gesture, preserving synchronous resume and boot timing; remove unnecessary audio/font gates from visual readiness. Audit remaining hydration/layout and context creation separately.

**Files:** `engine.ts`, `rubiks.ts`, `sound.ts`, `BootIntro.svelte`, `startup-queue.ts`, `assets/3d/pack.mjs`; generated hull/bounds assets.

**Visible / approval:** same room; approve any change to earliest sound. **Gain:** targets hulls (~0.2 s), cube (~0.1 s), sound setup (~0.08 s), compile submission (~0.25 s) and first complete draw (~0.2–0.4 s). These overlapping spans are not additive savings.

**Verify:** SKIP/page scrolling throughout preparation; first turn/cut/lamp change/START without a new stall; individual graphics-call traces; cold/warm audits, final screenshots and room-ready. Preserve zero room drawing on the page. Reassess here if an indivisible graphics call remains dominant.

### 4. Deliver useful asset groups sooner — 3–5 days

**Change:** split into warm shell including lantern/portrait, Game Boy, cube description/assets, clock and bonsai; keep other decor in the shell initially. Share texture URLs. Download a small prioritized set of geometry and lighting together rather than gate every image behind the complete model. Reuse one decoder pool; start bonsai generation as soon as transforms exist. Measure concurrency and duplication. Replace all-or-nothing Room creation with an early controller and per-object ready states; preserve the current complete reveal for this stage.

**Files:** `assets.ts`, `fetches.ts`, `engine.ts`, `pack.mjs`, `scripts/precompress.mjs`, generated assets/manifest; `build_scene.py` if source grouping is needed.

**Visible / approval:** none required yet: retain the complete-room reveal while validating delivery. **Gain:** earlier useful assets and better overlap; direct TBT gain only if parsing/attachment tasks shrink. More files do not inherently mean fewer bytes.

**Verify:** transforms, names, lightmap coordinates and roots; one fetch per shared asset; Brotli headers on every GLB; cold waterfall/bytes/audits/room-ready; identical final images. Missing optional objects must not trap the visitor.

### 5. Reveal the assembling room — 3–6 days plus baking

**Change:** show the shell when lit and warmed, then approved landings as objects become usable. Bonsai comes last when it is actually last to finish. Add the temporary-to-final lighting bridge. Track first room view, usable Game Boy and complete room separately; enable START when its transition is safe without waiting for bonsai. Preserve returning visitors' full background preparation.

**Files:** `build_scene.py`, `pack.mjs`, `baked-material.ts`, `assets.ts`, `fetches.ts`, `engine.ts`, `BootIntro.svelte`, `assembly-motion.ts`, generated lighting.

**Visible / approval:** required for partial room, shadows, light blend, motion and earlier START. Cached objects appear together or settle briefly; no minimum-duration show. Returning visitors still land on the page. Reduced motion places objects immediately. No automatic landing sound before a gesture.

**Verify:** staged phone/desktop screenshots and recordings; lamp off/warm/red/blue/bright; unchanged settled room; picking only after landing; early START/SKIP, missing objects and return; audits/filmstrip plus first-room/START/complete-room marks. Stop landing animations after SKIP/START; late assets must not reclaim the page, and BACK TO THE ROOM appears only when safe. Reject worse taps or materially slower completion.

### 6. Tiny lightmaps only if a gap remains — 1–2 days

**Change:** trial small day/lamp maps with identical coordinates/scales, followed by bounded full-resolution uploads. Keep this experiment separate from the shadow transition. Avoid permanently retaining four map sets.

**Files:** `pack.mjs`, `assets.ts`, `fetches.ts`, `baked-material.ts`, `engine.ts`, generated preview maps.

**Visible / approval:** temporary softness and sharpening. **Gain:** possible earlier room/Speed Index; no intrinsic LCP gain, and extra uploads can hurt TBT.

**Verify:** whole preview payload, atlas-edge light leaks, colour stability, memory disposal, cold/warm audits and all readiness marks. Keep only if first useful room is clearly earlier without slower completion or worse final quality; otherwise omit.

## Measurement and stopping rules

Compare at least three alternating baseline/candidate cold runs per device on equivalent Vercel previews with verified encoding; report medians/ranges. Keep owner's Chrome/incognito and Lighthouse 13.5 simulation separate from actual 4× CPU / 1.6 Mbps / 150 ms captures. Test warm/partial cache, returning visits, reduced motion, Save-Data, failed assets and leaving mid-load. Phones are touch-only; claim no mobile benefit from hover work.

Record **first usable SKIP, first room frame, usable START, complete sharp room, worst task, TBT, Speed Index, LCP and bytes**. Working targets: splittable application tasks under 50 ms even under actual throttling; tap feedback around 100 ms or less; complete room no slower beyond repeat-run noise. Final physical-phone testing follows the owner's existing end-of-work preference. Emulation is not a handset result.

After Stage 3, assess whether scores and responsiveness justify the visual stages. If graphics calls still dominate blocking, commission a **1–2 day OffscreenCanvas spike**, then approve a full port separately (roughly 1–2 further weeks, uncertain). HTML controls, accessible state, audio activation and storage stay on main; resize/visibility/input/state cross a message bridge. Test worker WebGL2, text textures/fonts, GSAP timing, input ordering, context loss and fresh-canvas fallback. It does not make the main thread free by construction. [Three.js integration](https://threejs.org/manual/pages/offscreencanvas.html).

If near-100 still requires a major rewrite, offer a lightweight static room preview with 3D starting on request as an explicit product choice. It changes the welcome experience and needs approval. Do not delay work merely to evade Lighthouse's capture.

**Approval sequence:** Stage 1 trial → Stages 2–3 responsiveness → Stage 4 delivery → Stage 5 assembly → Stage 6 only with evidence. No application implementation, commit, build or deployment was performed for this plan. [Detailed evidence and compatibility requirements](evidence.md).

