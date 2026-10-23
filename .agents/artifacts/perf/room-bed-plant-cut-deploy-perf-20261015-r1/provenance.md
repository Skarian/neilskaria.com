# Provenance: bedroom.glb cut-d-ring2 (for a possible future merge)

Nothing here is integrated. This file only records how the deployed candidate asset was made, so it can be rebuilt or checked later. Paths are relative to `.agents/artifacts/perf/`.

## The asset

| | Value |
|---|---|
| Base (c2s, deployed at 1byb9d6mi) | `room-nonbonsai-preview-deploy-20261014-r1/upload-stage/src/lib/boot/assets/bedroom.glb`, 881,512 B, SHA-256 `5110090d4c2a0508e2eb1666adc62c0d44c898a9a97437c1e72f8542eb555ed2` |
| Candidate (deployed at z1jbr6jar) | `room-bed-plant-cut-20261014-r1/accepted/bedroom.glb`, 833,884 B, SHA-256 `715a369985af1f3555a14192bf8990e6da13a11862a959495c5814918a29a059` |
| Built Brotli (precompress.mjs on Vercel and locally) | `bedroom.DyzOWy32.glb.br`, 645,950 B, SHA-256 `4f17c81f9b2d293545b18c1ef4c4fcb7232c6ca5c358ac12bea3ee177f904320` (served bytes match exactly) |
| Keep masks | `room-bed-plant-cut-20261014-r1/accepted/masks.json`, SHA-256 `c572f08bb3d239e507c0b8a55baf82c03b07a9cd2de80b8a6c781fb3536a5499`. Spec `{"r":0,"ring":2,"components":["potted_plant_02/1"]}` over `coverage/union.json` (SHA-256 `35ffa3b6…042d`) |
| Validation | `room-bed-plant-cut-20261014-r1/accepted/validate.json`, SHA-256 `6a200cd9…d220`, pass, 0 failures |

Only 7 primitives change: `potted_plant_02/0` (pot), `potted_plant_02/1` (leaf cards), `BedFrame/0`, `Mattress/0`, `Headboard/0`, `SheetFold/0`, `Pillow1/0`. The other 76 primitives (all 10 `Bonsai*` included), the 11 images and the 48 materials are byte-identical.

## Recipe (R = `room-bed-plant-cut-20261014-r1`)

1. Coverage: `R/tools/cov-matrix.sh` runs `R/tools/cov.mjs` with `R/tools/tripass.js` in the fixture build (`R/stages/fixture`), which produces `R/coverage/union.json`.
2. Plan: `node R/tools/plan.mjs <base.glb> R/coverage/union.json cut-d-ring2 '{"r":0,"ring":2,"components":["potted_plant_02/1"]}'` writes `masks.json`.
3. Build: `R/tools/build-cut.sh cut-d-ring2` runs these steps:
   - `donor-cut.mjs <base> masks.json donor.glb`: drops the unkept triangles and re-encodes a throwaway donor with pack.mjs Draco settings (14/10/12, speeds 1/5).
   - `graft.mjs <base> donor.glb out.glb <7 keys>`: splices only those 7 Draco primitives into the untouched base bytes.
   - `validate-cut.mjs <base> out.glb masks.json validate.json`: checks by name; fails on any change outside the targets.
   - It then computes the Brotli size (q11).
4. Tool hashes (SHA-256):

   | Tool | SHA-256 |
   |---|---|
   | plan.mjs | `5cee787f…9453` |
   | donor-cut.mjs | `820ab043…6731` |
   | graft.mjs | `60bc7829…dd24` |
   | validate-cut.mjs | `74135d2d…729a` |
   | build-cut.sh | `a2e3abaa…edaf` |
   | tripass.js | `3b534c3e…a33a9b` |
   | cutcheck.js | `7644b9c6…d258f` |
   | cov.mjs | `b9870459…042d` |

   `graft.mjs` imports `room-trim-nonbonsai-reduction-20261013-r1/tools/lib.mjs`.

## What a merge would have to carry

- **Derived asset:** this asset is derived from the base. If the room is re-exported from Blender, or `pack-room` is re-run, the cut is lost silently. A merge would need a note next to the asset, or in `assets/3d/`, that names the base SHA, masks.json and this recipe.
- **Camera changes:** the coverage is only valid for the camera code in this build: the start views, focus framing, sway and aspect logic in `engine.ts`. Any change there means re-running coverage → plan → build → validate, plus the same-frame check. No test guards this today.
- **Not pixel-identical:** the encoded asset is not pixel-identical to c2s. Draco re-quantization of the 7 re-encoded primitives shifts shading by 1–2 levels and moves some edge pixels (`f1/`). Any future check must compare against the encoded GLB, not the planned index subset.
