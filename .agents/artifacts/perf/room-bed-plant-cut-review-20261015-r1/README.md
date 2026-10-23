# Review: room bed + floor-plant cut, stage 1 (r1), 2026-10-15

Reviewer: review sub-agent, Claude Opus 5.5 (user-selected). Read-only review of `R = ../room-bed-plant-cut-20261014-r1`.
I made no source, candidate, build, benchmark, deploy, Git or install changes. I started no child agents and no browser.
I made one local check, `leafcards.mjs` → `leafcards.json`. It decodes the baseline GLB through R's `decode.mjs` and reads `union.json` and `masks.json`.

**Verdict: OK to deploy `cut-d-ring2` as a preview.** Nothing blocks it. Three items to fix or add in stage 2 are listed below (F1–F3).
The README has one text error (Q1). It is not a bug.

## Checks that pass

- The hashes match the brief. The baseline GLB is `5110090d…5ed2`. `accepted/bedroom.glb` = `upload-stage/src/lib/boot/assets/bedroom.glb` = `715a3699…a059` (sha256sum).
- `accepted/validate.json`: pass, 0 failures.
  - All 76 non-target primitives are byte-identical and decode equal.
  - All 10 Bonsai primitives are identical.
  - All 11 images and 48 materials are unchanged.
  - The kept triangle sets match the plan exactly (0 missing, 0 extra).
- The triangle indexing is consistent. The browser `tripass` checksum for `potted_plant_02/1` (csIdx 41091176, csPos 41015.21) matches my Node decode of the baseline. `union.json.glb` points to D's c2s GLB.
- The bed/plant materials have no `MASK`/`BLEND` alpha. The app copies `alphaTest` from the source, which is 0. So the solid black occluders cannot hide anything that is see-through. All 7 targets are `doubleSided`, the same as the DoubleSide ID pass.

## Q1. "56 of 60 cards seen" vs 54 kept: a README text error, not a coverage bug

`leafcards.json` (welded-position components, the same definition as `plan.mjs`): there are 60 cards.
- 44 cards have a strict-visible triangle.
- **54 cards** have a margin-visible triangle.
- 54 cards are kept.
- Margin-visible but not kept: 0. Strict-visible but not kept: 0.

The 6 dropped components have 2, 2, 4, 42, 3 and 2 triangles. None of them has a seen triangle.
The number 56 is the kept-card count of `cut-a-r04-ring2`, where the 4 cm radius pulls in 2 neighbouring cards (`candidates/cut-a-r04-ring2/masks.json`).
Fix the README line to "44 strict / 54 margin of 60".

## Q2. Coverage method and the encoded candidate

- **Occluders:** I found no false-occlusion path.
  - The movers (bonsai, console, cube) are hidden, so they cannot occlude. That can only raise the counts.
  - Nothing is alpha-cut.
  - The ID pass uses the same layer-0 camera.
- **Independent check:** the A/B check uses the real materials and does not depend on the ID pass. Any ID-pass error at a sampled pose would show as an A/B diff.
- **Gap F1:** the A/B check renders the **planned index subset of the c2s vertices**, not the encoded candidate (`cutcheck.js`: `g.clone()` + `setIndex`).
  - The re-encode re-quantizes the kept vertices: position ≤ 6.1e-4 units (0.06 mm), TEXCOORD_1 ≤ 1.1e-4, normals 0 (`validate.json`).
  - At these scales this is sub-pixel. The SheetFold-on-Mattress overlap is the only place where a z-order flip is possible.
  - The encoded GLB was checked only by the production captures. Those are noise-limited: the room states are at the repeat noise level, and their diff boxes are not on the bed.
  - So "encoded = planned to the pixel" is plausible but **not shown**.
- **Bounds:** the accessor min/max shrink to fit the kept geometry and are still consistent (checked in the GLB JSON). The A/B kept the larger original bounds. Culling with correct bounds cannot remove visible triangles, so this is fine.

## Q3. 19 non-reproducing diffs in 46,215 poses: acceptable as limited evidence

- **Totals:** the 19 poses are 0.041% of poses. The identity control has 10 in 14,933 (0.067%), with the same Δ ≤ 15. None of the 19 reproduce: 5 repeats each, all 0, and per-cut attribution all 0 (`checks/repro/repro2-*-cut-d-ring2.json`).
- **The largest diff** (37 px, 1600×450, "fill to-clock 2/17") is on the Rubik's cube. The diff is black at replay (`checks/snaps/cut-d-superwide-to-clock-sheet.png`).
  - It is larger than any identity-control diff (max 12 px), so the noise floor is not fully characterised.
  - Its location clears the cut.
- **Sensitivity:** the method can find a 1 px leak. `cut-x-r0` gives 1 px on the pot at 820×830, 5 of 5 repeats, attributed to `potted_plant_02/0`. Ring-2 removes it.
- **Replay limits:**
  - The replay restores only the camera p/q, with the scene at rest and the lantern on. It does not restore focus/lantern-off/bare-bonsai state, sway, or the recorded fov.
  - The per-frame "room …" poses are therefore approximate replays. The "fill" poses replay closely.
  - Only the first 50 diffs per run are kept (`worst`). No cut-d run had more than 4, so nothing was lost.
- **What this shows:** strong sampled evidence at 9 sizes at DPR 1. It is not a proof for every pose.
- **Margin:** 2 rings past the 1 px boundary at the most extreme tested pose. That is a thin but real margin.

## Q4. App regression and untested ranges: no blocker for a preview

- **F2, phone-landscape lantern focus capture (180,807 px):** the candidate frame shows a different camera. The portrait painting and the clock are in view, and the UI panel is already up (`compare/cut-d-phone-land-on-r-focus-lantern.png`). The baseline repeat is 10,362 px.
  - It was **never recaptured**. The "-r" file only re-compares the same capture with the repeat.
  - The lantern framing reads only the lantern parts (`engine.ts` corner sets), and the fixture A/B for phone-land is clean. So the cut is very unlikely to be the cause.
  - **Recapture it at rest on the preview** (844×390) before you recommend a merge.
- **F3, untested ranges** (all low probability):
  1. **Pointer beyond the canvas during a bonsai/cube drag.** `pointermove` does not clamp, and pointer capture can report coordinates outside the canvas. In bonsai focus, the sway (0.35 × focusSway) can then go past the tested corners and the 0.1 eye offsets. The effect is transient.
  2. **Aspect exactly 1.** `startView` uses `aspect < 1` but the focus framing uses `aspect <= 1`, so 1:1 is a mixed case.
  3. **Aspect above ~3.9** (beyond 1600×450 plus the ×1.1 frustum margin).
  4. DPR 2 and real Safari/phones. ×2 supersampling only approximates DPR 2.

  The portrait extreme (aspect just under 1, 70° fov) is the worst start view, and it is covered by 820×830.
- **Could more be cut safely?** Not much under this method.
  - `cut-x-r0` (−66 KB) leaks.
  - A ring-1 variant between cut-x and cut-d is untested and would gain only a few KB.
  - The pot (56.5 KB Draco, the largest part left) is visible at the 820×830 extreme. More savings would need decimation, which changes what visitors see. That is a different risk class, out of scope.

## Q5. Is the merge worth it?

- **Certain:** −42,918 B Brotli on one asset that every room visitor downloads. Nothing else changes.
- **Not established:** any LCP, TBT, Lighthouse or decode/FPS effect. That depends on whether the GLB is on the critical path. About 2.6% of page bytes can easily fall inside Lighthouse run-to-run noise. Do not claim a speed gain until the matched runs show one.
- **Maintenance cost:**
  - The GLB is now a derived, hand-grafted asset. Any Blender re-export of the room drops the cut silently.
  - Any change to the camera (start views, focus framing, sway, a new focus object, new aspect logic) can expose holes, and no test guards against it.
- **To make a merge worth it, record:**
  - the provenance: base SHA, masks.json and the `plan`/`donor-cut`/`graft`/`validate` recipe, kept with the asset or referenced from it
  - a note that camera changes must re-run the coverage
- **Recommendation:** preview now. Merge if the matched Lighthouse/benchmarks show no regression, F2 recaptures clean, and provenance is recorded. Confidence: **medium**. It is high that there is no visible change at the tested poses. It is lower for untested ranges and for future edits.

## Evidence paths (relative to R)

`accepted/validate.json`, `accepted/masks.json`, `coverage/union.json`, `tools/{tripass.js,cutcheck.js,plan.mjs,validate-cut.mjs,repro2.mjs,compare.mjs}`, `checks/runs/*/result.json`, `checks/repro/repro2-*.json`, `checks/snaps/cut-d-superwide-to-clock-sheet.png`, `compare/cut-d-phone-land-on-r-metrics.json`, `compare/cut-d-phone-land-on-r-focus-lantern.png`, `candidates/cut-a-r04-ring2/masks.json`. App code: D `upload-stage/src/lib/boot/{engine.ts,baked-material.ts}`. Review check: `leafcards.mjs`, `leafcards.json` (this folder).
