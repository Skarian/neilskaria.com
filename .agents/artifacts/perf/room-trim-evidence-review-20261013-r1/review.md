# Review: room visibility trim experiment (r1), 2026-10-13

Reviewer: Claude Opus 5.5 (user override), read-only. Scope: the local experiment in
`.agents/artifacts/perf/room-visibility-trim-experiment-20261013/` (E). This review does not approve publication.

I did no browser runs, builds, tests, captures, installs, Git or deploy actions. I read the README, the inventory, the
candidate-model files, the manifest and diff, the tools, the fixture diff, the timing summary, the diff JSON for each
pair, and these images: `sidebyside/desktop-room-center.png`, `sidebyside/phone-focus-cube.png`,
`diffs/phone-baseline-vs-candidate/focus-{lantern,bonsai}.png`. I also read the material flags in the baseline GLB
JSON chunk with one read-only Node command, and I read the engine source in `E/baseline/source/src/lib/boot/`.

## Verdict

**Keep the candidate for a future targeted fidelity check. It is "not yet proven" for deployment. Do not reject it.**

- The byte and geometry claims are proven.
- "Never visible" is shown only for the sampled states, and only under an approximate ID pass. The largest
  approximation is the bonsai foliage. Most of the root's double-sided concern does not apply (see F1).
- The fidelity evidence is consistent with run noise. It does not prove visual identity.
- The timing evidence correctly claims no startup change.

There are no material blockers to keeping the candidate as a local result. Two README wording corrections are
necessary (C1, C2). Before any deployment, one small validation step is necessary (see "Smallest necessary
validation").

## Claims that the evidence supports

| Claim | Status | Basis |
|---|---|---|
| 20 nodes removed; only `bedroom.glb` changes | Supported | `trim.json`, `dropped-nodes.txt`, `candidate.diff`. The client hash lists differ only in the GLB name and the chunks whose hashes follow from it (renamed, one added, one removed). |
| Raw 1,183,392 → 948,532 (−234,860, −19.8%) | Supported | `trim.json`; the arithmetic is correct. |
| Brotli 965,768 → 755,491 (−210,277, −21.8%) | Supported | `compress.json`; the timed sessions served the same encoded byte counts. |
| Triangles 223,809 → 182,905 (−40,904); primitives 103 → 83 | Supported | `validate.json`, `inventory.json`. |
| 83 kept primitives and 11 kept images byte-identical | Supported | `validate.json`. There is no Draco re-encode, no atlas crop and no UV change (`trim.mjs` copies the bufferViews). |
| No external lightmap can go | Supported | `inventory.json` lightmaps: each one still has a kept user. |
| Headboard and mattress fill about 12–14% of the desktop view | Supported | `perState` desktop `bedShare`; the side-by-side image agrees. |
| 10 fewer warm-up draws | Supported by code | `engine.ts:903`: `warming` holds every visible layer-0 mesh from the scene traverse, and the loop draws two per step. The candidate has 20 fewer one-primitive meshes, so it has exactly 10 fewer steps. |
| 4 fewer texture uploads | Supported by code | The base-colour maps get no `initTexture` call. They upload at their first warm-up draw. The 4 dropped images have no kept user. |
| About 4.1 MB nominal texture memory | Supported as nominal only | The sum of the 4 `nominalGpuBytes` values (RGBA8 with mips) is about 4.115 MB. The real VRAM is not known. The README says this correctly. |
| About 1.03 s of link time at 1.6384 Mb/s | Supported as arithmetic only | 210,277 × 8 / 1.6384e6 = 1.027 s. It is not an observed startup gain and not a Lighthouse change. The README says this correctly. |
| No startup change shown | Supported | The two baselines differ by 794 ms (2,300.0 and 3,093.7 ms). This is more than any baseline-to-candidate difference. All 4 sessions are valid (Brotli, no raw fallback, 0 errors, BACK made no fetch). |
| Identity, cleanup, and no Git or deploy mutation | Supported as recorded | `verification.json` (no differing keys), `cleanup.json` (no forced kills, ports closed). I did not run the identity check again. |

There is one more probable saving that the README does not claim. The duvet's attributes are probably larger than
64 KiB, so the big-buffer `upload()` pass (`engine.ts:737`) probably has fewer steps. Do not claim this saving
without a measurement.

## Findings on the visibility method

**F1. Most of the double-sided concern does not apply. Record why in the README.**
In the baseline GLB, all 53 materials have `doubleSided: true` and `alphaMode: OPAQUE`. No material has a cutoff.
`bakedMaterial` copies `side`, `alphaTest` (0) and `transparent` from the source material. Thus, for every baked GLB
mesh, the ID pass's `DoubleSide` and solid fill agree with the real render. The fixture's `DoubleSide` on the 31
targets is also the real side. The materials that the engine replaces at runtime use `FrontSide`:

- Sky (a target, and removed)
- ShellRed and ScreenCover (the SP console)
- LanternPaper
- the clock display
- possibly the Rubik's cube runtime meshes (I did not check these)

All of these are closed, small props on the nightstand. The camera does not see their back faces in any sampled
view, so the `DoubleSide` change cannot make them hide a removed node. There is no `alphaTest`, `discard` or
`alphaHash` in the boot code. The skip of transparent meshes and points only removes overlays, such as the clock
glass at 0.08 opacity, dust, the trail and soft shadows. This makes the ID counts an upper bound. It does not cause
false occlusion.

The gap: the experiment did not record any of this. Add the per-material side and alpha table, or a reference to
this review, before the zero-pixel result is used again.

**F2. The bonsai foliage is the real approximation, and it is larger than the README says.**
The README says that the black foliage has no "vertex sway". The foliage shader (`bonsai.ts:143–170`) also moves
each vertex to its growth position with `clamp(reach − node, 0, 1)`. The foliage geometry holds the space for all
future growth. With plain black material, the ID pass draws the foliage at its full potential size, so the foliage
can cover more than the visitor sees. The sway is at most about 4 mm, so the growth transform is the larger effect.
The shoots mask and shoots occluder use only layers 3 and 4, so the layer-0 ID pass skips them correctly.

Relevance: the foliage is in front of the lantern and the right wall. Both are kept, opaque and double-sided, and
they would hide anything behind them in the real render too. A removed node could be hidden only by the foliage if it
sat between the foliage and those surfaces. No removed node appears to be there. But the experiment did not record
which object covers which pixel, so this point is probable, not proven. In bonsai focus, Sky is in the frustum in all
4 viewports, and WallLeft and Sill are in the frustum on wide and ultrawide.

**F3. Coverage is sampled, not continuous.**
The 100 states use 4 viewports, 6 boot times and 6 BACK times. The camera moves between those times, and those
poses are not checked. These were not sampled: phone hand turns, cube and bonsai turns, pointer drags, window
resizes, aspect ratios above 2.37, and phones narrower or taller than 390×844. These dropped nodes are often in the
frustum with zero pixels, so the gaps are most important for them:

- WallLeft: 70 states
- Sill: 67 states
- Duvet (26,240 triangles): 51 states
- Curtain0: 45 states
- BedLeg3: 22 states
- Cushion: 18 states
- Rug: 11 states

BedFrame and SheetFold are kept. They show only in a few phone states, so the phone framing comes nearest to the
removed bed parts. Untested phone aspect ratios are the most probable place for a lost pixel.

**F4. Some superseded data is still in E.**
The root `coverage.json`, `captures/fixture-desktop-r3`, `fixture-phone` and `fixture-wide-r2` hold incorrect
colour-classification counts, and the README says so. `sidebyside/*` column 3 is the screenshot ID view, not the
exact ID render. In `desktop-room-center` it also shows a different clock minute. It is only an illustration. Do not
use it as evidence.

## Findings on fidelity

**F5. The desktop bonsai outlier is a run effect, but the cause is not isolated.** The candidate-vs-candidate
difference at bonsai focus (128,064 pixels) is the same as the difference between the first candidate run and each
baseline (125,477 and 127,996). The repeat candidate run is at baseline noise (13,439 against 13,872). Thus the
first candidate run is the outlier. The trim is not the cause. The exact cause (turn angle or timing) is still not
known. The README's sentence "The cause is run-to-run variance, not the trim" says more than the data shows. Change it
to "consistent with run-to-run variance; cause not isolated."

**F6. Phone focus differences have no phone control.** I examined the difference images. `focus-lantern` (15,368) and
`focus-bonsai` (45,522) show thin edge outlines over the whole lantern and the whole tree, plus dust. There is no
filled region, which a missing or added surface would make. The bed is not in either view. This pattern agrees with
a small pose or timing offset. It is not a trim signature. A phone baseline-vs-baseline pair is still missing.

**F7. No perfect identity.** The seeded `Math.random` does not freeze the clock, the sway, the dust, the portrait
water or the screenshot timing. The data supports "no visible change found in the sampled states". It does not
support pixel identity.

## Necessary README corrections (wording only)

- **C1.** Change "Lost visible pixels: 0 in every sampled state (exact object-ID render)" to: "0 ID pixels in every
  sampled state. The ID pass is exact for pixel IDs, but the occluders are approximate: the bonsai foliage is drawn
  at its full growth size without sway, transparent layers are skipped, and runtime FrontSide props are drawn
  double-sided." Add the F1 material facts.
- **C2.** Change "20 nodes never put a pixel on screen" to "20 nodes put no ID pixel on screen in 100 sampled
  states." Change the F5 cause sentence as given there.

## Smallest necessary validation (before any deployment; not needed to keep the candidate)

Use the existing fixture and `idcount.js`. Add no new optimization and change nothing in startup.

1. **One conservative ID-pass change:** hide the bonsai foliage meshes (and the twigs and clumps) in the ID pass,
   the same as transparent meshes. Do not paint them black. Fewer occluders can only increase the counts. If the 20
   nodes stay at 0, F2 is closed without a match to the real shader.
2. **Dense paths on two viewports:** run that ID pass on every frame, or every ≤50 ms, through the full boot and the
   full BACK, on desktop 1280×800 and phone 390×844 only. This closes the gap between the sampled times.
3. **Two aspect ratios at the edges:** run the static room, the parallax corners and the five focus states once at
   one narrow phone size (for example 360×800) and once at one aspect above 2.37 (for example 1280×500). This closes
   the framing gap that is most likely to show the bed.
4. **One phone control:** make one phone baseline-vs-baseline fidelity pair, so that the phone focus differences
   have a noise reference.

Accept the candidate if all 20 nodes stay at 0 ID pixels and the phone differences stay within the phone baseline
noise. If any node shows pixels, keep that node and trim again. Do not reject the whole candidate.

Do not treat these as blockers: hand turns and cube or bonsai turns. They rotate the object, not the camera. Some
risk remains, but it is low.
