# Round 2 · A (Fable) · 3D assets and their formats

Plan only; the repository changes are this file and the owner's review set in `.agents/artifacts/perf/shots-r2/` (open `index.html`, hover a picture to flip BEFORE→AFTER). Scratch work: `%TEMP%\perf\scratch\A\` (`shots2.mjs` deterministic screenshot harness, `stats.mjs`/`stats2.mjs`, `decode.mjs`, `publish.mjs` + `pairs.json`, `lm/` lightmap sets, `gt/` glb candidates, `shots2/` + `diffs2/` captures and ×8 differences, `timing/` scratch-build traces, `site/` a copy of the repository built and previewed on :4199) and `%TEMP%\perf\scratch\tools\geo2-A.mjs`, `geo3-A.mjs`, `geo5-A.mjs`, `order-A.mjs`. Port 4173 was only ever read.

Labels: **M** measured here, **M1** measured in round 1, **S** simulated or arithmetic on measured inputs, **A** assumed.

**Headlines.** (1) The asset track alone, measured on a scratch build with the existing serial loader: phone room-interactive **42.7 s → 19.2 / 18.9 s**, 6.55 MB → 2.33 MB; desktop 4.4 → 2.9–3.6 s. (2) Every lossy lightmap encoding tested is within max 25/255 and under 0.35 % of pixels over 8/255 in the hardest close-up at lantern extremes; the ladder goes 582 KB (WebP) → 409 KB (AVIF q80) for a set that is 1,582 KB today. (3) Draco stays, corrected to **14-bit positions**: at 12 bits every silhouette in the room shifts by a sub-pixel amount; at 14 a pure re-encode is pixel-identical. (4) Two things block A3 until fixed on the engine side: the bonsai's twig roots are sampled by wood vertex index, so *any* re-encode re-arranges the canopy; and my round-1 size left out the cube meshes the engine needs (L's catch). (5) G10's 512² lamp maps are rendered-indistinguishable from 1024²; my round-1 objection rested on an atlas metric and is withdrawn as a visual claim.

## Critiques

### L — loading

- **Agree, and thank you for the extension-registration catch.** My round-1 `v8.mjs` registered `KHRONOS_EXTENSIONS` only, so the WebP images were written without `EXT_texture_webp` and the "meshopt" file was merely quantized. Every geometry number here comes from a rerun with `ALL_EXTENSIONS`; the meshopt file now declares `EXT_meshopt_compression` with 252 compressed bufferViews (M). Round 1's 1,047,676 B figure is withdrawn for a file the engine can start from (Cube* and ClockDigits kept, BonsaiWood at 1024²): **1,086,708 B at 12-bit, 1,163,728 B at the 14-bit I now recommend (M)**; L's 22 KB allowance was 17 KB short of the first and 95 KB short of the second.
- **Agree that A11's reasoning was too narrow.** Both codecs are now compared pre-compressed with brotli-11 and with their decoders (experiment 3). Draco wins by 388 KB with static compression and by 1.35 MB without; the decision does not depend on which Vercel behaviour is true.
- **Agree: drop L6.** The half-resolution set (v5) is visibly softer in every close-up (experiment 1): the provisional picture would not pass the owner's bar, so it cannot be the first thing shown, and with the final set at 409–582 KB the 243 KB low pass delays the real picture by more than it advances a provisional one (L's and J's arithmetic).
- **Agree on A10/J4 overlap.** I claim the chime's 60 KB only; the removal of its serial position is L2/J4's.
- **Partly disagree on "both layers present at first finished display" as a constraint on *my* track.** Right for L6, not a reason to hold A13/G10's off-thread decode: the day and lamp maps of a group are two fetches today and `baked-material.ts` already waits for both before building the material; decoding them off-thread changes nothing about when they appear together.
- **L8, measured on the corrected candidate:** 1,086,708 → 880,363 B brotli-11, **−206 KB (M) ≈ 1.0 s (S)**; roughly a third of it is the 87,692 B JSON chunk (accessor and mesh definitions for 103 primitives compress to ~12 KB), the rest is the WebP and Draco payloads yielding a few percent each. Worth L's disposable-deployment test. If Vercel will not serve it, shortening the JSON itself (no `min`/`max` on non-position accessors, shorter names) is worth perhaps 30–40 KB (A) with no CDN cooperation. Low priority either way.
- **L4/L3:** no overlap; agree. L4's "bytes only while reading" makes the asset sizes matter twice (background download on the page too), which strengthens A1–A9.

### J — JavaScript and startup CPU

- **Agree on the BonsaiWood sampling fragility, and it is worse than "may change".** `bonsai.ts` builds `woodPoints` from every third BonsaiWood vertex and attaches twigs at the nearest of those points. Measured (experiment 4): the Draco JS encoder *deduplicates* vertices (30,798 → 29,293) and reorders them, so 15 % of the sampled points survive a re-encode; meshopt keeps the count but `reorder()` keeps 0 %. Weld, simplification and the codec all do it; so would Blender's own Draco path on the next export. The canopy visibly re-arranges (experiment 5, bonsai pair). I agree with J's fix, stable sampling by a hash of the quantized position or attachment points shipped by the packing script, and **A3 waits for it**; BonsaiWood is excluded from weld and simplification in my script so only the codec's reordering remains to be made harmless.
- **Agree on A11 and on "compare the same final geometry".** Done: identical prepared document, only the codec and decoder differ (experiment 3).
- **Alpha mode, related to A1:** the leaf material is `alphaMode: MASK, cutoff 0.5` although the shipped PNG has no alpha channel and the geometry is already cut to the leaf outline (M). The packing script should set it `OPAQUE`: one fewer `alphaTest` variant for G11, no masked-fragment cost on the phone.
- **E4:** agree that after A1–A10 script bytes are 12–15 % of the budget and bundle surgery is third-order. One asset-side note: `PMREMGenerator` is pulled in by `WebGLRenderer` itself, so G1 removes work, not code; expect no byte saving from it.
- **J5 belongs in the packing script (A12).** Hulls must come from the *packed* geometry (after simplification) or pick volumes and rendered meshes drift apart. I will own that hook if J supplies the hull format.
- **D1/L6:** same reading as mine; experiment 1 has the sizes.

### G — GPU and runtime (round-1 proposals; no round-2 file yet)

- **G10's sizes: corrected to 1024² by everyone, and then rendered.** The 512² room-lamp and bed-lamp (v4) are indistinguishable from 1024² (v3) in every close-up and wide view (experiment 1), because the room group's lamp layer is scaled by 0.028 and the bed's by 0.18 (`lightmaps.json`): faint even at brightness 1.5. My round-1 "41 dB, max 115/255" was true of the atlas and misleading about the picture; withdrawn as a visual claim. What remains of G10's byte claim is −82 KB (not −400 KB) and two fewer 1024² decodes, gated on the owner's wide red-1.5 pair.
- **G10's loader half / A13: agree, keep.** The v3 set needs 37 % less decode time than today's and the v8 AVIF set 20 % less (experiment 2); what moves off the main thread is ~0.4–0.6 s at 4× (A). Keep `flipY=false`, `channel=1`, `imageOrientation:'none'`.
- **G1:** a size-128 cubeUV texture is 384×512 px: 25–50 KB as lossy WebP q90 (A), ~120 KB lossless (A). 8-bit sRGB clips the lantern paper and LED highlights the clearcoat picks up, so compare the Game Boy shell at brightness 1.5; and regenerate it in the packing step after *any* asset change (A2's 512² albedos change the captured room).
- **G12 needs no re-export.** All 53 materials are `doubleSided: true` (M); it is a material flag in the glb JSON, so the packing script can clear it from a list (shell, buttons, clock plastics, nightstand, frames, pot, lattice bars) and keep it for cloth, leaves, curtains, lantern paper. Zero bytes, zero re-bake; G measures the fragment saving.
- **G9 + J2:** no overlap with the glb; same principle as A6 (nothing in the vertex stream no shader reads).
- **G2/G11:** outside my area; note only that A2 removes ten 1024² albedo decodes and A7/A8 two 2048² lightmap decodes from the startup task J measured, so re-measure G2 after the asset track. The phone idle CPU also fell with no runtime change (experiment 6), which G/J should explain before booking G3's saving against the baseline.
- **KTX2 "tempting but wrong":** agreed, nothing to add.

## Experiments (method, result)

All screenshots: `shots2.mjs`, headless Edge (ANGLE D3D11, RX 590) against the untouched preview on :4173, first visit with storage cleared, `Math.random` seeded, lantern colour/level written to localStorage before the page runs, and the candidate files served at the network layer through CDP `Fetch.fulfillRequest` (lightmaps matched by `<group>-<state>.<hash>.webp`, the glb by `bedroom.<hash>.glb`). After START appears (and after any click) the harness waits until consecutive captures agree, then freezes `Date`/`performance.now`/rAF timestamps and captures. Runs are serial. Desktop 1280×800; phone 412×915 @2.625. Statistics: max channel error, share of pixels over 2/4/8/16, PSNR, ×8 difference image.

**Noise floor (M).** Two control runs with nothing swapped: close-ups (portrait, lantern, clock, bonsai) differ by max 4–5/255 with **0.000 % of pixels over 8**; wide views by 0.10 % (the clock LED and a few motes). Round 1's cancelled parallel runs did not have this property (the camera tween had not settled under CPU contention); every number below is from the serial runs. Known residual noise sources: the LED digits, motes, the radio sometimes powering on in the clock view.

### Experiment 1 · D1: lightmap encodings, rendered

Sets (M, bytes); shipping lighting set 1,582,192. Candidates replace only the files listed; other maps stay as shipped.

| Set | Files replaced | Set total | Saving |
|---|---|---:|---:|
| **v3 = A7 + A8** | room-day/room-lamp/props-lamp WebP q95 sharp-YUV (42,704 / 111,430 / 107,648); wall pair Lanczos 2048→1024, q90 (36,474 / 36,600) | **582,124** | −1,000 KB |
| v4 = v3 + G10 sizes | + room-lamp 512² (47,330), bed-lamp 512² (33,064) | 500,374 | −1,082 KB |
| v7 = q90 sharp-YUV | the same five at q90 (25,244 / 68,032 / 72,740 / 15,818 / 17,030) | 496,780 | −1,085 KB |
| **v8 = AVIF q80 4:4:4** | the same five as AVIF (11,902 / 40,166 / 45,469 / 5,247 / 6,148) | **408,848** | −1,173 KB |
| v2 = AVIF q90 all ten | every map re-encoded from the shipped WebPs, wall at 2048² | 660,073 | −922 KB |
| v6 = plain q92 4:2:0 | the three lossless maps at the pipeline's existing lossy setting (24,652 / 71,548 / 80,914) | 496,206 | −1,086 KB |
| v9 = A8 alone | wall pair only | 1,467,544 | −115 KB |
| v5 = half resolution | every map at half size (L6's low pass) | 243,216 | provisional only |

Atlas PSNR against the bake output (M): q95 sharp 46.4–49.8 dB; q90 sharp 44.4–48.8; AVIF q80 46.4–49.5; plain q92 44.5–47.8.

Rendered against the control (M): max channel error / share of pixels over 8. Close-up noise floor 5 / 0.000 %; wide 0.10 %.

| Set | Lantern, blue 1.5 | Lantern, red 1.5 | Portrait | Portrait, blue 1.5 | Clock, warm | Clock, blue 1.5 | Room, blue 1.5 |
|---|---|---|---|---|---|---|---|
| **v3 A7+A8** | 19 / 0.17 % | 14 / 0.008 % | 17 / 0.17 % | 22 / 0.90 % | 16 / 0.035 % | 19 / 0.30 % | 66 / 0.40 % |
| v9 A8 alone | 15 / 0.09 % | | 16 / 0.13 % | 20 / 0.88 % | | | 34 / 0.38 % |
| v4 + G10 sizes | 19 / 0.17 % | 13 / 0.004 % | 17 / 0.18 % | 20 / 0.89 % | 73\* / 0.054 % | 57\* / 0.34 % | 32 / 0.41 % |
| v7 q90 sharp | 24 / 0.33 % | 17 / 0.13 % | 21 / 0.57 % | 25 / 2.47 % | 73\* / 0.082 % | 33\* / 0.70 % | 21 / 0.72 % |
| **v8 AVIF q80** | 18 / 0.13 % | 18 / 0.085 % | 18 / 0.26 % | 25 / 1.05 % | 59\* / 0.063 % | 47\* / 0.24 % | 27 / 0.40 % |
| v2 AVIF q90, wall 2048 | 9 / 0.000 % | 11 / 0.009 % | 10 / 0.001 % | 15 / 0.054 % | 69\* / 0.021 % | 32\* / 0.029 % | |
| v6 plain q92 (three maps) | 16 / 0.072 % | 14 / 0.090 % | 12 / 0.001 % | 17 / 0.002 % | 59\* / 0.020 % | 18 / 0.027 % | 21 / 0.11 % |
| v5 half resolution | 46 / 1.19 % | 31 / 1.26 % | 18 / 0.70 % | 35 / 1.95 % | 49 / 0.58 % | 62 / 0.87 % | |

\* the clock view's maxima are the LED digits (the control pair reaches 23–35 there); read the percentage.

The ×8 images (`diffs2/`, and the third picture of each pair in `shots-r2`): for v3, v7, v8 the residue is block-shaped codec noise at 1–4/255 over the lit wall and lantern paper, no displaced shadow edge; the lantern's lattice interior and the floor band in front of it carry the only structure (≤ 19/255). v6's residue sits on the lattice edges and the nightstand top, where chroma subsampling bites, under 16/255. v5 is different in kind: every lit edge moves and the lattice shadow on the table smears.

**Result for D1.**
1. **Lossy is invisible by the numbers at every setting down to AVIF q80 / WebP q90:** max 25/255, under 0.35 % over 8 in the hardest view, under 1.1 % in the portrait-blue view where the wall's lamp layer (×1.21 × 1.5) is most amplified. The owner's flip test picks the rung; I recommend **v3 (582 KB) as the default and v8 (409 KB) as the "about 400 KB" option**.
2. **The wall at 1024² is invisible on the portrait close-up:** v9 isolates it at max 16, 0.13 % over 8, codec blocks rather than the frame's shadow edge; it is nearly all of v3's residue in the portrait views, so A7's encoding adds almost nothing on top.
3. **G10's 512² lamp maps are not distinguishable from 1024²** (v4 ≈ v3 everywhere, wide red 1.5 included). Withdrawn as a visual objection; see the critique.
4. **Sharp-YUV q95 vs plain q92:** at these viewing sizes plain q92 is also within noise-adjacent error (v6), so the bake script's "JPEG blotches" are a 1:1-texel phenomenon. Sharp-YUV costs 85 KB over plain q92 for the three maps and buys 2–3 dB of atlas margin; keep it (free in pipeline terms) but it is not what makes the difference.
5. **AVIF:** q80 4:4:4 gives the smallest set with close-up error equal to WebP q95; its costs are a feature probe (TextureLoader has no fallback) and decode time (experiment 2). q90 for all ten (v2) is *larger* than the WebP set because the seven already-lossy maps were re-encoded from their lossy WebPs; a real all-AVIF set needs the bake PNGs, which are not in the repository: next bake.
6. **L6** is settled by v5 (max 46, 1.2–2 % over 8): drop.

### Experiment 2 · D1: decode cost of each set (`decode.mjs`)

**Method.** Headless Edge on the preview origin, `Emulation.setCPUThrottlingRate 4`, each file inlined as a Blob; four runs each of `createImageBitmap(blob, {imageOrientation:'none', colorSpaceConversion:'none'})` (the G10/A13 path) and `new Image().decode()` (the `<img>` path TextureLoader uses); medians. Caveat: Chromium decodes both on worker threads the CDP throttle does not fully cover, so read these as *relative* costs (the baseline's main-thread `texImage2D` decodes were ~2× these: 2048² at 75–112 ms (M1) vs 54 ms here).

| Map | Shipped (bitmap / img ms) | v3 WebP q95 sharp | v7 WebP q90 | v8 AVIF q80 |
|---|---|---|---|---|
| room-day 1024² | 23.7 / 19.9 (lossless) | 16.0 / 8.2 | 16.6 / 8.1 | 28.2 / 15.1 |
| room-lamp 1024² | 24.7 / 20.8 (lossless) | 19.1 / 12.1 | 17.8 / 10.0 | 28.6 / 18.2 |
| props-lamp 1024² | 23.8 / 15.8 (lossless) | 19.9 / 12.7 | 19.2 / 10.2 | 30.9 / 23.5 |
| wall-day | 54.0 / 24.7 (2048²) | 15.3 / 7.9 (1024²) | 14.0 / 7.4 | 21.8 / 10.7 |
| wall-lamp | 54.3 / 16.5 (2048²) | 16.6 / 6.7 (1024²) | 14.8 / 6.9 | 21.2 / 13.1 |
| other five, unchanged | 74.1 / 47.3 | 74.1 / 47.3 | 74.1 / 47.3 | 74.1 / 47.3 |
| **whole set** | **254.6 / 145.0** | **161.0 / 94.9** | 156.5 / 89.9 | **204.8 / 127.9** |
| AVIF q90 all ten, wall 2048² (v2) | | | | 391.7 / 233.2 |

**Result.** Lossy WebP decodes 1.3× faster than lossless at the same size, and halving the wall pair removes the two dearest decodes: **v3 costs 37 % less decode than today** (M). AVIF q80 costs 1.5–1.8× a lossy WebP of the same size; the v8 set is still 20 % cheaper than today's but 44 ms (bitmap) dearer than v3 here, perhaps 0.15–0.2 s on a mid-range phone (A). Against its 173 KB ≈ 0.87 s (S) of transfer, AVIF q80 is a net win on the phone profile; the real cost is the probe and a second code path. 2048² AVIF is disproportionately slow (93–113 ms): if AVIF is adopted, A8 is not optional.

### Experiment 3 · D6: Draco vs meshopt on the same final geometry, both pre-compressed (`tools/geo2-A.mjs`)

**Method.** One prepared document from the shipped glb: Cube* and ClockDigits kept, weld (BonsaiWood excluded), the per-mesh simplification table from round 1, TEXCOORD_0 dropped on untextured primitives (keep-list: Screen, ClockDisplay, PortraitPicture, Sky), albedos to 512² WebP q85 with BonsaiWood at 1024², `ALL_EXTENSIONS` registered. Then `draco` (12/10/12 or 14/10/12, encode speed 1) or `quantize` (12/10/12) + `meshopt` (high). brotli-11 and gzip-9 in Node; re-read with the matching decoder for a single-threaded decode time (includes JSON parsing, excludes texture decoding).

| Candidate (M) | Raw | Geometry | Brotli-11 | Gzip-9 | Vertices | Node read |
|---|---:|---:|---:|---:|---:|---:|
| shipping glb (Blender Draco 14/10/12, JPEG/PNG) | 4,055,756 | 1,724,523 | 3,655,237 (L) | 3,723,970 (L) | 279,045 | 370–400 ms (M1) |
| Draco 12/10/12, A1–A6 | 1,086,708 | 824,908 | 880,363 | 902,606 | 184,931 | 128–169 ms |
| **Draco 14/10/12, A1–A6 (recommended)** | **1,163,728** | 901,888 | **945,258** | 970,040 | 184,931 | 113 ms |
| Draco 12/10/12 without A5 simplification | 1,218,132 | 956,296 | 962,416 | 983,543 | 239,892 | 157 ms |
| meshopt high 12/10/12, same document | 2,496,240 | 2,181,604 | 1,326,568 | 1,461,383 | 204,093 | 24–52 ms |
| Draco sequential (order-preserving) 12/10/12 | 2,666,992 | 2,405,108 | 1,566,271 | 2,141,672 | 183,944 | 65 ms |

Decoders on the wire (M1/L): Draco wasm 192,420 B raw → 54,943 B brotli (Vercel compresses wasm) + wrapper 10,840 B; meshopt decoder 7,365 B brotli.

| Delivery | Draco 12-bit glb + decoder | meshopt glb + decoder | Draco advantage |
|---|---:|---:|---:|
| glb uncompressed (Vercel today) | 1,086,708 + 65,783 = **1,152,491** | 2,496,240 + 7,365 = 2,503,605 | **1.35 MB ≈ 6.8 s (S)** |
| glb brotli (if static pre-compression can be served) | 880,363 + 65,783 = **946,146** | 1,326,568 + 7,365 = 1,333,933 | **388 KB ≈ 1.9 s (S)** |

**Result.** Draco wins both ways, matching L's independent comparison within the brotli-9/11 difference. meshopt's decode advantage is 80–120 ms single-threaded here (M), ≈ 0.4–0.5 s at 4× (S), and Draco already decodes in up to four workers, so the exposed difference is smaller. **A11 stands: keep Draco, re-encoded (A3), at 14-bit positions** (+77 KB over 12-bit, see experiment 5). A5's simplification is worth 131 KB (M). Sequential Draco is not a way to keep vertex order (2.5× the bytes); L8's pre-compression is worth 206 KB on the 12-bit file and 218 KB on the 14-bit one (M).

### Experiment 4 · D4/D6 interaction: BonsaiWood vertex order (`tools/order-A.mjs`)

**Method.** Decode the shipped glb and each candidate, take BonsaiWood's POSITION array, test index-by-index equality within two quantization steps (extent 2.159 units, 12-bit step 0.00053), and emulate `bonsai.ts` (every third vertex) on both arrays, counting how many of the candidate's sampled points coincide with an original sampled point.

| File | Wood vertices | Same order? | Every-3rd samples shared with shipping |
|---|---:|---|---:|
| shipped glb re-read (sanity) | 30,798 | yes | 100 % |
| Draco re-encode (wood excluded from weld and simplify) | 29,293 | no | 1,503 of 9,760 (15.4 %) |
| meshopt (wood excluded) | 30,798 | no | 0 of 9,279 (0.0 %) |
| Draco sequential | 29,008 | no | — |

**Result.** The Draco JS encoder deduplicates identical vertices and edgebreaker reorders the rest; meshopt keeps the count but `reorder()` changes every index. **Any** repack changes which wood vertices seed the twigs, and so would the next Blender export. The samples feed a nearest-point search, so the effect is bounded by the sample spacing (1–3 mm on the trunk), but experiment 5 shows the canopy does visibly re-arrange. J's fix; A3 waits for it.

### Experiment 5 · the A1–A6 glb in the running room (`shots2.mjs`, glb swapped)

**Method.** Same harness, `bedroom.<hash>.glb` fulfilled with the candidate. Variants: **g1** 12-bit (A1–A6 minus A4); **g2** 12-bit without A5; **g4** 14-bit with A5; **q14/q16/q14n16** pure Draco re-encodes of the shipped file with nothing else changed (14- or 16-bit positions, 10- or 16-bit normals); **g3** g1 + the v3 lightmaps; **p2/p3** the 12-/14-bit glb on the phone profile. The engine started normally in every case: START appeared, the cube was placed from the kept Cube* meshes, hover outline, lantern, clock and bonsai panels all worked.

Max channel error / share over 8 (wide-view noise 0.10 %, close-up 0.000 %):

| View | g1 12-bit | g2 12-bit, no A5 | **g4 14-bit** | q14 pure | q16 pure | q14n16 pure | g3 (+v3 maps) | p2 / p3 phone |
|---|---|---|---|---|---|---|---|---|
| Whole room, warm | 210 / 0.36 % | 211 / 0.36 % | 211 / **0.17 %** | 211 / 0.11 % | 211 / 0.06 % | 211 / 0.04 % | 210 / 0.32 % | 149 / 0.38 % · 91 / 0.29 % |
| Whole room, red 1.5 | 221 / 0.40 % | | 221 / **0.19 %** | | | | 220 / 0.62 % | |
| Hover outline on the cube | 192 / 0.28 % | | 194 / **0.10 %** | 194 / 0.10 % | 195 / 0.08 % | 195 / 0.04 % | | |
| Portrait close-up | 199 / 0.22 % | | | | | | | |
| Bonsai close-up | 205 / 2.35 % | 204 / 2.23 % | 217 / 1.92 % | | | | 205 / 2.37 % | |
| Lantern close-up, blue 1.5 | 123 / 1.77 % | 123 / 1.77 % | 123 / 1.94 % | | | | | |
| Clock close-up | 209 / 0.85 % | 209 / 0.84 % | 209 / 0.97 % | 209 / 0.95 % | 209 / 0.98 % | 209 / 0.95 % | | |
| Clock close-up, radio body only (crop, control 0 %) | 40 / 1.5 % | 40 / 1.5 % | 40 / 1.75 % | 39 / 1.7 % | 40 / 1.75 % | | | |

**What the ×8 images show, in order of size.**
1. **The bonsai canopy re-arranges** (experiment 4): the whole foliage is bright in the bonsai and lantern views; that is the 1.8–2.4 %. Not acceptable as is; gated on J's fix.
2. **At 12 bits, one-pixel dotted outlines along every edge in the room** (lantern frame, lattice bars, portrait frame, radio, Game Boy): sub-pixel shifts of every silhouette. Nothing there was simplified (g2 = g1). At **14 bits** the wide and hover views fall to the noise floor plus ~0.07 % (A5's share), and a pure 14- or 16-bit re-encode is pixel-identical. **A3 keeps Blender's 14 bits** for 77 KB (M).
3. **Dashed residue along the radio's grille ridges in the clock close-up, present for every candidate including the pure re-encodes** (crop: 1.5–1.75 %, max 40, control 0 %): the frames are identical to the eye (the pair is in `shots-r2`, group 7, last entry). Intermittent dashes on coplanar ridge faces that flip with sub-micron position changes are z-fighting: a latent model defect (the grille ridges sit on the radio top plate) that probably already shimmers when the camera moves. Fix in Blender (lift or merge the ridges); unrelated to the asset track's quality.
4. **Fine grain on the plant leaves and the pot** (512² albedo) in the bonsai view's foreground leaf; a few counts. This is A1/A2's actual visual cost, and the bonsai pair is the test (the phone frame does not include the plant).

Otherwise the hover outline, portrait, clock face and cube are unchanged.

### Experiment 6 · D7: the asset track measured, not modelled

**Method.** A copy of the repository in `scratch/A/site/` (own `.svelte-kit`, preview on :4199, the repository's output folders untouched) with only the asset files replaced: `gt/e-draco.glb` (A1–A6 as measured, 12-bit), the v3 lightmaps, the lossless-WebP portrait bytes (A9) and the mono chime (A10). No loading code changed: "assets only, existing serial chain". `vite build` (the Vercel adapter's serverless bundling fails on the symlinked node_modules; the client/server output the preview needs is complete) and the round-1 `baseline.mjs` harness, same profiles, same tracing overhead, two runs each.

| | Baseline (M1) | Asset track (M, runs 1 / 2) |
|---|---:|---:|
| Phone: bytes before interactive | 6,551,563 B | **2,334,078 B** |
| Phone: room interactive (START) | 42.7 s | **19.16 s / 18.91 s** |
| Phone: loading screen / FCP | ~1.5 s | 1.48 s / 1.26 s |
| Desktop: room interactive | ~4.3–4.5 s | **2.93 s / 3.63 s** |
| Phone idle room CPU (renderer main thread) | 88 % | 65 % / 64 % |
| Desktop idle room CPU | 15 % | 11.5 % / 11.9 % |
| JS heap in the room, phone / desktop | ~56 / 65–77 MB | 56 / 65–68 MB |

Phone waterfall after the asset track (run 1, ms from navigation): engine chunk 1,412–2,658; **glb 2,994–8,675** (1,086,979 B, 5.7 s); Draco wrapper + wasm 8,708–9,883 (192,639 B uncompressed on the preview; Vercel serves it brotli ≈ 55 KB, ~0.9 s less); the five lightmap pairs one after another 10,067–14,087 (582 KB, 4.0 s); portrait 14,109–14,346; **no network from 14.35 s to 18.08 s** (scene build, PMREM, shader links, foliage: the CPU block J measured); chime 18,079–18,542; START 19,155.

**Result for D7.**
- **Assets alone: 19.0 s on the phone profile (M)**, against L's 20.63 s and J's 19–22 s forecasts: the model was right and slightly pessimistic. In production the uncompressed-wasm artefact disappears (≈ 18.1 s, S); the 14-bit glb adds ≈ 0.4 s and the AVIF set removes ≈ 0.9 s (S). **18–19.5 s** depending on those two choices.
- **What is left is not bytes.** 2.33 MB at 1.6 Mb/s is an 11.7 s floor and the measured network span is 14.3 s; the rest is 2.7 s of discovery before the glb starts (L5/J3), ~1.0 s of serial lightmap pairs beyond their payload (L2), ~1.2 s of Draco download that could overlap the glb (L2/L8), and **4.3 s of CPU** between the last texture and START (G1/G2/J1/J2). "Assets + loading" ≈ 15–16 s and "all four" ≈ 13–14.5 s (S, taking L's and J's residuals as they stand); I see no reason to revise their ranges, only to anchor them on a measured 19.0 rather than a modelled 20.6.
- **Idle CPU fell from 88 % to 65 % on the phone with no runtime change (M, unexplained).** Likeliest cause: the picking hulls are built from the now-simplified meshes and the per-frame hover raycast runs against them; fewer hull faces, cheaper raycasts. G/J to confirm; if right, J5's precomputed hulls get the same for free, and G3's saving must be re-measured on top of it.
- **Items that stop paying once the asset track lands:** L6 (dropped); G10's "−400 KB" (A8 already took the two 2048² maps; −82 KB remains); L1 (superseded); A13/G10's off-thread decode shrinks from 1.46 s of phone upload/decode to roughly 0.5–0.6 s (S) but still pays; J6 (settled). A10's bytes still count, but its critical-path position disappears with J4/L2.
- **Byte budget after the asset track** (wire; M where the file exists): glb 1,163,728 (14-bit) · lightmaps 582,124 (or 408,848 AVIF) · portrait 14,060 · chime 56,469 · JS, Draco, fonts, CSS and the rest 556,803 (M1; the Draco decoder is 192 KB on the preview and ~66 KB on Vercel) → **≈ 2.37 MB (≈ 2.20 MB with AVIF)**, 36 % of today; L8's brotli glb would take another −218 KB.

## Revised ranked list

Wire bytes unless stated; phone profile 1.6 Mb/s, so 1 MB ≈ 5 s. Savings are against the shipping site and do not overlap each other or L/G/J items unless noted. Nothing here needs a re-bake.

### 1. A2 (with A1): every embedded albedo to 512² WebP q85, BonsaiWood 1024²
- **Saving:** images 2,239,837 → 174,080 B (M), **−2.07 MB ≈ −10.3 s**; ten 1024² decodes and one 1 Mpx PNG inflate become 512² WebPs; GPU texture memory −40 MB (A). Also set the leaf material `OPAQUE`.
- **Risk:** low; the owner checks the plant and pot (bonsai pair), curtain, floor. **Effort:** S. **Re-bake:** no (packing script, or fix `build_scene.py:833` + `SKIP_BAKE=1`).
- **Verify:** `gltf-transform inspect` lists every texture ≤ 512² except BonsaiWood, all `image/webp`, `EXT_texture_webp` declared; the pairs pass.

### 2. A7 + A8: lossy lightmaps for the three lossless maps, wall pair to 1024²
- **Saving:** lighting set 1,582,192 → 582,124 B (M), **−1.00 MB ≈ −5.0 s**, decode −37 % (M), two 2048² uploads gone (−140 ms phone upload, −34 MB GPU, M1/A). Ladder: 500 KB with G10's sizes (rendered ≈ identical), 497 KB at q90, **409 KB as AVIF q80** (probe + decode trade, experiments 1–2).
- **Risk:** low by measurement: max 22/255, ≤ 0.9 % over 8 in the hardest close-up, codec blocks not shadow edges. **Effort:** S (ImageMagick flags, written into the repo). **Re-bake:** no.
- **Verify:** `shots-r2` groups 1–2; `magick compare` ≥ 46 dB per map.

### 3. A3 + A6 + A5: Draco re-encode at **14**/10/12, drop unused UV sets, simplify the cloth and pot
- **Saving:** geometry 1,724,523 → 901,888 B (M), **−823 KB ≈ −4.1 s**; Draco decode −60 % (M1); vertices 279 k → 185 k. With A1/A2: **bedroom.glb 4,055,756 → 1,163,728 B, −2.89 MB**.
- **Changes from round 1:** (a) positions stay at Blender's 14 bits (12 bits shifts every edge; experiment 5), +77 KB; (b) BonsaiWood excluded from weld and simplification, and **A3 is gated on J's stable attachment-point input** (experiments 4–5); (c) Cube* meshes stay until A4's proxies exist; (d) the radio's grille ridges should be fixed in Blender (z-fighting, experiment 5) whenever the room is next exported.
- **Risk:** low–medium; A5's per-mesh ratios are the owner's call (duvet, curtains, pot, soil, moss, clock wheel) and can be dialled back individually; g2 shows A5 contributes ~0.07 % of the wide-view residue. **Effort:** S–M. **Re-bake:** no.
- **Verify:** `inspect` vertex counts; `shots-r2` group 7 (whole room, hover outline, clock, phone); the bonsai pair must match the control after J's fix.

### 4. A12: the packing script, now with four more jobs
- `assets/3d/pack.mjs` after Blender export: prune → weld (not the wood) → simplification table → drop TEXCOORD_0 (keep-list) → `prune({keepAttributes:true})` → WebP 512²/1024² → leaf `OPAQUE` → `doubleSided=false` from a list (G12) → Draco 14/10/12 → picking hulls from the packed geometry (J5) → the cubeUV environment (G1) if adopted; plus the lightmap encode command (A7/A8) and, if AVIF is adopted, the probe.
- **Saving:** keeps 1–3 from regressing; makes G12/J5/G1 reproducible. **Effort:** M. **Re-bake:** no. **Verify:** `npm run pack-room` reproduces the shipped bytes from the same input.

### 5. A9 + A10: portrait to lossless WebP, chime stripped and mono
- **Saving:** 240,270 → 14,060 B and 116,542 → 56,469 B (M), **−286 KB ≈ −1.4 s**; the chime is the last serial fetch today (J4/L2 remove the wait, A10 the bytes; count once).
- **Risk:** none / none audible. **Effort:** XS. **Re-bake:** no. **Verify:** `magick compare -metric AE` = 0; `ffmpeg -i` shows one mono stream, no picture.

Dropped or demoted: **A4** (cube proxies) stays useful but is a Blender change gated on the engine contract (L); **A11** is settled, not a work item; **A13** merges into G10's loader half; **AVIF for all ten maps** waits for the next bake (no bake PNGs in the repository); my round-1 objection to **G10's sizes** is withdrawn.

## Open disputes for round 3

1. **D1, the owner's call:** which rung of the lightmap ladder (582 / 500 / 497 / 409 KB) passes the flip test in `shots-r2`. By the numbers all four pass; the 409 KB AVIF rung also needs the probe and the decode trade (experiment 2) accepted.
2. **D1, G10's sizes:** rendered ≈ identical to 1024² in every view; G should either accept that the saving is 82 KB and two decodes, or show a view where 512² fails.
3. **D6, closed:** Draco, re-encoded, 14-bit positions. L8's brotli delivery test (−218 KB) is the only open item, and it is L's.
4. **D4/A3 ordering with J:** A3 cannot ship before `createBonsai` samples attachment points in a vertex-order-independent way (hash of the quantized position, or data emitted by the packing script). J chooses; I supply the packed wood and the hook in A12.
5. **D7:** 19.0 s measured for assets alone (experiment 6) replaces the modelled 20.6; the round-3 argument is the *post-asset* critical path (2.7 s discovery, 1.2 s decoder, 1.0 s serial pairs, 4.3 s CPU), which L/J/G own. Also: who explains the 88 → 65 % idle-CPU drop before G3 is booked against the baseline.
6. **D8:** agree with L and J on USB + remote DevTools; asset-side addition: capture the lightmap decode and the glb decode on the phone with the final files, because those are the two places where my desktop numbers are extrapolated by ×4.
7. **New, for the owner (not a dispute):** the radio grille's z-fighting (experiment 5) is independent of this work and worth a Blender fix at the next export.
