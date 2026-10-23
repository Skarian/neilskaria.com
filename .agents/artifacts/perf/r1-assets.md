# Round 1 · A (Fable) · 3D assets and their formats

Scratch work: `%TEMP%\perf\scratch\` (glbinfo.mjs, extract.mjs, decode-time.mjs, tools/variants.mjs, tools/v8.mjs; `gt/` holds every glb variant, `img/` the extracted textures, `lm/` the lightmap re-encodes, `pa/` portrait and audio). Nothing in the repository was changed.

## What is in the assets today (measured)

`bedroom.glb` 4,055,756 B = 2,239,837 B of embedded images + 1,724,523 B of Draco geometry + 91 KB JSON. 103 primitives, 279,045 vertices, 53 materials, Draco 14/10/12 bits from the Blender exporter at level 7.

- **Images:** `potted_plant_02_leaves_diff_1k` is a 1024² RGB PNG with no alpha channel, 1,282,699 B (57% of all image bytes). The pot JPEG is 155 KB at 1024². Six fabric/wall/floor recolour JPEGs are 65–131 KB each at 1024² (odd sizes: 1024×985, ×1009, ×1026); five of them have under 130 colours, meaning they are nearly flat.
- **Why the leaf PNG is there:** `build_scene.py:833` halves textures for `groups['props']` plus `potted_plant_02` *if it is in `groups['room']`*, but the plant is in `groups['plant']`, so the 1 k plant textures were never halved. The JPEG pass at `:849` then skipped the leaf image because Blender reports 4 channels and some alpha < 0.99, although the exported PNG has no alpha and the leaf geometry is already cut to the leaf outlines (1,939 triangles). One-line pipeline bug, no re-bake.
- **Geometry:** Duvet 56.9 k verts (256 KB), BonsaiWood 30.8 k (201 KB), KumikoLattice 27 k (141 KB), plant pot 16.3 k (166 KB), SP Base 13.7 k (81 KB), ClockPrint 18.3 k (74 KB), SheetFold 10.9 k (50 KB), curtains 6.4 k each (61 KB), BonsaiSoil 6.5 k (57 KB), BonsaiMoss 9 k (68 KB). Cube meshes (85 KB) are rebuilt in code and removed; ClockDigits is hidden. 59 primitives carry TEXCOORD_0 although their material has no texture.
- **Lightmaps:** 10 WebPs, 1,587 KB. room-day 340 KB, room-lamp 432 KB and props-lamp 356 KB are lossless; the rest are lossy q92. wall-* are 2048², the others 1024², plant 512². Only 23–47% of the props/bed/room-lamp atlases are non-black.
- **Portrait:** 180×2880 palette PNG, 61 colours, 240 KB. Only 489 of the 43,200 pixels change between frames (the 158×117 water patch).
- **Chime:** 116,542 B MP3; 41 KB of that is an embedded 300×300 PNG cover plus ID3 tags. Stereo 128 kb/s, but L−R sits 37 dB below the signal (effectively mono).
- **Decoding:** Draco decode of the whole scene takes 370–400 ms in Node single-threaded (three uses workers; a 4×-slower phone is ~1.5 s wall across workers). meshopt decodes the same geometry in 12–20 ms. gl captures: 69 texture uploads, 58 Mpx, 0.42 s desktop / 0.42 s phone upload, the two 2048² wall maps alone 175–186 ms.

## Proposals, ranked

Savings are on the wire unless stated. Phone profile: 1.6 Mb/s, so **1 MB ≈ 5 s**. "Measured" = produced the file and sized it; "assumed" = arithmetic.

### A1. Fix the plant textures: leaf 1024² PNG → 512² WebP q85 (and pot to 512²)
- **Mechanism:** the halving loop never ran for the plant (bug above). Encode as WebP inside the glb (`EXT_texture_webp`, supported natively by GLTFLoader 0.186, decoded via ImageBitmap off the main thread); JPEG 512² q85 (~60 KB) if WebP in glb is unwanted.
- **Saving:** leaf 1,282,699 → 37,320 B; pot 155,244 → 28,008 B. **−1.37 MB, ≈ −6.9 s phone.** Measured (variant v5: glb 4,055,756 → 2,312,920 with the leaf alone). Decode: 1 Mpx PNG (slow inflate) → 0.26 Mpx WebP; GPU memory −4 MB.
- **Quality risk:** very low. Leaves on screen are well under 512 texels across; no alpha is used. Owner compares the plant close-up.
- **Effort:** S. Re-export: none (post-process the current glb with gltf-transform), or fix `build_scene.py:833` + `SKIP_BAKE=1` re-export. **Depends on nothing.** L1 proposes lossless WebP for the same file (803 KB); A1 supersedes it.
- **Verify:** `gltf-transform inspect` shows the leaf texture 512² image/webp ≈ 37 KB; side-by-side screenshot of the plant; network tab shows the glb ≈ 2.3 MB.

### A2. All embedded albedo textures → 512² WebP q85 (BonsaiWood stays 1024²)
- **Mechanism:** `gltf-transform textureCompress --format webp --quality 85 --resize 512 512`. The recolour textures are soft, tinted noise: at 512² most collapse to 0.6–2.5 KB (wall 574 B, duvet 1.6 KB, sheet 2.5 KB, curtain 2.3 KB, pillowcase 800 B); floor 27 KB, cushion 23 KB, rug 13 KB. On screen these surfaces are minified 1.5–4 texels/px at 1024², so the GPU samples mip 1 anyway.
- **Saving:** images 2,239,837 → 175,476 B (**−2.06 MB including A1, ≈ −10 s phone**). Measured (v4). GPU: 11.5 Mpx → 2.9 Mpx of albedo (−45 MB with mips, assumed), 10 fewer 1024² decodes.
- **Quality risk:** low; curtain and pot are the two closest to 1 texel/px (owner checks). BonsaiWood is seen magnified in the turntable close-up: keep it 1024² WebP q85 (32 KB, +19 KB over 512²).
- **Effort:** S. No re-bake. Pipeline: add a post-export packing script (A12) or fix the halving loop + JPEG→WebP in Blender.
- **Verify:** side-by-side of bed, curtain, pot, floor at phone DPR; `inspect` lists every texture ≤ 512² except BonsaiWood.

### A3. Re-encode the geometry with gltf-transform Draco (weld, 12-bit positions, 10-bit normals, 12-bit UVs)
- **Mechanism:** Blender's Draco level 7 output is 1,724 KB; gltf-transform (`weld` then `draco --quantize-position 12 --quantize-normal 10 --quantize-texcoord 12`, encode speed 1) gives 1,034 KB at 12/8/12 and ~1,100 KB at 12/10/12 on the same meshes. Most of the gain is the encoder and welding, not the bits (14→12 bits saves only 72 KB). Position step: 0.04 mm on the duvet, 0.7 mm half-step on the 6 m floor box; UVs stay 12-bit (¼ texel at 1024², ½ texel at 2048²), so lightmap sampling is unchanged.
- **Saving:** **−620 to −690 KB, ≈ −3.3 s phone.** Measured (v1 = 3,366,968 total at 12/8/12). Decode time falls with vertex count: 370 → 133 ms in Node for the final geometry (A3+A4+A5+A6), i.e. ~−60%.
- **Quality risk:** very low. 8-bit normals could show faint faceting in the SP's clearcoat reflections, hence 10-bit normals (+59 KB).
- **Effort:** S. No re-bake, no engine change (same Draco decoder). Conflicts with switching to meshopt (see "tempting but wrong").
- **Verify:** glb size; Draco decode time in the perf harness; screenshots of the SP shell reflections and the floor/wall junctions.

### A4. Drop what the engine discards: Cube* meshes and ClockDigits
- **Mechanism:** the modelled cube (7 meshes, 85 KB in the current file, 53 KB after A3) is removed at load and rebuilt in `rubiks.ts`; the engine only needs CubeBody's bounding box, the six face offsets (for yaw) and the seven materials. Replace them with a 6-quad stand-in in `props.py` (keeps the same names and materials) and hide/remove ClockDigits (2.6 KB).
- **Saving:** **−53 KB after A3, ≈ −0.3 s.** Measured (v2). Also 15 k fewer vertices to decode.
- **Quality risk:** none. **Effort:** M (small Blender change + `SKIP_BAKE=1` re-export; engine untouched if names/bbox are preserved). Low priority.
- **Verify:** the cube still sits at the same place and yaw; `inspect` shows no Cube* geometry above 24 verts.

### A5. Simplify the meshes nobody sees up close
- **Mechanism:** meshopt simplifier via gltf-transform (`simplifyPrimitive`, error 0.0005 of the mesh extent = 0.9 mm on the duvet): Duvet 56,119 → 15,580 verts; SheetFold 10,277 → 5,263; curtains 5,657/5,740 → 2,952/3,005; nightstand 2,908 → 1,652; BonsaiPot 2,582 → 1,537; pillows/cushion ~−15%. The pot (`low.001` prim 0, 16 k verts) and BonsaiSoil/Moss did not simplify at that error bound; the pot needs `error 0.002` or Blender decimation (worth ~100 KB more, not measured).
- **Saving:** **−108 KB after A3/A4, ≈ −0.5 s**; vertices 245 k → 190 k (decode and GPU buffer). Measured (v3).
- **Quality risk:** low–medium; cloth silhouettes and fold shading are the thing to check. Owner judges the bed and curtains side by side; per-mesh ratios can be dialled back individually.
- **Effort:** S–M (per-mesh table in the packing script). No re-bake: lightmap UVs are interpolated by the simplifier (TEXCOORD_1 must be kept, see A6).
- **Verify:** screenshots of the bed/curtains at phone and desktop size; `inspect` vertex counts.

### A6. Drop TEXCOORD_0 on primitives whose material has no texture
- **Mechanism:** 59 primitives (SP shell, buttons, clock plastics, lattice, frames, paint, bonsai moss…) carry a UV set that no shader reads. Keep it on Screen, ClockDisplay, PortraitPicture and Sky (runtime textures; `engine.ts:347` edits the portrait's UVs) and on every textured material. TEXCOORD_1 (lightmap UVs) must be kept everywhere: gltf-transform's `prune` strips it unless `keepAttributes: true` is set, because no glTF material references it.
- **Saving:** **−141 KB, ≈ −0.7 s**; 16 k fewer decoded vertices. Measured (v7 = 988,880 B total; v8 with 10-bit normals = 1,047,676 B).
- **Quality risk:** none if the keep-list is right. **Effort:** S. No re-bake.
- **Verify:** every lightmapped node still has TEXCOORD_1 (`inspect` shows 60 primitives with it, as now); hover outlines, screen, clock and portrait render.

**A1–A6 together: `bedroom.glb` 4,055,756 → 1,047,676 B (−3.0 MB, ≈ −15 s on the phone profile; measured file). 174 k vertices instead of 279 k.**

### A7. Lossy lightmaps for the three lossless maps (and a lighter encode for the rest)
- **Mechanism:** the "JPEG blotches" the bake script warns about come from 4:2:0 chroma subsampling and low quality. WebP q95 with sharp-YUV (`-define webp:use-sharp-yuv=true -define webp:method=6`) keeps the error inside UV islands (3 px eroded mask) to max 7–16/255, mean 0.15–0.68: room-day 339,516 → 42,704; room-lamp 431,646 → 111,430; props-lamp 355,576 → 107,648. AVIF 4:4:4 q90 (`-define heic:chroma=444`, ImageMagick 7.1 has libheif) is better still: 26,560 / 73,412 / 73,854 B with max in-island error 6–9/255 and PSNR 49–51 dB, no chroma subsampling at all; it also shrinks the seven already-lossy maps by ~40% (assumed; the pipeline must re-encode them from the bake PNGs, not from the current WebPs).
- **Saving:** **−865 KB with WebP (≈ −4.3 s)**, measured; **≈ −1.1 MB with AVIF for all ten** (three measured, seven assumed). Lossy WebP also decodes ~1.5× faster than lossless; AVIF decodes ~2–3× slower than lossy WebP (assumed from codec benchmarks; 1 Mpx ≈ 50–100 ms on a mid phone, off-thread if G10 lands).
- **Quality risk:** low by the numbers, but this is exactly what the owner's eye is for: lantern tinting multiplies the lamp layer (`lampTint` up to brightness 1.5 × colour ratio), so check the tinted lantern on the floor and nightstand at a saturated colour. AVIF needs Safari ≥ 16.4 / Chrome 85 / Firefox 93; no fallback is wired in TextureLoader, so pick WebP first and AVIF as a follow-up with a one-image feature probe.
- **Effort:** S (ImageMagick flags in the conversion step; document the command in the repo, it is currently nowhere). No re-bake: re-encode from the bake's PNGs.
- **Verify:** `magick compare -metric PSNR` ≥ 46 dB per map; in-island max error ≤ 16; side-by-side at lantern brightness 1.5 in red and blue.

### A8. Wall lightmaps 2048² → 1024²
- **Mechanism:** the `wall` group is WallRight, PortraitFrame and PortraitPicture. Downsizing round-trips at 50.8 / 52.6 dB PSNR (max 33–38, mean 0.13 /255): the wall's light is smooth. The 2048² pair costs 186 ms of upload on the phone (112 + 74 ms, measured) and 45 MB of GPU memory with mips.
- **Saving:** 170 KB → ~35 KB at q92 (**−135 KB**), **−140 ms phone upload, −34 MB GPU** (assumed from texel counts). Measured sizes.
- **Quality risk:** low–medium only in the portrait close-up (frame shadow edge; the picture fills 92% of the screen height when focused). Owner compares that view specifically.
- **Effort:** S (`GROUP_SIZE['wall'] = 1024` means a re-bake, **or** downsample the existing 2048 bake output with Lanczos: no re-bake).
- **Verify:** portrait-focus screenshot side by side; gl capture shows no 2048² uploads.
- **Not recommended:** room-lamp or bed-lamp to 512² (G10): room-lamp 1024 → 512 round-trips at 41 dB with max error 115/255; it carries the lattice pattern on the floor and left wall. room-lamp is 1024², not 2048² as G10 states.

### A9. Portrait sprite sheet → lossless WebP
- **Mechanism:** `magick portrait.png -define webp:lossless=true -define webp:exact=true -define webp:method=6 portrait.webp`. Pixel-identical; `exact` preserves RGB under alpha-0 pixels, which matters because the material ignores alpha. (Same as L1; adding the `exact` caveat.) An optimised PNG only gets to 90 KB.
- **Saving:** 240,270 → 14,060 B (**−226 KB, ≈ −1.1 s**). Measured. Decode trivially faster.
- **Quality risk:** none. **Effort:** XS. **Verify:** `magick compare -metric AE` = 0 against the PNG.

### A10. Chime: strip the embedded cover art, go mono
- **Mechanism:** `ffmpeg -i gba-boot.mp3 -map 0:a -c:a copy -map_metadata -1` removes a 300×300 PNG and tags: 116,542 → 75,276 B, bit-identical audio. Mono 96 kb/s MP3 (L−R is −37 dB relative): 56,469 B. Opus 48k would be 35 KB but MP3 is the safe universal choice. Keep the 0.37 s of leading silence (boot timing).
- **Saving:** **−41 KB lossless, −60 KB mono.** Measured. It is fetched last and before START (41.2–41.9 s on the phone), so this trims the serial chain directly; J4 moves it off the chain altogether.
- **Quality risk:** none / none audible. **Effort:** XS. **Verify:** listen; `ffmpeg -i` shows one audio stream, no attached pic.

### A11. Keep Draco; don't switch to meshopt for this deployment
- **Mechanism (why):** meshopt's bitstream relies on HTTP compression. Measured on the full geometry: Draco 1,034 KB vs meshopt-high 1,680 KB brotli'd (5.77 MB raw). Vercel does not compress `model/gltf-binary` (L's finding), so meshopt would ship raw. Draco's decoder costs ~57 KB brotli (Vercel compresses wasm) and decodes the final geometry in ~130 ms in Node (workers hide it); meshopt's 7.6 KB decoder and 12 ms decode do not pay for 0.65–1.5 MB more on the wire at 1.6 Mb/s.
- **Flip condition:** if the geometry is ever served with brotli (self-hosted or a Vercel header allowlist change), meshopt-high + brotli ≈ 1.3 MB vs Draco ≈ 0.87 MB would still lose on bytes; only decoder size and decode time favour it. So: Draco, re-encoded (A3).
- **Verify:** `curl -I -H 'Accept-Encoding: br'` on the deployed glb shows no `content-encoding`.

### A12. Make the pipeline emit all of this: one packing script after export
- **Mechanism:** `assets/3d/pack.mjs` (Node, `@gltf-transform/core|functions|extensions`, `draco3dgltf`, `meshoptimizer`, `sharp`): read Blender's glb → remove Cube*/ClockDigits placeholders (if A4 not done in Blender) → `weld` → per-mesh `simplifyPrimitive` table → drop TEXCOORD_0 on untextured prims with a keep-list → `prune({keepAttributes:true})` → `textureCompress` WebP q85 512² (BonsaiWood 1024²) → `draco` 12/10/12. Plus the lightmap conversion command (A7, A8) written down in the repo. Everything runs on `SKIP_BAKE=1` output; nothing needs the 40-minute bake.
- **Saving:** keeps A1–A8 from regressing on the next export. **Effort:** M. **Verify:** `npm run pack-room` reproduces the 1.05 MB glb byte-for-byte from the same input.

### A13 (brief, outside my angle). Lightmaps through ImageBitmapLoader
- TextureLoader decodes the WebPs on the main thread inside `texImage2D` (20–37 ms per 1024², 75–112 ms per 2048² on the phone). G10 covers it; note `flipY=false` + `channel=1` must be preserved (`imageOrientation: 'none'`). With A7/A8 the decode work also shrinks.

## Totals (phone profile, wire bytes)

| | Now | After A1–A10 (WebP lightmaps) | With AVIF lightmaps |
|---|---|---|---|
| bedroom.glb | 4,056 KB | 1,048 KB | 1,048 KB |
| lightmaps | 1,587 KB | ~583 KB | ~380 KB (7 maps assumed) |
| portrait | 241 KB | 14 KB | 14 KB |
| chime | 117 KB | 56 KB | 56 KB |
| Draco + JS + fonts + misc | ~550 KB | ~550 KB | ~550 KB |
| **Total** | **6,551 KB** | **~2,250 KB** | **~2,050 KB** |

Transfer at 1.6 Mb/s: 32.8 s → ~11.2 s (−21.6 s). With the loading chain still serial, phone "room interactive" ≈ 42.7 → ~20 s from assets alone (assumed: transfer + unchanged ~6–7 s of CPU/compile); with L2/J3 parallelisation on top, ~15–17 s. GPU: ~145 MB → ~65 MB of texture memory (assumed from texel counts), wall uploads −140 ms, Draco decode −60%.

Desktop (localhost) gains are small: ~0.3–0.4 s of the 4.3 s from the wall uploads, fewer image decodes and faster Draco.

## Top 5

1. **A2 (includes A1)**: embedded textures to 512² WebP; −2.06 MB. The single biggest, lowest-risk byte win; A1 alone is a one-line bug fix worth 1.37 MB.
2. **A7**: lossy (sharp-YUV WebP q95, or AVIF 4:4:4 q90) for the three lossless lightmaps; −0.87 to −1.1 MB.
3. **A3 + A6**: gltf-transform Draco re-encode and UV-set pruning; −0.83 MB with no visual change.
4. **A8**: wall lightmaps to 1024²; small bytes, but −140 ms upload and −34 MB GPU on the phone.
5. **A9 + A10**: portrait and chime; −0.29 MB for ten minutes of work, and the chime is on the critical path.

(A5 simplification is next: −108 KB and 55 k fewer vertices, but it is the one that needs the owner's eye on cloth.)

## Tempting but wrong

1. **KTX2 / Basis Universal for the lightmaps and albedo.** ETC1S bands on smooth lighting gradients (the whole point of these maps) and UASTC at 1024² is ~500 KB per map even with zstd, more than lossless WebP today; both need a ~150 KB (brotli) transcoder before the first texture decodes. GPU upload time is 0.4 s total and not the phone's bottleneck; bytes are. (G agrees.)
2. **Packing the lamp layer as one luminance channel into the day map's alpha** (one RGBA WebP per group, tinted by a constant lantern colour). Measured in the lamp maps' non-black pixels: saturation std 0.25–0.38 and hue std 14–61° (plant 61°, bed 34°), because bounced lantern light picks up the surfaces' colours. A single-colour lamp layer would visibly change the tinted look the lantern game depends on.

Runner-up: **meshopt instead of Draco** (A11): a great format, but on Vercel without glb compression it costs 0.65–1.5 MB on the wire to save 50 KB of decoder and ~0.4 s of worker time.
