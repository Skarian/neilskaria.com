# Room trim: reductions beyond the trim, bonsai unchanged (r1), 2026-10-14

Agent: implementation sub-agent, Claude Opus 5.5 (user override). This is a local experiment only. There was no deployment, no change to the current preview, no source integration, no commit or push, no install and no settings or account change.

Baseline: the trimmed preview model (P upload stage, 94 files). GLB 948,532 B raw, 755,491 B Brotli, SHA-256 `2df7922e…4335`.

## Result: best candidate `c2s-lower-pot01-leaves512`

| | Trimmed baseline | c2s | Change |
|---|---:|---:|---:|
| GLB raw | 948,532 | 881,512 | −67,020 (−7.07%) |
| GLB Brotli (precompress.mjs settings) | 755,491 | 688,868 | **−66,623 (−8.82%)** |
| 8 private lightmaps (WebP, as served) | 357,224 | 143,006 | **−214,218 (−59.97%)** |
| Affected download (GLB.br + 8 private maps) | 1,112,715 | 831,874 | **−280,841 (−25.24%)** |
| Room asset set (+ 571,892 B of unchanged assets) | 1,684,607 | 1,403,766 | −280,841 (−16.67%) |

Original (pre-trim) model to c2s: GLB Brotli 965,768 → 688,868 (−276,900, −28.67%). Affected download 1,322,992 → 831,874 (−491,118, **−37.12%**). Room asset set 1,894,884 → 1,403,766 (−25.92%).

The "unchanged assets" are props-day/lamp, env, portrait, gba-boot.mp3, boot-atlas.png and the Draco decoder files. They do not include the JS/CSS bundles (also unchanged). The WebP maps are counted as raw file bytes. The build Brotli-compresses only the GLB. That Vercel does not compress `.webp` again was not checked here. These are byte counts only. No startup, decode or FPS change is claimed, and no timing was measured.

What changed in c2s (`candidate.diff`; 9 of the 94 files):

- **SheetFold:** 9,712 → 776 triangles. Draco 31,767 → 5,328 B.
- **potted_plant_02 pot primitive:** 10,061 → 7,470 triangles (meshopt, error 0.01). Draco 111,790 → 91,495 B.
- **Embedded pot image:** 512 → 256 px. 28,008 → 7,732 B.
- **Leaves primitive and leaf image:** not changed (byte-identical).
- **Private lightmaps, each at half its current size:**
  - bed-day 1024 → 512 (58,970 → 27,934 B)
  - bed-lamp 512 → 256 (34,702 → 12,666 B)
  - room-day 1024 → 512 (39,964 → 15,460 B)
  - room-lamp 512 → 256 (44,830 → 14,400 B)
  - wall-day 1024 → 512 (32,898 → 11,188 B)
  - wall-lamp 1024 → 512 (34,172 → 10,052 B)
  - plant-day 512 → 256 (70,112 → 31,634 B)
  - plant-lamp 512 → 256 (41,576 → 19,672 B)

  Only the resolution changed. There was no crop and no repack, so the UVs are still correct. No unused atlas area was removed.
- **Not changed:** props-day.webp, props-lamp.webp, boot-atlas.png, all code (JS/UI/shader/camera/atlas/bonsai), and lightmaps.json.

## Bonsai immutability proof (`validation/c2s-lower-pot01-leaves512.json`)

- **Binary:** 91 of the 94 bufferViews are byte-identical to the baseline. The only changed bufferViews are 4 (pot image), 79 (pot primitive) and 84 (SheetFold).
- **Bonsai primitives:** all 10 are byte-identical, each listed with its SHA-256: BonsaiSlate, BonsaiPot, BonsaiFoot ×4, BonsaiSoil, BonsaiMoss ×2, BonsaiWood.
- **Images:** 10 of the 11 embedded images are identical, including BonsaiSoil-albedo, BonsaiWood-albedo, Oak and ClockWoodgrain. Only potted_plant_02_pot_diff_1k changed.
- **JSON:** equal to the baseline, except the target accessors' count/min/max, the target Draco attribute ids and the bufferView offsets/lengths.
- **Decoded (glTF-Transform + Draco):** all 81 non-target primitives are equal value for value (indices and every attribute, including both UV sets and the normals). All 77 nodes are equal in matrix, extras and hierarchy. All materials are equal.
- **Built stages:** props-day/props-lamp keep the same content-hashed names in every build (`D4Qi5Pzz`, `D5g_V8QY`).
- **Negative control:** a GLB with the leaves changed makes the validator fail (`validation/negative-control-leaves-changed.json`).
- **Splice tool check:** the splice tool with no targets reproduces the baseline SHA-256 `2df7922e…` exactly.

Method: `tools/donor.mjs` decodes and re-encodes a throwaway donor with pack.mjs's Draco settings (14/10/12, encodeSpeed 1, decodeSpeed 5). `tools/graft.mjs` then copies **only** the target primitives' bytes and accessor fields (and the target images) into the untouched baseline bytes. There is no global re-encode in any candidate.

## Ladder and quality boundary

| Variant | Sheet tris | Pot tris (error) | Plant images | Private maps | GLB raw / Brotli | Affected download vs trim | Verdict |
|---|---:|---:|---|---|---:|---:|---|
| c1-balanced | 1,456 | 4,282 (0.05) | 512 | 1024 maps halved | 875,088 / 685,596 | −171,265 (−15.39%) | **Rejected:** pot broken (see below) |
| c2-lower | 776 | 4,282 (0.05) | 256 | all halved | 827,640 / 638,573 | −331,136 (−29.76%) | **Rejected:** pot broken, leaves soft |
| c3-aggressive | 388 | 4,282 (0.05) | 128 | all quartered | 811,428 / 622,396 | −440,355 (−39.57%) | **Rejected:** quality limit |
| c2r-lower-pot01 | 776 | 7,470 (0.01) | 256 | all halved | 857,396 / 664,667 | −305,042 (−27.41%) | **Rejected:** leaves soft |
| **c2s** | 776 | 7,470 (0.01) | pot 256, leaves 512 | all halved | 881,512 / 688,868 | **−280,841 (−25.24%)** | **Accepted** |

c2r and c2s are corrections to c2 that the closeups made necessary. They are not new optimization areas.

Quality findings:

1. **Pot geometry at error 0.05 (c1–c3) is broken.** The pot silhouette becomes faceted, and the rim has a notch and a gap (`compare/closeup-pot-ladder-plant-pot.png`, last column). Error 0.01 looks like the baseline. Error 0.02 (5,217 tris, about −38 KB Brotli) shows mild faceting and was not used.
   - The pot cannot go much lower safely: the lightmap UVs (TEXCOORD_1) split almost every vertex (16,311 split vertices on 8,708 positions, 482 parts). A UV-preserving simplifier stops at about 4,285 triangles whatever ratio is set.
   - Going lower needs collapses across UV seams (meshopt "Permissive"). That would break the lightmap mapping, so it was not tried.
   - The pot did not appear in any sampled app frame (only the leaves do). Its in-app visibility is therefore unproven. No new coverage pass was run.
2. **Leaves resist simplification.** With a locked border, 1,939 → 1,825 triangles only (60 separate cut-out cards; pack.mjs also skips them). They were left byte-identical.
3. **Leaf texture at 256 px (c2/c2r) is visible.** The veins blur in bonsai focus, where the leaves are close to the camera (`compare/zoom-desktop-focus-bonsai-plant-leaves.png`). At 128 px (c3) they blur in the room view too (`compare/zoom-desktop-on-room-center-plant-leaves.png`). c2s keeps the leaf image, and its leaf crops are at the noise level (0–7 px against 0–12 noise).
4. **Lightmaps at half size (c2/c2r/c2s) look right.** The bed, wall, floor and curtain crops look the same. Desktop crop counts are at or near the noise level:
   - wall behind the portrait: 125–183 px (baseline-repeat noise: 75–130)
   - bed: 0–9 px (noise: 8–51)
   - phone wall: 243–477 px (noise: 350–630)

   Known tradeoff: a slight softening of the lamp-light gradient on the wall behind the portrait. It is visible only at ×4 (`compare/zoom-desktop-on-room-center-wall-behind-portrait.png`).
5. **Quarter-size lightmaps (c3) leak.** A dark band appears where the headboard meets the wall, and the mattress edge darkens (4,612–5,336 px on the wall crop, against 75–130 noise). This is the quality limit for the lightmaps.
6. **SheetFold** keeps its shape at 776 triangles (`compare/closeup-sheet-front.png`). E measured at most 198 visible pixels for it in all sampled states.

## Visual and behavior checks

The T3 `preview_status` and `preview_open` tools reported that no preview automation host is available. All captures therefore used owned headless Chrome over CDP (E's `cdp.mjs`), with E's seed, storage, settle waits and fixture click points. Phone = 390×844, emulated in desktop Chrome (not a physical device). Desktop = 1280×800, DPR 1.

- **Static matrix:** each variant (including the baseline) at desktop and phone, lantern ON (default) and OFF (storage `lantern` level 0), five states each: centre and four pointer corners (parallax extremes). There are also two baseline repeat runs (lantern on) as the noise reference.
- **Full flow:** run on baseline, c2r and c2s at desktop and phone: lantern, clock radio, cube, bonsai and portrait focus open + Back, START → site, BACK TO THE ROOM.
- **Health:** all 28 sessions had 0 failures and 0 page errors. Every model request was `.glb.br` 200 `br`. The only console warning was the known `KHR_parallel_shader_compile`. Every Chrome closed with `Browser.close` (none forced). Every server was stopped through its own child handle. `.station` status was null in the baseline and the candidate alike (radio playback was not checked).
- **Full flow, c2s against the baseline:**
  - The site frame differs by 0 px.
  - Desktop bonsai focus differs by 2,177 px.
  - Phone bonsai focus differs by 10,541 px and phone lantern focus by 11,000 px. These are the known framing, sway and turntable variance.
  - The c2r desktop bonsai focus differed by 130,271 px because the tree turned differently. E recorded the same kind of variance (125,477 px). The model and the bonsai bytes are identical.
- **Comparison sheets:** `compare/<vp>-<lamp>-<state>.png`. Full views and ×2 named crops, columns baseline | c1 | c2 | c3 | c2r | c2s. Metrics are in `compare/metrics.json`.
  - Full-flow pairs: `compare/full-c2s-lower-pot01-leaves512-<vp>-<state>.png`.
  - Closeups: `compare/closeup-*.png` and `compare/closeup-pot-ladder-*.png`. These use inspection lighting, not the app's lightmaps.
  - Pixel counts were used only together with the noise reference and visual review.
- **Phone floor crop:** differences up to 884 px there come from the animated colour ring of the START button (`compare/phone-off-floor-bl-x2-brightened3x.png`), not from the floor.

## Failures and fallbacks (kept as records)

- No T3 preview host, so owned Chrome was used (see above).
- Two shell heredoc writes failed on quoting before any run. The Write tool was used for those files.
- The first closeup render recursed (wireframe added during traversal). `compare/closeup-failed-r1/` holds its logs. It was fixed and re-run.
- The first phone crops missed the target areas and were redefined from the baseline frames. The compare layout was fixed once.
- c1–c3 use the broken pot (error 0.05). This was found in the closeups and corrected in c2r and c2s.
- The lightmaps were resized from `assets/3d/export/*.webp` (read only), with pack.mjs encoder settings. The pot image was resized from the shipped 512 px WebP (q85), so it is compressed twice.
- No ID coverage pass was run for the plant pot or the new maps. That is outside this bounded check.

## Protection and cleanup

- `identity-before.json` matches `identity-after.json` (`validation/protection.json`, no differing keys). The comparison covers: HEAD d82230a, branch, refs, Git index, tracked file hashes, git status, ignore files, accepted source, shared node_modules metadata and junction targets, E/F/P digests (profiles excluded), the P upload stage and the policies.
- The baseline build was E's existing `candidate` stage, read only.
- New stages under `stages/` are copies of P's upload stage (digest `4eccb09b…` checked), with per-package junctions.
- After the work, no process had N in its command line (only the scan shells), and no listener was on 4491/4495/9951/9955.
- Profiles are kept in `profiles/`.

## Files

- `results.json`: all bytes, validation summaries, stage diffs, capture health and metrics.
- `candidate.diff`, `candidate-manifest.json`, `stages/<v>/manifest.json`: file manifests.
- `validation/`: per-variant protection checks, bytes.json, brotli.jsonl, delivery.jsonl, negative control, protection.json.
- `candidates/<v>/`: GLB, maps, donor/graft logs.
- `captures/`, `compare/`: screenshots and comparison sheets.
- `tools/`: every script used.
