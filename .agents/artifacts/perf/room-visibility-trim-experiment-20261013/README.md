# Room visibility trim experiment, 2026-10-13

## Decision

**Result: candidate PASSES the local appearance and behavior checks. Byte savings are certain. A startup-time gain is NOT shown.** This is a local experiment only. Nothing was deployed, committed or pushed. Root decides the next step.

- The bed is **not** invisible. On desktop the headboard and mattress fill about 12–14% of the room view (it is dark wood in shadow at the left edge). Removing the whole bed would be a large visible change, so no bedless candidate was built.
- 20 nodes never put a pixel on screen in 100 sampled camera states. The candidate removes only those 20 nodes. They include the duvet (the largest bed mesh), the far pillow, the cushion, the bed legs, the rug, the left/upper/side walls, the window frame, the far curtain, the curtain rod and the sky.
- Model: **1,183,392 → 948,532 bytes raw (−234,860, −19.8%)**. **Brotli 965,768 → 755,491 bytes (−210,277, −21.8%)**.
- Lost visible pixels: **0** in every sampled state (exact object-ID render). Screenshot differences stay at the run-to-run noise level.
- No external texture file can go. The bed, room and wall lightmaps still have visible users.

## What the bytes are (inventory.json)

The model has 96 mesh nodes, 103 primitives, 223,809 triangles, 53 materials, 15 embedded images. Each primitive has its own Draco bufferView. Draco geometry is 901,829 bytes; embedded images are 194,367 bytes; JSON is 87,116 bytes.

| Group | Draco bytes | Triangles | Images only it uses | External lightmaps |
|---|---:|---:|---:|---:|
| Bed (12 nodes) | 204,738 | 47,218 | 28,446 B (4 images) | bed-day 58,970 + bed-lamp 34,702 |
| Background (walls, floor, window, curtains, rug, sky, portrait parts) | 46,058 | — | rug 12,846, sky 329 | room, wall (shared) |

The bed's frame, headboard and legs share the Oak image with the nightstand. That image stays.

**Kind of saving.** The user said "pixels". The removed parts give three kinds of saving:

1. Download and decode (certain): 180,395 Draco bytes (40,904 triangles) and 38,287 image bytes (Duvet 512×505, Cushion 512×493, Rug 512×505, Sky 8×256). The browser no longer downloads, Draco-decodes or image-decodes them.
2. Startup GPU work (by code inspection): the engine draws every mesh once behind the loader, two at a time, and uploads big buffers one at a time. 20 fewer meshes means 10 fewer warm-up draws and 4 fewer texture uploads. Nominal texture memory removed: about 4.1 MB (RGBA8 with mips; actual VRAM was not measured).
3. Per-frame draw work (measured by frustum test): in the room view, 4–6 of the removed meshes pass frustum culling and are drawn every frame without a visible pixel. On desktop this includes the 26,240-triangle duvet. Mean over all 100 states: 3.9 removed meshes in the frustum per state. GPU time was not measured.

Setting `visible = false` at runtime would give only kind 3. It saves no download or decode.

## Visibility method (coverage)

A diagnostic-only fixture build (`fixture/`, `fixture-engine.diff`) paints the 31 bed and background nodes in ID colours. At each state it renders the scene again into an offscreen, non-antialiased target: ID nodes write their ID, all other opaque meshes write black and occlude, transparent layers and points are skipped. It counts exact ID pixels (`tools/idcount.js`). It also records which ID nodes pass the frustum. The fixture is never a candidate.

States per viewport (25): room at centre and at four pointer corners (parallax extremes), lantern, clock radio, cube, bonsai and portrait focus with the panel open, room after focus, six forward-boot times (0.5–4.4 s), site, six BACK-return times (0.3–3.2 s), room after return. Viewports: desktop 1280×800, phone 390×844, wide landscape 844×390, ultrawide 1280×540. Total 100 states. Results: `inventory.json` (`nodes`, `perState`).

Visible nodes (max exact pixels in one state): WallRight 630,340, Headboard 115,433, Mattress 96,903, Pillow1 79,430, Curtain1 82,248, WallFar 67,344, Floor 47,724, WallBelow 4,475, BedFrame 4,039, Skirting 384, SheetFold 198. These stay. BedFrame and SheetFold show only in a few phone states, but they are visible, so they stay.

Limits: sampling is not exhaustive. Pointer drags, cube turns, bonsai turns, window resizes and aspect ratios above 2.37 were not sampled. The ID render ignores DOM panels on top of the canvas, so its counts are an upper bound on what a visitor sees. Bonsai foliage occludes with plain black material without its vertex sway.

## Candidate (one candidate, no correction needed)

`tools/trim.mjs` removes whole nodes at the GLB JSON/BIN level. It copies every kept Draco bufferView and image byte for byte. It does not decode or re-encode, does not crop texture atlases and does not change UVs. It drops only meshes, accessors, materials (Duvet, Cushion, Rug, Brass, Sky), textures and images that no kept node uses.

Validation (`candidate-model/validate.json`): glTF-Transform reads and Draco-decodes both files. All 83 kept primitives and 11 kept images are byte-identical to the baseline; nodes, materials and accessors match by name. Triangles 223,809 → 182,905. Primitives 103 → 83. Materials 53 → 48. Images 15 → 11. Three's GLTFLoader loads the candidate in the browser in every session below with no runtime error.

Only `src/lib/boot/assets/bedroom.glb` changes (`candidate-manifest.json`, `candidate.diff`). The other 93 files match the accepted atlas source. The built JS differs only by the model's hashed file name and the chunk names that follow from it. The scene chunk is the same 794,683 bytes. Brotli used the same settings as `scripts/precompress.mjs` (quality 11, size hint).

Checks: svelte-kit sync, svelte-check (0 errors, 0 warnings) and production client/SSR build pass for baseline and candidate with the existing no-op adapter config. The existing >500 kB chunk warning remains. Format was not run: the only change is a binary file.

## Appearance and behavior

Seeded `Math.random`, same states, same viewport, DPR 1, fresh profiles. Pixel differences with any channel >16 (`diffs/`):

| State (desktop) | baseline vs baseline | baseline vs candidate (repeat) |
|---|---:|---:|
| room-center | 2,029 | 1,250 |
| focus-cube | 5,913 | 8,997 |
| focus-bonsai | 13,872 | 13,439 |
| room-returned | 2,117 | 3,963 |

Static-state differences come from the clock minute, bonsai sway, dust and the portrait water frames. They are not in the bed area. Transition states differ a lot in both pairs because screenshot timing varies.

One problem: the first candidate desktop run had 125,477 changed pixels at bonsai focus (the tree was turned slightly differently). A second candidate run had 13,439, the same as baseline noise. The cause is run-to-run variance, not the trim. Phone baseline vs candidate stayed small for static states (775–2,581); phone lantern and bonsai focus had 15,368 and 45,522, and no baseline-vs-baseline phone pair was captured to compare.

Side-by-side images (baseline | candidate | fixture ID view): `sidebyside/`. All 6 fidelity sessions (3 baseline, 3 candidate; desktop and phone) completed room, lantern, clock radio, cube, bonsai and portrait focus with Back, START to site, and BACK to room. All 4 timed sessions completed START to site and BACK to room. No camera, empty-edge, lighting or interaction fault was seen. Radio audio playback was not checked.

## Startup timing (small-pair evidence only)

Four fresh profiles, order baseline, candidate, candidate, baseline. Headless Chrome 154, ANGLE Vulkan, 1280×800 DPR 1, native network on localhost, no CPU throttle, cold cache, storage `boot-seen=1` and `room-place=room` (room first). Observer: START button insertion, its Svelte `introend`, long tasks, rejections (`tools/timed-hook.js`). No GL hooks, no trace, no V8 sampling, no added waits.

| Session | responseStart | model responseEnd | START inserted | START introend | introend − responseStart | long tasks before introend |
|---|---:|---:|---:|---:|---:|---:|
| t1 baseline | 252.6 | 397.2 | 1,462.5 | 2,552.6 | 2,300.0 | 3 / 350 ms |
| t2 candidate | 315.6 | 458.0 | 1,866.1 | 3,005.0 | 2,689.4 | 9 / 760 ms |
| t3 candidate | 288.1 | 454.7 | 1,673.9 | 2,787.8 | 2,499.7 | 5 / 509 ms |
| t4 baseline | 388.1 | 566.2 | 2,398.6 | 3,481.8 | 3,093.7 | 15 / 1,247 ms |

All four are valid: one `.glb.br` request each, HTTP 200, `Content-Encoding: br`, no raw `.glb` fallback, no runtime error or rejection. Encoded model bytes: 965,768 baseline, 755,491 candidate. BACK took 4.2–4.3 s from click to the new START `introend` in all four (the designed return animation) and made no new requests.

The two baselines differ by 794 ms; that is larger than any baseline/candidate difference. **The timings do not show a startup change in either direction.** Localhost delivers the model in about 25 ms, so these sessions cannot show download savings. Startup noise (Chrome cold start, long tasks varying from 350 to 1,247 ms) dominates.

Theoretical transfer only (not simulated, not measured): 210,277 fewer Brotli bytes at 1.6384 Mb/s is about 1.03 s of link time. On a real slow link the model shares the connection with other files, so the actual effect is unknown. No Lighthouse, Speed Index or score change is claimed.

Not measured: Draco decode time, image decode time, GPU frame time, VRAM, LCP (the LCP element is the page heading, not the room), mobile or Safari devices.

## Process and identity

T3 `preview_status` reported no automation host for this environment, so owned headless Chrome over CDP was used (`tools/cdp.mjs`). Every session used a new profile under `profiles/`. All Chrome processes closed with `Browser.close` (no forced kill). All servers stopped. No owned process remains (`cleanup.json`).

Stages `baseline/`, `candidate/`, `fixture/` are copies of the 94-file accepted atlas source (digest a1485640…2c40c, checked before copy). Each has its own `node_modules` directory with per-package junctions; `$app` and caches are local. `identity-before.json` and `identity-after.json` match: HEAD d82230a, branch, refs, Git index, all tracked file hashes, accepted source hashes, shared `node_modules` metadata and dependency targets (`verification.json`). No install, deployment, account command, commit or push.

Harness failures, kept as records: `captures/fixture-desktop` and `-r2` clicked the console instead of the clock radio because a grouped mesh gave an empty bounding box, which started the boot. `captures/fixture-desktop-r3`, `fixture-phone`, `fixture-wide-r2` and the root `coverage.json` use screenshot colour classification; a translucent layer shifted the ID colours, so those counts are wrong and are superseded by the exact ID render in `inventory.json`. `captures/fixture-wide` could not click BACK TO THE ROOM because the button was below the fold; `-r2` and later scroll it into view. A heredoc shell error stopped one tool write before any session ran.

## Files

- `inventory.json`: model, per-node, per-image, lightmap, coverage and per-state data.
- `candidate-model/`: trimmed GLB, dropped node list, trim, validate and Brotli results.
- `candidate-manifest.json`, `candidate.diff`: the one changed file.
- `captures/`, `diffs/`, `sidebyside/`: screenshots, difference images and data.
- `timed/`: four session results and `summary.json`.
- `tools/`: every script used.
