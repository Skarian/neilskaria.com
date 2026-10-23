# Round 1 · G (Fable) · GPU, rendering and runtime

Scratch scripts: `%TEMP%\perf-scratch\` (glb.mjs, window.cjs, trace.cjs).

Key facts (measured from the raw profiles):
- **Shader linking:** three's `onFirstUse` blocks the main thread for 1.73 s on desktop and 1.51 s on the phone, waiting for synchronous program links.
- **Lightmap decode and upload:** `texSubImage2D` takes 0.47 s desktop and 1.46 s phone. It runs on the main thread because the lightmaps load through TextureLoader. GLB textures already use ImageBitmapLoader.
- **Longest startup task:** 2.86 s desktop, 5.24 s phone.
- **Idle room, per frame:**
  - JS in `render()`: 1.9 ms desktop, 9.6 ms phone.
  - `drawTrail` clears a full-DPR canvas every frame: 1.5 ms per phone frame (9% of the main thread).
- **START ring:** its conic-gradient `--angle` animation re-runs style, layout and paint every frame. On the phone that is 134 ms style/layout + 100 ms paint + 140 ms GPU raster per 1.4 s.
- **Draw calls:** 164 per frame, 80 of them the Rubik's cube (26 bodies + 54 stickers). The GLB has 103 primitives and 53 materials, and all 53 are `doubleSided`.
- **Double compiles:** the foliage and cube programs compile twice, because `fromScene` renders them before `envMap` is set.
- **PMREM size:** 256 gives two 768×1024 half-float targets, 6.3 MB kept for the whole session.

Proposals:
- **G1: ship a prefiltered cubeUV environment map; drop runtime `fromScene`.**
  - Bake it offline with the headless harness and save it as an 8-bit WebP (size 128, half exposure, 2× intensity).
  - Saves 1.4–1.6 s of link time on desktop, more on phones, plus 6 MB of GPU memory (12 MB at peak).
  - Must be regenerated after every room bake. Owner compares reflections.
- **G2: compile asynchronously before the first frame.**
  - Set envMap first, then `compileAsync`, with the CPU work done meanwhile.
  - Pre-warm the lazy variants: the screen map at boot, the clump material, and the mask/outline passes. This removes 40–350 ms hitches on first boot, first hover and first cut.
  - Main-thread wait goes from 1.7 s to about 0.5–0.9 s.
- **G3: frame scheduler.**
  - Full rate when anything is active (input, GSAP running, hover lerp, drag, particles); 30 fps desktop / 24 fps touch when idle; on demand for reduced motion. Also caps 120 Hz displays.
  - Idle CPU: phone ~92% → ~45%, desktop 15% → 8%. Owner judges a side-by-side recording.
- **G4: clear the trail canvas only when it drew something; create it lazily.** −1.5 ms per phone frame. Trivial.
- **G5: START ring as a `transform: rotate` pseudo-element.** Identical look; saves 7–10% of the phone main thread.
- **G6: page-phase CSS.**
  - Scanlines: animate `transform` rather than `background-position`.
  - Grain: shrink the 4× layer.
  - CRT SVG filter: measure it first; maybe drop the blur on coarse pointers.
  - Targets the 4% desktop / 15% phone page CPU.
- **G7: Rubik's cube as InstancedMesh** (bodies plus one mesh per sticker colour). 80 draws become 7, about −4 ms per phone frame. Effort M; picking goes through instanceId.
- **G8: merge static baked meshes per (lightmap group, material); `matrixAutoUpdate = false`.** With G7, about 164 → 70 draws.
- **G9: bonsai foliage attribute diet** (56 → ~20 bytes per vertex using quantised attributes). Saves 12–17 MB of GPU memory and per-frame vertex bandwidth.
- **G10: decode textures off the main thread and shrink two lamp maps.**
  - Lightmaps and portrait via ImageBitmapLoader (the portrait needs `imageOrientation: 'flipY'`).
  - room-lamp from 2048² to 512² (its scale is 0.028); bed-lamp to 512².
  - Saves about half of the 1.46 s phone upload, −20 MB GPU memory and −400 KB on the wire.
- **G11: unify the Game Boy's live material feature flags.** Five Physical/Standard programs become about two: 0.7–1.0 s less link time.
- **G12: backface culling on closed meshes** (export with `SKIP_BAKE=1`). Saves 10–25% of phone fragment work (assumed).
- **G13: adaptive DPR drop** only when a device can't hold the frame rate.
- **G14: lighter outline mask** (RG8, optionally half resolution). Low priority.
- **G15: same as L2/J3/J4** (parallel loading, lazy boot sound).

Top 5: G1, G2, G3 (with G4 and G5), G10, G7 + G8.

Tempting but wrong:
- KTX2/Basis lightmaps: banding, plus a ~250 KB transcoder.
- OffscreenCanvas worker rendering, a fixed lower DPR, or mediump precision.
