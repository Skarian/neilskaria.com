# Round 2 — G — GPU, rendering and runtime

Plan only. The only repository outputs are this file and the screenshot pairs in `.agents/artifacts/perf/shots-r2/`. Experiments live in `%TEMP%\perf\scratch\G\` (`harness.mjs`, `d2.mjs`, `d2b.mjs`, `d5.mjs`, `dbg.mjs` and their `d2-desktop/`, `d2b-desktop/`, `d5-phone/`, `d5-desktop/` folders). Every run drove the untouched production preview on port 4173 through CDP; the engine chunk was patched in flight (Fetch domain) only to expose the renderer, scene, the live materials and the render callback. No source, asset or build was changed.

Labels: **M** measured in this round, **M1** measured in round 1, **S** derived by arithmetic from measured inputs, **A** assumed. All CPU figures are Chrome `TaskDuration` (renderer main-thread occupancy), not system CPU, GPU load or energy. The "phone" is the brief's emulation (412×915 @2.625, 4× CPU throttle, desktop RX 590 through ANGLE D3D11); its shader numbers are therefore the desktop GPU process's, not an Android driver's.

**Headline decisions.** G1 survives, but at size 256 and exported from the engine's own capture point, not size 128 and not a re-render. G2 as a standalone item is withdrawn; its content moves into J1. G10's resizing of room-lamp and bed-lamp is withdrawn; its loader half stays. G3 is now a measured 30 fps idle cap plus a reduced-motion on-demand mode, not a free-standing scheduler claim. The parallel-compile extension is effectively absent on Android, which changes how D3 should be read.

## Critiques

### A — assets

- **Agree, and I was wrong on G10's sizes.** room-lamp is 1024², not 2048² (**M**, `magick identify` on the served file). Only the wall pair is 2048². A Lanczos 1024→512→1024 round trip of room-lamp gives 45.9 dB but a peak error of 95/255 (**M**; A measured 41 dB / 115 with their source); bed-lamp 48.8 dB, peak 48/255 (**M**). The peak is the lattice shadow on the floor, which a 512² map cannot carry. Drop the resize part of G10 entirely. Keep A8 (wall to 1024²) as A wrote it.
- **A7 (lossy lightmaps), from the GPU side.** D2 below is the same trick on a different lighting texture: an 8-bit sRGB encode of a lighting map produced 52–64 dB on the rendered frame at WebP q95. That is precedent, not proof: the lamp layer is multiplied by `lampTint` up to brightness 1.5, so A's in-island peak error of 7–16/255 becomes up to 24/255 at a saturated colour. The owner's lantern-extreme screenshots remain the gate. Both maps stay 8-bit either way, so no GPU-format change.
- **A3 (Draco 12/10/12): add quantised accessors.** Decoded geometry is 34.2 MB of GPU buffers across 180 meshes (**M**, `geometry.json`), all Float32 because DRACOLoader emits the accessor's component type. If the packing script runs gltf-transform `quantize` before `draco` (KHR_mesh_quantization: int16 positions, int8 normals, uint16 UVs), the same meshes upload at roughly a third of the bytes and the Duvet's 3.5 MB becomes about 1.2 MB (**S** from attribute widths). The 10-bit normals A chose are right for the SP's clearcoat; the D2 views in `shots-r2/` are the correct test images for faceting.
- **A2 / A8 GPU memory.** Agree with the direction; A's "about 145 MB → 65 MB of texture memory" is plausible (**A**). Add to it: environment map −3.1 MB kept and −6.3 MB transient (D2), foliage −8.3 to −12.6 MB (J's layouts, D4).
- **A11 (keep Draco).** Agree on bytes. The GPU does not care which decoder ran; the only GPU-side difference is the quantised-accessor point above, which both codecs can carry.
- **KTX2 rejection.** Agree, as in round 1.

### L — loading

- **L6 (progressive lightmaps): agree with dropping it.** From my side there was a second reason it never paid: today the environment map is captured from whatever lightmaps are loaded, so a low-res-first pass would have baked low-res lighting into every reflection until a second capture. G1 removes that coupling but not the double upload or the visible switch on baked surfaces.
- **G1 budget.** L modelled 60 KB (**A**). Measured: 44,506 B at WebP q95, 29,964 B at q90, 19,070 B at q80 for a size-256 map (**M**), so under budget; at 200 kB/s that is 0.15–0.22 s of exposed transfer (**S**) against 1.4 s of forced-sync compile removed on this machine (**M**, below).
- **G2 correction: accepted.** `engine.ts:686` already awaits `compileAsync`; `engine.ts:630` runs `fromScene` synchronously before it. My round-1 wording "compile asynchronously before the first frame" claimed an addition that exists. What remains of G2 is ordering and warm-up, and it belongs inside J1 (see D3).
- **`gl.mjs` forcing `LINK_STATUS`: accepted.** My round-2 hook (`harness.mjs`, `GL_HOOK`) does the same on purpose: it yields the per-program compile cost as the GPU process actually pays it, which is what G1 and G11 need. Those numbers are labelled "forced-sync" below and are not elapsed main-thread stalls. For stall claims I rely on J's passive wrapper.
- **G10 loader half.** Agree with L's conditions: `flipY=false`, `channel=1`, sRGB for the lightmaps; `imageOrientation: 'flipY'` for the portrait only. After A7/A8 the decode work shrinks, so the saving is smaller than round 1's "half of 1.46 s"; I now put it at 0.3–0.5 s of phone main thread (**A**, scaled from M1 by A's pixel counts).
- **L4 (downloads only for returning readers).** Agree, with one GPU fact in its favour: Chrome's GPU process keeps a disk program cache keyed on shader source, so the compile that L4 defers until intent is cheap on a repeat visit anyway. That same cache is why D8 must separate first-process runs from later ones.
- **D8 protocol.** Agree. GPU additions in "Open disputes".
- **L's forecasts.** No objection to the model; one caveat it cannot see: every shader second in the emulation is desktop ANGLE/FXC time in an unthrottled GPU process. Android compile cost could be larger or smaller; nothing in this round measures it.

### J — JavaScript and CPU

- **E1 foliage inventory: independently confirmed.** My `geometry.json` lists `BonsaiShoots` at 360,426 vertices, non-indexed, six Float32 attributes, 20,183,856 B (**M**, identical to J's). Round 1's "12–17 MB" upper end was wrong; use J's 1.80 / 8.29 / 12.61 MB layouts. GPU-side addition: with `drawRange` at `all`, every frame fetches the whole 20.2 MB and runs 360k vertices through the vertex shader, more than the rest of the room after A3–A6 (174k). At 30 fps that is 0.6 GB/s of vertex fetch (**S**); the 21-byte layout cuts it to 0.23 GB/s. This is the main reason G9 matters on a phone, beyond memory.
- **Colour packing.** J's UNORM8 linear-colour error of 0.00196 is below one output step only after lighting; in the dark greens the sRGB encode has slope 12.92, so the worst case is about 6/255 before lighting attenuates it (**S**). If the owner's comparison fails, store the colour sRGB-encoded in the byte and decode in the shader hook; same bytes, better dark precision.
- **Clump trap (`normalized` lost in `clump()`): agree**, good catch. Add: the mask/occluder override materials used by the outline pass ignore the foliage hooks, so packed positions must be decoded before the outline mask is rendered too, or the outline will be drawn from un-decoded coordinates.
- **E2 and the D3 design: accepted**, with the Android evidence below added to it. J's "most waiting charged to `getProgramInfoLog`" is consistent with three's `onFirstUse` (`WebGLProgram.js:863–879`), which queries the info log and `LINK_STATUS` when `renderer.debug.checkShaderErrors` is on (the default).
- **G3 notes: agree**, and one more from the source: `engine.ts:1026` clamps `dt` to 0.05 s. Below 20 fps the water, clump and bits animations run slow, not just choppy. Any idle cadence must stay at or above 20 fps or raise the clamp while idle. `parallax.lerp(pointer, 0.05)` at `engine.ts:1048` needs a time-based factor (`1 - 0.95^(60·dt)` keeps today's feel).
- **G7/G8 caveats: agree** (instanceId picking, no merging of movable or focusable things, per-thing lantern uniforms).
- **J's D7 envelope (13–16 s all tracks).** Consistent with mine. My components: G1 removes 1.4 s of forced-sync compile and the six face renders (**M**, desktop GPU process); the loader half of G10 0.3–0.5 s (**A**); ordering inside J1 overlaps what is left. Call it 2–2.5 s of the all-tracks delta from my area (**A**).

### Overlaps, which version to keep

| Overlap | Keep |
|---|---|
| G2 vs J1 | J1's staged design; G2 becomes two bullets in it (submit compile early, warm lazy variants). |
| G9 vs J2 | J's order: layout contract first, worker only if the writer still blocks. |
| G10 resize vs A8 | A8 (wall only). room-lamp and bed-lamp stay 1024². |
| G10 loader vs A13 | G10's loader half, with L's orientation/channel conditions. |
| G15 vs L2/J3/J4 | L owns the loading graph. |
| G4 vs L7 | G4 (lazy trail, clear only when drawn). |
| G3 vs J's scheduler notes | G3, with J's dt fix and the clamp fix. |

## Experiments (method, result)

### E1 — D2: baked environment map (`d2.mjs`, `d2b.mjs`, desktop profile)

**Method.** After the room was interactive, the animation loop was stopped so every render drew the same state. Today's PMREM texture (`envMap`, 768×1024 RGBA half-float, size 256) was read back from the GPU, encoded to 8-bit sRGB at exposure 1, written as PNG and as WebP (lossless, q95, q90, q80, sharp-YUV, method 6), then loaded back as a plain 8-bit texture with `CubeUVReflectionMapping`, `colorSpace = srgb`, `flipY = false`, no mipmaps, linear filtering, and assigned to the live materials with unchanged `envMapIntensity`. The same frame was rendered from four cameras (home, Game Boy, cube, bonsai) and compared with ImageMagick PSNR against today's render (control: the same frame twice gives `inf`). A second script re-captured the PMREM in-page at size 256 and 128 in the engine's capture state (SP hidden, warm background, lights hidden, no `envMap` on live materials) to separate size from encoding.

**Result 1: there is no HDR content to lose.** Today's map: max 0.967, mean 0.040, no texel above 1.0 (**M**). Round 1's "half exposure, 2× intensity" is unnecessary; encode at exposure 1 and leave intensities alone. If the room ever gains an emissive above 1, the export must clamp or switch to a 2× range.

**Result 2: 8-bit sRGB at size 256 is a match; size 128 is not.** PSNR of the rendered frame against today (**M**):

| View | 8-bit lossless 256 | q95 256 | q90 256 | q80 256 | size 128 (half-float, re-captured) |
|---|---:|---:|---:|---:|---:|
| home | 74.0 | 64.1 | 62.3 | 57.5 | 42.2 |
| Game Boy | 66.0 | 52.0 | 51.2 | 48.0 | 29.9 |
| cube | 69.4 | 57.3 | 56.0 | 52.1 | 39.2 |
| bonsai | 69.2 | 59.6 | 58.1 | 53.3 | 40.2 |

The size-128 column mixes two effects, so `d2b.mjs` compared the two in-page re-captures directly: size 256 vs 128 is 41.6 dB on the Game Boy, 45.2 on the cube, 52.8 at home (**M**). The ×8-amplified diff (`d2-sp-diff-amplified-x8__…png`, middle panel) shows a shifted gloss band across the whole lid, which is what the side-by-side shows by eye. Size 256 it is; the wire cost difference is 15 KB.

**Result 3: the capture state matters more than the size.** A faithful in-page re-capture at size 256 still differs from today's map by 32.2 dB on the Game Boy, 44.7 at home, 43.5 on the cube (**M**; right panel of the amplified triptych). The engine captures at `engine.ts:628–631`, before the motes, the three lights and the first clock-LED draw exist (`engine.ts:1068–1072` draws the display in `render()`), and before the live materials receive the map; my re-capture ran after all of those. The additive motes around the capture point are the likely main contributor (**A**, source-inspected, not isolated). Consequence for G1: the texture must be exported from the engine's own capture point (a headless run of the real page with an export hook), not re-rendered by a separate script. Done that way, it reproduces today to 66–74 dB before lossy encoding.

**Result 4: costs.**

| | Measured |
|---|---|
| Wire, size 256 | lossless 210,530 B; q95 44,506 B; q90 29,964 B; q80 19,070 B (**M**) |
| GPU memory kept | 6,291,456 B half-float today → 3,145,728 B 8-bit (**S** from dimensions) |
| GPU memory transient | PMREM ping-pong target 6.3 MB during generation → 0 (**S**) |
| Forced-sync link removed, desktop GPU process | `PMREMGGXConvolution` 1,105 ms + `SphericalGaussianBlur` 120 ms + cubemap 10 ms = 1,235 ms; plus 4 no-envMap variants of the live materials compiled only because `fromScene` renders them before the map is set: 182 ms. Total 1,418 ms of 33 links (**M**, `programs.json`). |
| `fromScene` span, desktop | 2,272 ms wall from `new PMREMGenerator` to the map being assigned (**M**). The remainder is the six face renders plus the first-ever texture and buffer uploads of the whole scene, which G1 moves to the next first render rather than removing. |
| Per-frame cost | No measurable difference between today and the 8-bit map: 1–2.5 ms per draw+finish in all variants (**M**). |
| Extension on this context | `KHR_parallel_shader_compile` present (ANGLE D3D11) (**M**). |

Owner material: `shots-r2/d2-*-side__today__8bit-256-q95__128-lossless.png` (today | recommended | rejected) for all four views; `d2-sp-before-*` / `d2-sp-after-*` as a clean pair; the diff images; `d2-envmap-cubeuv-256-q95.webp` is the actual 44.5 KB asset.

### E2 — D3: shader compilation and the extension on Android

**Method.** Source inspection of three 0.186 and ANGLE, published prevalence data, and the link log above. No Android device was available.

**Result 1: on Android the extension is effectively absent.** web3dsurvey reports `KHR_parallel_shader_compile` on 0.21% of Android WebGL2 contexts and 0.21% of WebGL1 contexts, against 89.6% Windows, 93.5% macOS, 98.6% iOS, 0% Samsung Internet (prevalence data, no sample size given; [WebGL2](https://web3dsurvey.com/webgl2/extensions/KHR_parallel_shader_compile), [WebGL1](https://web3dsurvey.com/webgl/extensions/KHR_parallel_shader_compile)). The mechanism matches: ANGLE's GLES backend exposes it only when the native driver exports `glMaxShaderCompilerThreadsKHR` ([renderergl_utils.cpp](https://raw.githubusercontent.com/google/angle/main/src/libANGLE/renderer/gl/renderergl_utils.cpp)), and ANGLE's Vulkan backend disabled it in January 2022 because "Vulkan's shader compiler is very fast and is outweighed by the threading overhead" and it has no parallel link ([commit 6312da1a](https://chromium.googlesource.com/angle/angle/+/6312da1abf2128179262ae8bd61ff6120f0e1de0)). ANGLE's own support table shows the extension blank for Pixel 4 and Pixel 6 Vulkan configurations (February 2023, [ExtensionSupport.md](https://raw.githubusercontent.com/google/angle/main/doc/ExtensionSupport.md)). Browser-compat tables that say "Chrome Android since 76" record that Chrome *can* expose it, which is J's point.

**Result 2: what three does without it.** `WebGLProgram.isReady()` is `true` immediately when the extension is missing (`WebGLProgram.js:994–1005`); `compileAsync` then resolves after a single 10 ms timer (`WebGLRenderer.js:1555–1567`). The stall moves to `onFirstUse` at the first render: `getProgramInfoLog` and `LINK_STATUS` when `checkShaderErrors` is on, then attribute and uniform reflection either way.

**Result 3: the overlap that still exists on Android.** WebGL calls are queued to the GPU process; `linkProgram` returns to JS immediately and the driver links while JS continues. The main thread waits only at the first synchronous query. So "submit all links as early as the final material state allows, then do the CPU work (foliage, hulls, audio), then first-use" overlaps compile with CPU on Android without any extension. That is the whole of what G2 still proposes, and it is J1's stage 4 with the submission moved earlier. On desktop with the extension, J measured 161–217 ms of synchronous submission inside a 434–475 ms wait; after G1 and G11 the remaining overlap is worth 0.2–0.3 s (**A**).

**Result 4: how much of G2 survives G1 and G11.** None as a separate saving. G1 removes the three PMREM programs and four duplicate variants (1.4 s forced-sync here). G11 is smaller than round 1 claimed: the five heavy post-env programs are `ShellRed` 350 ms, `Screw` 237 ms, and three `STANDARD + USE_ENVMAP` variants (with map 244 ms, with vertex colour for the foliage 248 ms, plain 249 ms) (**M**). The screen cover already shares `ShellRed`'s program (one `PHYSICAL` link in the log). The foliage and the mapped variant cannot merge without look changes; `Screw` single-sided would share the plain variant. Realistic G11: one or two programs, 0.25–0.5 s forced-sync on this machine (**S**), unknown on Android. Fewer programs matters more on Android than here because nothing compiles in parallel there.

**Result 5: first visit vs repeat.** Chrome's GPU process caches program binaries on disk, so repeat visits skip most of this. D8 must record whether the run was the first in a fresh browser process.

### E3 — D5: injected idle throttle (`d5.mjs`, phone and desktop profiles)

**Method.** With the room idle (pointer at rest, START ring on screen), the engine's render callback was wrapped so only every frame whose timestamp exceeded the previous render by `1000/fps − 1.5` ms rendered; rAF kept firing at display rate. Main-thread `TaskDuration` over 6 s windows, actual renders per second counted, rAF interval p50/p95 sampled. The START ring's CSS animation was switched off after the first two rows so the series isolates the render loop (G5 removes the ring's cost anyway). Then the pointer was moved for 6–9 s at 60 and 30. Then, at the home view, `render(time)` was called at t, t+16.7, t+33.3 and t+66.7 ms and the frames diffed.

**Result, phone emulation (4× CPU):**

| Condition | Renders/s | Main thread |
|---|---:|---:|
| 60 fps, ring on (today) | — | 97.1% |
| loop off, ring on | 0 | 29.1% |
| loop off, ring off | 0 | 14.3% |
| 60 fps, ring off | 45.3 | 82.7% |
| 30 fps | 27.4 | 46.8% |
| "24 fps" (quantised to every 3rd vsync) | 18.7 | 38.8% |
| 20 fps | 18.8 | 40.5% |
| 15 fps | 14.0 | 31.8% |
| pointer moving, 60 fps | — | 98.5% |
| pointer moving, 30 fps | — | 93.6% |

All **M**. Per rendered frame: 12–15 ms of main thread at 4× (**S**), consistent with round 1's 9.6 ms of JS plus draw submission. The ring alone costs 14.8 points on the phone and 3.5 on desktop (**S**), confirming G5. At 60 the emulation cannot hold the rate (45 renders/s, rAF p95 36 ms after the series).

**Result, desktop:** 60 fps ring off 14.9–19.7%; 30 fps 10.1%; 20 fps 7.2%; 15 fps 5.9%; loop off ring off 3.1%; pointer moving 30.3% at 60, 16.4% at 30 (**M**). (The very first 60 fps row read 56.6% because it overlapped the end of the intro; ignore it.)

**Result, motion per step** at 1280×800 (1,024,000 px), today's env, pointer at rest (**M**):

| Step | Pixels changed > 1% | > 3% | RMSE |
|---|---:|---:|---:|
| 1 frame (60 fps) | 1,434 (0.14%) | 488 | 0.22% |
| 2 frames (30 fps) | 2,533 (0.25%) | 1,022 | 0.32% |
| 4 frames (15 fps) | 4,417 (0.43%) | 2,097 | 0.50% |

The amplified diff (`shots-r2/d5-home-diff-amplified-33ms-step.png`) shows exactly two movers: the 140 motes (sub-pixel drift, 0.03 rad/s) and the foliage sway. The portrait flips a frame every 100 ms and the clock every 500 ms. Whether 30 fps on sub-pixel drift is visible is still the owner's call from a recording; the numbers say the per-step change at 30 fps is about what a 60 fps step shows today on a slightly busier frame.

**What this means for D5.**

- A 30 fps idle cap halves the phone's idle main thread (82.7 → 46.8% with the ring fixed; 97 → about 61% with it unfixed, **S**). Going to 20 fps buys only 6 more points; 15 fps buys 15 but runs into the `dt` clamp.
- Render-on-demand has a floor of 14.3% (phone) / 3.1% (desktop) with the loop off, but the scene is never static: motes, sway, a 10 Hz portrait and a 2 Hz clock. True on-demand degenerates into "render at the portrait's 10 Hz" at best, about 25% on the phone (**S**, interpolated), and freezes the motes and sway between invalidations. Use it only under `prefers-reduced-motion`, where freezing them is the point.
- Interaction is not helped by any cadence: with the pointer moving the phone is at 94–99% at both 60 and 30. Per-frame cost (G4, G7/G8, G9) is what helps interaction.
- Pointer parallax must become time-based and the 0.05 s `dt` clamp must be raised or bypassed while idle, or the throttle changes the feel of the room.
- On 90/120 Hz phones, "every second vsync" means 45/60 fps; schedule by elapsed time with hysteresis, not by frame count.

## Revised ranked list

Savings are not additive across experts; link-time figures are desktop GPU-process numbers unless labelled otherwise. None of these needs a Blender re-bake.

1. **G1 — ship the environment map as an 8-bit sRGB cubeUV WebP, size 256, q95; drop runtime `fromScene`.**
   - Saving: 1.4 s of forced-sync compile and the six face renders on desktop (**M**); on the emulation J's 1.6–1.7 s of shader-related GL inside PMREM; Android unknown but the GGX convolution is the largest shader in the room. GPU memory −3.1 MB kept, −6.3 MB transient (**S**). Wire +44.5 KB (**M**), about 0.2 s on the phone link (**S**). Removes the duplicate no-envMap compiles.
   - Risk: low on appearance (66–74 dB lossless, 52–64 dB q95 on the rendered frame; owner approves `shots-r2/`). Medium on process: the map must be exported from the engine's capture point, or the look drifts (32 dB from a careless re-capture). Anything that changes the room's look, including A's repacking, means re-exporting; add it to A12's script as a headless step with a hash check.
   - Effort: S–M (export hook behind a dev query or env flag; loader with `CubeUVReflectionMapping`, `SRGBColorSpace`, `flipY=false`, no mipmaps; keep `fromScene` as a fallback only if the fetch fails).
   - Re-bake: no. Verify: PSNR ≥ 50 dB on the four views against the current build; `gl` log shows no `PMREM*` links and 7 fewer programs; no `RGBA16F` 768×1024 allocation; Game Boy, screen cover and cube side-by-sides approved.

2. **G3 + G4 + G5 — 30 fps idle cap, lazy trail, START ring on the compositor.**
   - Saving: phone idle 97% → about 45–50% main thread; desktop 15–20% → about 10% (**M** for the cap and the ring via injection; G4's 1.5 ms per phone frame is **M1**). Full rate on input, GSAP, drag, cut, water, dive and return; reduced-motion gets on-demand with frozen motes.
   - Risk: low–medium; motion judged by the owner from a 60-vs-30 recording; the `dt` clamp and parallax lerp must be made time-based first.
   - Effort: S–M. Re-bake: no. Verify: renders per second counted from inside the loop (not rAF rate), CPU windows as in `d5.mjs`, side-by-side recording, interaction still at full rate.

3. **G9 + J2 — compact foliage layout, J's order.**
   - Saving: 1.80 MB exact (integer IDs), 8.29 MB with packed normal/colour, 12.61 MB with quantised positions (J, **S**); per-frame vertex fetch 20.2 → 7.6 MB (**S**). No generation-time saving claimed.
   - Risk: medium–high (clumps, sway, outline mask, saved growth). Effort: M. Re-bake: no. Verify: attribute hashes for the exact step, owner comparison for packing, trim/water/regrow/turntable and outlines on the foliage.

4. **G10 (loader half only) — lightmaps and portrait through `ImageBitmapLoader`.**
   - Saving: 0.3–0.5 s of phone main thread after A7/A8 (**A**, from M1 scaled by pixel counts); nothing on the wire. Resizing room-lamp/bed-lamp is withdrawn.
   - Risk: low (orientation/channel per L). Effort: S. Re-bake: no. Verify: no `texImage2D` decode time in the trace; lightmaps identical pixel-for-pixel to the TextureLoader path; portrait upright.

5. **G7 + G8 — cube as instanced meshes; merge static baked meshes per lightmap group and material.**
   - Saving: 164 → about 70 draws; 3–5 ms per phone frame (**A**, not re-measured this round). Helps interaction, which no cadence does.
   - Risk: medium (picking via instanceId, outline selection, per-thing uniforms, no merging of movable things). Effort: M. Re-bake: no. Verify: draw count from the `gl` hook, hover and cube picking, lantern tint on merged groups.

Then: **G11** (one or two programs, 0.25–0.5 s forced-sync here; more valuable on Android), **G12** backface culling on closed meshes (still **A**; measure on the device), **G13** adaptive DPR as a safety net, **G14** cheaper outline mask. **G2 is merged into J1** (submit compile early, warm the screen-map, clump and mask/outline variants). **G6** page-phase CSS stays as written; the ring number above is its first measured piece.

## Open disputes for round 3

1. **D2 export method.** G1 is approved only as "export the engine's own texture"; whoever writes A12 should decide whether the export is a build step (headless Chrome in CI) or a committed asset regenerated by hand with a hash check. Fallback policy if the WebP fails to load: keep runtime `fromScene` (keeps PMREM code in the bundle, which J notes stays anyway) or ship without reflections.
2. **D3 Android compile cost is unmeasured.** The emulation's shader seconds are desktop ANGLE/FXC. The first USB session should log per-program first-use stalls with J's passive wrapper on a fresh browser process, then again on a warm shader cache. Also decide whether production sets `renderer.debug.checkShaderErrors = false` (moves the query, does not remove it).
3. **D5 cadence.** 30 fps idle is my proposal; the owner may accept 20. Both need the `dt` clamp change. Touch devices with the pointer down are "active", so the phone's interaction cost is a G4/G7/G9 problem, not a scheduler one.
4. **D4 colour precision.** Linear UNORM8 vs sRGB-encoded bytes for the foliage colour; decide after the owner's dark-green comparison.
5. **D7.** My 2–2.5 s share of the all-tracks delta is assumed from measured components; it needs the combined scratch build that L asks for.
6. **D8 GPU specifics to add to L's protocol:** record `GL_RENDERER` from `WEBGL_debug_renderer_info` and `chrome://gpu` (and which ANGLE backend: GLES or Vulkan), `getExtension('KHR_parallel_shader_compile')`, first-process vs warm-cache runs, renders per second counted inside the loop, and GPU time through `EXT_disjoint_timer_query_webgl2` where the device exposes it (many Android builds do not). No battery claim without a power measurement.
7. **A3 quantised accessors.** Whether A's packing script adds `quantize` before `draco`; it changes GPU buffer sizes, not wire bytes, and DRACOLoader must produce the integer typed arrays.
