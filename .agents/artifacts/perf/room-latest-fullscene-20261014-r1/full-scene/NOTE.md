# Full-scene GLB model inspection views: original vs latest c2s (2026-10-14, r1)

These are GLB model inspection views, rendered with Three.js in owned headless Chrome. They are **not Blender screenshots** and **not app screenshots**. The app's baked lightmaps are absent, so these views do not prove how the room looks in the app.

## Models (entire GLB, unmodified)

| | File | Bytes | SHA-256 | Meshes / tris |
|---|---|---:|---|---|
| BEFORE (original, untrimmed) | `room-visibility-trim-experiment-20261013/baseline/source/src/lib/boot/assets/bedroom.glb` | 1,183,392 | `4d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4` | 103 / 223,809 |
| AFTER (latest deployed c2s) | `room-trim-nonbonsai-reduction-20261013-r1/candidates/c2s-lower-pot01-leaves512/bedroom.glb` | 881,512 | `5110090d4c2a0508e2eb1666adc62c0d44c898a9a97437c1e72f8542eb555ed2` | 83 / 171,378 |

- The deployed upload stage `room-nonbonsai-preview-deploy-20261014-r1/upload-stage/src/lib/boot/assets/bedroom.glb` has the same SHA-256 (`5110090d…5ed2`).
- `tools/fullscene/server.mjs` checks both hashes at startup and refuses to serve on a mismatch. The log shows `HASH OK` for both files.
- No mesh was hidden, excluded or moved. The views use the GLB's own materials and embedded textures.
- The old 21.8% trim AFTER renders (`2df7922e…`, 182,905 tris) are **not** used here.

## Camera and lighting (identical to the 2026-10-13 views)

- `cameras.json` is a byte copy of the old file (SHA `06f4cc65…8468`): 1600×1000, DPR 1, perspective, vertical FOV 40°, near 0.5, far 1000, up +Y. The framing uses the original model's bounds, min [-35.5, -7.54, -8.9], max [25.0, 27.35, 43.0].
  - `wide-three-quarter-front-right`: position [52, 26, 92], target [-5.25, 6, 14]
  - `high-overhead-front`: position [4, 104, 80], target [-5.25, 0, 12]
- `tools/fullscene/viewer.html` is a byte copy of the old viewer (SHA `297e87d3…25ee4`). Its lighting is inspection-only:
  - hemisphere light 0xffffff/0x888888 at 2.2
  - directional light at 1.6 from (3, 6, 4)
  - no tone mapping, sRGB output, background #d9d9d9
- Renderer: three 0.186.1 (the repo's existing `node_modules/three`), GLTFLoader + DRACOLoader. Chrome is `--headless=new --use-angle=vulkan` with a fresh profile, on CDP port 9944 and loopback server 127.0.0.1:4394.

## BEFORE reuse check

Both BEFORE angles were re-rendered with this renderer (`RERENDER-BEFORE-*.png`) and compared with the 2026-10-13 BEFORE PNGs (`logs/before-rerender-diff.log`):

- wide: byte-identical (SHA `1a92dc44…8390`). 0 of 1,600,000 px differ.
- high: 2 of 1,600,000 px differ, each by 1 channel level. This is GPU rasterization noise.

The renderer matches, so the old BEFORE PNGs were reused: `BEFORE-*.png` are byte copies from `room-trim-preview-deploy-20261013-r1/full-scene/`.

## Old-trim AFTER vs c2s AFTER (for reference only)

`logs/old-after-vs-c2s-diff.log`: wide 5,021 px (0.31%, max Δ54), high 5,102 px (0.32%, max Δ41). The whole-scene silhouette is the same as the old trim. The c2s changes are SheetFold decimation, the pot primitive and the pot image, plus the lightmaps. The lightmaps are not used in this viewer.

## Commands

```
node tools/fullscene/render.mjs full-scene/cameras.json   # cwd = this folder; stdout in logs/render-stdout.log
node tools/pxdiff.mjs <a.png> <b.png>                     # sharp from the repo's node_modules
```

Result `logs/shots-*/result.json`: 0 failures, 0 page errors, 0 console warnings. Chrome closed with `Browser.close` (exitCode 0, not forced). The server was stopped through its own child handle (SIGTERM). T3 `preview_status` reported no preview automation host, so the owned headless Chrome fallback was used.

## Files

- `BEFORE-*.png`, `AFTER-*.png`, `RERENDER-BEFORE-*.png`, `cameras.json`, `logs/`
- `../collage.html`: before/after collage, with image paths as absolute local file URLs
- `../tools/`: owned copies (cdp.mjs, fullscene viewer/server/render) and pxdiff.mjs
- `../profiles/`: the fresh Chrome profile from this run
