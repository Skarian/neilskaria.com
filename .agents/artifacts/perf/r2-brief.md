# Performance panel · Round 2 brief (cross-critique and experiments)

## Original brief, unchanged
- **Site:** neilskaria.com, a 3D bedside-table room at `/lab/boot`.
  - Stack: SvelteKit + Svelte 5 + three.js 0.186 + GSAP, deployed on Vercel.
  - Room code: `src/lib/boot/engine.ts`, `bonsai.ts`, `rubiks.ts`, `baked-material.ts`, `sound.ts`, `assets.ts`, `BootIntro.svelte`.
  - Radio: `src/lib/radio/*`.
  - Blender pipeline: `assets/3d/build_scene.py` (a full CPU bake takes about 40 min; `SKIP_BAKE=1` re-exports without baking).
- **Two goals:**
  1. Make the client download as small as possible without visible quality loss.
  2. Speed up startup and use CPU, GPU, memory and battery efficiently while running.
- **Targets:** the hard case is a mid-range Android phone on 4G. Desktop must stay smooth.
- **Quality bar:** no visible loss, judged by side-by-side screenshots the owner approves.
- **Everything must keep working:**
  - hover outlines
  - lantern tint across all baked lighting
  - the Rubik's cube
  - the clock radio
  - bonsai trimming, growth and turntable
  - the animated pixel portrait
  - the boot animation, the dive into the Game Boy and the return animation
- **Baseline:** `.agents/artifacts/perf/baseline.md`. Raw data is in `%TEMP%\perf\base\`; scripts are `%TEMP%\perf\baseline.mjs` and `gl.mjs`.
  - Phone emulation: 4× CPU throttle, 1.6 Mbps, 150 ms RTT, GPU not throttled.
  - Phone: room interactive at 42.7 s; 6.55 MB downloaded.
  - Desktop: interactive at about 4.4 s; idle room at 15% CPU (phone 88%).
- **Production preview:** running at http://localhost:4173/lab/boot. Do **not** rebuild into the repo's output folders.

## Round 1 results (read all four)
- `r1-assets.md`: A, the 3D assets expert. This is their own full write-up.
- `r1-loading.md`: L, the loading-strategy expert (summary).
- `r1-gpu.md`: G, the GPU and runtime expert (summary).
- `r1-js.md`: J, the JS and startup-CPU expert (summary).

## Round 2 rules
1. **Plan only.** Do not change anything in the repo except your own output file.
   - Put experiments in `%TEMP%\perf\scratch\<your-letter>\`.
   - To try a code change, copy what you need there, or inject it through CDP (the harness pattern in `gl.mjs`).
   - If you need your own preview build, build from a copy of the repo with its own outDir and port. Never use port 4173.
2. **Critique the other three experts' proposals:**
   - **Agree:** say why.
   - **Disagree:** give evidence.
   - **Overlap:** say which version to keep.
   - **Interaction:** e.g. once the assets shrink, does an idea stop paying?
3. **Settle the disputes below with small measurements wherever you can.** Label every number as measured or assumed.
4. **Revise your own proposals** in light of the others: drop, merge or re-rank them.
5. **Write your output to `.agents/artifacts/perf/r2-<letter>.md`** with these sections:
   - Critiques
   - Experiments (method, result)
   - Revised ranked list (savings, risk, effort, re-bake yes/no, how to verify)
   - Open disputes for round 3

## Disputes and questions to settle (all experts; take the ones in your area first)
- **D1. Lightmaps** (A7/A8 vs G10 vs L6):
  - Is lossy WebP q95 sharp-YUV (or AVIF) invisible, including at lantern extremes (red, blue, brightness 1.5) and in close-up focus views?
  - Is the wall at 1024² invisible on the portrait close-up?
  - Once the lightmaps total about 400 KB, does progressive low-res-first loading (L6) still pay? A says room-lamp is 1024² (not 2048²), and that 512² fails at 41 dB.
- **D2. Baked environment map** (G1):
  - Does an 8-bit sRGB cubeUV WebP (size 128, half exposure, 2× intensity) match today's half-float size-256 PMREM on the Game Boy shell, screen cover and cube?
  - What are the real link-time and wire costs? A quick proof of concept through CDP is welcome.
- **D3. Shader compilation:**
  - G2 (`compileAsync`, KHR_parallel_shader_compile) vs J1 (an interruptible createRoom). Combine or choose?
  - Is the parallel-compile extension present on typical Android Chrome (Adreno/Mali)? Cite evidence.
  - How much of G2's gain survives after G1 and G11?
- **D4. Bonsai** (J2 worker vs G9 attribute diet): overlap and order? Measure the foliage's actual vertex count and buffer bytes in the running page.
- **D5. Idle frame scheduler** (G3): is 24–30 fps idle visible on motes, sway and the parallax settle?
  - Is a render-on-demand variant better?
  - What's the actual measured CPU saving through a CDP-injected throttle?
- **D6. Geometry** (A3/A6/A5, Draco vs meshopt, L8):
  - After A3, is the 188 KB Draco wasm (about 50 KB compressed by Vercel) still worth it over meshopt plus a pre-compressed glb?
  - Confirm or refute A11 once static pre-compression is allowed.
- **D7. Order of work:**
  - What is the realistic phone room-interactive time after the asset track alone, then after asset + loading, then after all four?
  - Which items become pointless once others land?
- **D8. Verifying on a real device:** the phone emulation doesn't throttle the GPU. What is the cheapest credible check (remote debugging a real Android over USB, a WebPageTest Moto G, etc.)? The owner can plug in a phone if needed.
