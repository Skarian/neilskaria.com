# Room performance plan (adjudicated, 2026-10-10)

The panel: A (3D assets, Fable), L (loading, Astra), G (GPU/runtime, Fable), J (JS/startup CPU, Astra). Three rounds; the evidence is in `r1-*`, `r2-*` and `r3-*.md` in this folder. **Plan only.** Nothing is built until the owner approves.

**Labels.** **M** = measured. **A** = assumed or forecast. "Phone" means the emulation: 412×915, 4× CPU, 1.6 Mbps / 150 ms RTT, desktop GPU. It is not a real Android phone.

## Where it lands

| | Today (M) | After assets (M, scratch build) | After assets + loading (A) | After everything (A) |
|---|---|---|---|---|
| Phone: room ready (START) | 42.7 s | 19.0 s | ~15.5 s (15–17) | ~13.5 s (13–15.5) |
| Bytes before the room | 6.55 MB | 2.33 MB | ~2.17 MB on Vercel | ~2.17 MB (~1.95 MB if the brotli GLB passes its gate) |
| Desktop START | ~4.4 s | 2.9–3.6 s | — | ~2 s (A; G1 alone removes ~1.4 s of compile here) |
| Phone idle, main thread | 70–93% (ring on, 60 fps) | unchanged (M; the earlier "65%" was host noise) | — | 40–56% (M, injected 30 fps cap + fixed ring) |
| Desktop idle | 14% | 11–14% | — | ~6–7% (M, injected) |
| GPU buffers | 32.8 MB | 27.7 MB | — | ~19 MB (foliage compaction, arithmetic) |

The 4G byte floor alone after the asset track is about 11 s. The rest of the 13.5 s is JS, shader compile and texture upload. A real phone may differ in either direction; its shader compile times are the biggest unknown.

## Settled disputes
- **Lightmaps.**
  - Default is **v4**: WebP q95 sharp-YUV for the three lossless maps, the wall pair at 1024², room-lamp and bed-lamp at 512². Total 500 KB, against 1,582 KB today.
  - Fallback is **v3** (582 KB). G's 400 KB claim for the 512² maps was wrong; the real extra saving is 82 KB.
  - AVIF is deferred to the next bake: it saves only 92 KB more, decodes slower, and needs a second set plus a detection probe.
- **Bonsai.**
  - Re-encoding the GLB moves the five twig roots by 1–2.5 mm. Freeze them as data in `bonsai-roots.json`. Exact identity and saved-tree replay are already proven in scratch (M).
  - The "canopy rearranges" claim was withdrawn. The close-up differences came from `viewOf()`, which samples framing points by vertex index, so any re-encode moves every close-up by 0.1–1.6 mm. That gets fixed too.
- **Geometry.** Keep Draco at 14-bit positions (meshopt loses even with brotli). The final GLB is 1,184,060 B, from 4,055,756.
- **Idle drop.** The 88% → 65% drop from the assets alone was host variance (controlled A/B, M). The assets cut GPU work (24% fewer triangles, half the texels), not main-thread work.
- **Shader compile.**
  - The parallel-compile extension exists on about 0.2% of Android devices. The plan for Android is ordering: submit every program in one batch, do the CPU work, then make the first-use draws behind the loading screen.
  - `compileAsync` already exists, so G2 is merged into J1.
- **Dropped:**
  - L6 (low-res lightmaps first): visibly soft, and pointless once the maps are 500 KB.
  - meshopt and KTX2/Basis.
  - Service worker.
  - Bonsai worker: only if a measured task still exceeds 50 ms on the phone after compaction.
  - The lamp-map size cut (G10 resize): now part of v4.
  - The JSON diet (−16 KB).

## The plan, in phases (each ends with a local commit)

### Phase 0: correctness and contracts (no visible change)
1. **J0 frozen bonsai roots.** `src/lib/boot/assets/bonsai-roots.json`, versioned. Remove the index sampling. Keep the `bonsai-shoots` storage key and format. Validate the saved payload completely before applying it (today a short payload produces NaNs).
2. **`viewOf()` and hull sampling, vertex-order independent.** Box corners plus neat foliage nodes, or a sorted sample.
3. **Bonsai hover-outline fix.** Today the outline traces the *overgrown* canopy, because the mask pass's override material skips the foliage's growth hook (`review/bonsai-outline-bug.png`). Give the foliage its own mask and occluder materials.
4. **`clump()` keeps `normalized`** on sliced attributes.
5. **Dev-only stage marks and the passive GL timing hook,** for measuring every later phase.

Verify: J's identity tests (twig hashes, 910 shoots, length arrays at 0/2/30 days) on the shipping model and the 14-bit candidate; a malformed-payload test.

### Phase 1: the asset track (−4.3 MB; phone 42.7 → ~19 s, measured)
All of this goes through a reproducible `assets/3d/pack.mjs` (A12) run after export. **No re-bake.**
- **A1/A2:** embedded albedos to 512² WebP q85; BonsaiWood 1024²; plant leaf set OPAQUE; tiny PNGs (the sky) stay lossless. **−2.05 MB.** This includes the plant-texture bug: the old halving loop skipped the `plant` group.
- **A7/A8/G10 sizes:** lightmaps v4 (v3 if the owner prefers). **−1.08 MB.**
- **A3/A5/A6:** a single Draco pass at 14/10/12; drop unused UV sets; simplify the duvet, sheet, curtains, pot, soil, moss and clock wheel. Carry the exported bounds through; the root validator rejects anything off by more than 0.05 mm. **−0.82 MB.**
- **A9/A10:** portrait as lossless WebP (240 → 14 KB, pixel-identical); chime mono with the cover art stripped (117 → 56 KB). **−0.29 MB.**
- **L9:** Draco decoder imported with a hashed URL (the files are byte-identical to three's copy) and preloaded as the engine chunk starts.

Verify: re-run the asset-only measurement; camera-pinned before/after pairs; every panel opens.

**Owner sign-off needed:** the lightmap flip test, the albedo grain on wood/pot/leaves, the cloth simplification, the clock close-up.

### Phase 2: the loading graph and lifecycle (~19 → ~15.5 s, assumed)
- **One cancellable graph** (L2/L5/J3/J4):
  - a URL-only manifest imported early
  - the GLB and Draco fetched alongside the engine import
  - then two image slots (no per-group waits), with the chime and env map early
  - fetched bytes reused, with bounded decode and upload
  - bonsai and hulls built while images still download
- **An exit that works before the engine exists** ("Continue to site"), honest loading stages, and Save-Data handled on first visits (L3).
- **Returning visitors (owner decision 2026-10-10: keep today's full background preparation, so entry stays near-instant).** Make it genuinely non-blocking:
  - Split the preparation into small steps that yield between each other (J1).
  - Phase 3's ready-made reflections remove the largest single block, the 0.8 s reflection shader.
  - Verify with a scroll test during the preparation: no task over ~100 ms on the phone emulation.
  - L4's bytes-only variant is dropped.
- **SKIP during loading:** the existing SKIP pill is shown on the loading screen, but it does nothing until the room has finished loading (`engine?.skipToSite()` with no engine yet). Make it work at any moment. No new control.

Verify: one fetch per asset, no group staircase, exit/abort/failure/retry, the chime at the earliest START, matched cold traces.

### Phase 3: startup GPU and CPU (~15.5 → ~13.5 s, assumed)
- **G1:** ship the environment map as an 8-bit cubeUV WebP, size 256, exported from the engine's own capture point (+44.5 KB). Runtime PMREM goes away: about 1.2–1.5 s on the phone emulation (M stages, S arithmetic) and ~1.4 s on desktop, plus 7 fewer shader programs. **Owner sign-off:** the reflection pairs `review/env-*` (Game Boy shell, screen cover, cube). The pack regenerates it whenever the room's look changes.
- **J1:** set the final material state first, then one compile batch submitted *before* the CPU-only work. Warm the lazy variants (screen-on, clump, outline mask/occluder) behind the loading screen; mark START only after the complete first frame.
- **G10 loader:** lightmaps and portrait through ImageBitmapLoader, which takes ~0.4 s of decode off the main thread.
- **J5:** precomputed picking hulls from the pack (~0.1–0.2 s).
- **J2/G9 step 1:** a direct typed-array writer and exact integer IDs for the foliage (−1.8 MB GPU, pixel-identical).

**USB phone session (owner decision 2026-10-10): a final check after everything is deployed, not a mid-plan step.** Phase 5 items are therefore chosen from the emulation numbers. Anything uncertain waits for that final check.

### Phase 4: running cost (phone idle ~85% → 40–56%)
- **G5:** the START ring rotates a painted gradient with `transform`, so it no longer repaints every frame (10–23 points on the phone). Looks identical.
- **G4:** the slash-trail canvas is only cleared when it drew something, and is created lazily.
- **Time-based parallax and turntable coast.** These are latent bugs today on any device below 60 fps.
- **G3:** 30 fps when idle, full rate on any input, tween, physics or transition, with 500 ms of hysteresis. Reduced-motion users get render on demand. 20 fps only if asked for after 30 is approved.

**Owner sign-off:** live flip with a `?idle=60|30` flag on phone and desktop, plus 60 fps recordings (previews: `review/side-60-left-30-right.mp4`, `review/side-30-left-30fixed-right.mp4`).

### Phase 5: per-frame GPU (only where the phone session shows it pays)
- **G9 step 2:** SNORM8 normals and 8-bit linear colour for the foliage (to 33 B/vertex, −8.3 MB GPU in total). **Owner flip test** on the dark interior greens.
- **G7:** the Rubik's cube as instanced meshes.
- **G8:** merge static meshes per lightmap group and material (163 → ~70 draws, ~3–4 ms per phone frame while interacting).
- **G11:** unify the Game Boy's clearcoat variants.
- **G12:** single-sided materials where the mesh is closed.
- **G13:** adaptive DPR as a safety net only.

### Phase 6: delivery (gated)
- **L8:** a pre-compressed brotli sibling of the GLB (−218 KB, ~1 s on 4G) through Vercel build-output headers. **It needs a Vercel preview deployment to verify, and that is the owner's call.** If the gate fails, fall back to A15: split the GLB's JSON chunk out as a separately compressed file (−78 KB).

## Separate from this plan
- The clock radio's grille ridges z-fight in close-up: a Blender fix at the next export.
- The next `SKIP_BAKE=1` export should turn Blender's Draco off and let the pack quantize once. Set the leaf/double-sided flags at the source too.
- AVIF lightmaps at the next real bake.

## Owner decisions
1. The lightmap flip test: v4 (default) or v3. Also the albedo, cloth and reflection pairs.
2. 30 fps idle: live flag plus recordings.
3. Returning visitors: DECIDED. Keep full background preparation, made non-blocking.
4. SKIP working during loading: proposed (no new control).
5. USB phone session: DECIDED. Final check after deploy.
6. Phase 6: allow a Vercel *preview* deployment to verify the brotli GLB, or skip it.

## Review material
- `shots-r2/index.html`: 27 lightmap/geometry pairs. Click to flip; ×8 difference images. Group 1 is v3 and group 4 is the v4 default.
- `review/env-before-*.png` vs `review/env-after-*.png`: the G1 reflection pairs (Game Boy, cube, bonsai; size 256, WebP q95).
- `review/glb-before-*.png` vs `review/glb-after-*.png`: camera-pinned bonsai and lantern close-ups with the full packed GLB.
- `review/side-60-left-30-right.mp4`, `review/side-30-left-30fixed-right.mp4`: idle cadence previews.
- `review/bonsai-outline-bug.png`: today's outline bug (left: no hover; right: hovered).
