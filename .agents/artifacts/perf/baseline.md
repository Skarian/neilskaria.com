# Room performance baseline (2026-10-09)

Measured against the production build (`vite build`, served by `vite preview` on localhost:4173, page `/lab/boot`), headless Edge with real GPU (ANGLE D3D11, Windows, AMD RX 590), first visit with cache and storage cleared. Raw data: `%TEMP%/perf/base/` (baseline-*.json, trace-*.json, cpuprofile-*.cpuprofile, gl-*.json). Scripts: `%TEMP%/perf/baseline.mjs`, `gl.mjs`, `map.cjs` (maps CPU profiles to source via the source maps from `vite build --sourcemap`).

Profiles: **desktop** 1280x800, no throttling. **phone** 412x915 @2.625x, CPU throttled 4x, network slow 4G (1.6 Mbps down, 150 ms RTT). The phone profile does not throttle the GPU.

## Headline numbers

| | Desktop | Phone (slow 4G, 4x CPU) |
|---|---|---|
| Bytes before the room is interactive | 6.4 MB, 49 requests | 6.55 MB |
| Loading screen visible | ~0.2 s | ~1.5 s |
| Room interactive (START shown) | ~4.3–4.5 s (localhost, so this is nearly all CPU/GPU) | **42.7 s** (glb alone takes 20.8 s) |
| Idle room: frame rate / CPU | 57 fps (vsync), CPU 15%, JS 9.8% | CPU **88%**, JS 60% |
| Moving the pointer in the room | CPU 26% | CPU 99% |
| Page showing (room paused) | CPU 4% | CPU 15% |
| Background tab | 0% | 3.5% |
| JS heap in the room | ~65–77 MB | ~56 MB |

## Where the bytes go (on the wire; JS is gzip in preview, Vercel would serve brotli)

| Bytes | File |
|---|---|
| 3961 KB | `bedroom.glb` (Draco geometry; textures embedded as JPEG/PNG; **not** HTTP-compressed) |
| 422 / 332 KB | `room-lamp.webp` / `room-day.webp` (lossless WebP lightmaps) |
| 348 / 63 KB | `props-lamp.webp` (lossless) / `props-day.webp` |
| 235 KB | `portrait.png` (180x2880 sprite sheet, 12 frames of pixel art) |
| 207 KB | main JS chunk (three.js + GSAP + engine), gzip; 777 KB raw |
| 188 + 12 KB | Draco decoder wasm + wrapper (`/draco/`) |
| 114 KB | `gba-boot.mp3` (boot chime) |
| 89 / 78 KB | wall lightmaps (q95) |
| 69 / 41, 58 / 50 KB | plant, bed lightmaps |
| 47 KB | Inter latin woff2 |
| ~70 KB | the rest (Svelte app chunks, CSS, favicon 15 KB) |

Also in the build output but apparently not requested at runtime: a second Draco decoder emitted by some dependency (`draco_decoder.*.js` 719 KB, `.wasm` 286 KB + 192 KB, wrapper 58 KB). Worth confirming nothing requests it.

### Inside bedroom.glb (419k vertices; 2.24 MB of embedded images)
Heaviest meshes by vertex count: Duvet 56.9k (barely visible), BonsaiWood 30.8k, KumikoLattice 27.0k, ClockRadio body 18.3k, plant `low001` 16.3k, SP `Base` 13.7k, SheetFold 10.9k, BonsaiSoil 6.5k, Curtains 6.4k each, CubeBody 4.6k (the modelled cube is discarded at load and rebuilt in code).
Heaviest embedded images: `potted_plant_02_leaves_diff_1k` **1.28 MB** (PNG with alpha), pot diffuse 155 KB, six 75-quality recolour JPEGs 65–131 KB each (bed/room fabrics, wall, floor…), BonsaiWood albedo 59 KB.

## Where startup time goes (desktop, JS CPU profile ~5.8 s window, mapped to source)

- ~2.9 s self time in three.js, almost all inside renderer setup/compile called from `createRoom` (`engine.ts:126`).
- WebGL program linking: **33 programs, 2.9–3.2 s total** (ANGLE translates GLSL to HLSL on Windows). Slowest:
  - `PMREMGGXConvolution` **~1.1 s** and `SphericalGaussianBlur` ~0.13 s: `PMREMGenerator.fromScene` builds an environment map of the room at startup, used to light the live objects.
  - `MeshPhysicalMaterial` (clearcoat) variants ~230–350 ms each, five or six of them (SP shell `ShellRed`, `Screw`, screen cover, and the bonsai foliage/twig/clump `MeshStandardMaterial`s compiled as separate programs).
  - Baked-material programs ~75–90 ms each.
- Texture upload: 69 uploads, ~58 megapixels, ~0.37–0.42 s (two 2048x2048 wall lightmaps ~87 + 66 ms; many 1024x1024).
- WebGL context creation ~0.34 s.
- App code: `sound.ts` setup 145 ms (decodes the chime, builds noise buffers), `bonsai.ts` foliage generation ~140 ms, convex hulls for picking ~30 ms.
- GPU buffers ~32.8 MB (bonsai foliage holds every shoot's full overgrowth plus several attributes; room geometry).

## Running cost
- The room renders every frame continuously (rAF at 60 Hz) even when nothing changes: 15% CPU on desktop, ~88% on the 4x-throttled phone profile. Per frame: ~164 draw calls, plus a second pass for the hover outline when hovering, motes, clock LED canvas redrawn twice a second, bonsai sway shader.
- While the page is showing the room's render loop is stopped (`setAnimationLoop(null)`), yet CPU is still 4% desktop / 15% phone (no JS: so compositing/CSS: the CRT overlay, START button animation, etc.).
- Returning visitors: the room is preloaded in the background after the page becomes idle, meaning the ~3 s of shader compile and texture upload lands while they're reading the page.

## Context for the panel
- Stack: SvelteKit 3 + Svelte 5, three.js 0.186, GSAP; deployed on Vercel (adapter-vercel). Room code is code-split (dynamic import) and only loaded when the room is needed.
- Key files: `src/lib/boot/engine.ts` (the room), `bonsai.ts`, `rubiks.ts`, `baked-material.ts`, `sound.ts`, `assets.ts`, `BootIntro.svelte`; `src/lib/radio/*`; Blender pipeline `assets/3d/build_scene.py` (+ `props.py`, `gba_sp.py`); lightmaps are baked in two layers (day, lamp) per group so the lantern can be tinted live; WebP conversion via ImageMagick (room-* and props-lamp lossless, wall q95, others q92). A full bake is ~40 min CPU; re-exporting without re-baking is possible (`SKIP_BAKE=1`).
- Quality bar: no visible loss, judged by side-by-side screenshots the owner approves. Target: mid-range Android on 4G is the hard case; desktop must stay smooth.
- Live features that must keep working: hover outlines, mini-games (lantern tint, Rubik's cube, clock radio, bonsai trimming/growth on a turntable, animated pixel-art portrait), boot animation and dive into the Game Boy screen, return animation, lantern colour tinting all baked lighting live.
