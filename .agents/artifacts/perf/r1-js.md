# Round 1 · J (GPT-6 Astra) · JavaScript bundle and startup CPU

Key facts established (measured from existing artifacts):
- Main chunk 777,644 B raw / 206.8 KiB gzip / 171.7 KiB brotli: ~352 KB renderer, 239 KB three.core, 70 KB GSAP, 43.5 KB GLTFLoader, 7.3 KB DRACOLoader, 31.5 KB engine (raw). No Threlte in the room chunk.
- Phone trace: one 5,235 ms main-thread task (~35.75 s), containing ~791 ms image decoding and ~1,344 ms in GetProgramiv (nested).
- Inclusive phone/desktop: bonsai 1,057 / 291 ms; convex hulls 213 / 47 ms; cube 57 / 13 ms; sound setup 137 / 146 ms. sound.ts does not build noise at startup.
- Waterfall (phone): GLB starts 3.15 s; Draco 24.08 s; lightmap groups load sequentially (each group's day/lamp concurrently); portrait 34.56 s; chime 41.18–41.93 s.
- Meshopt decoder 7.6 KiB gzip vs Draco wasm+wrapper 73.4 KiB gzip (57.3 brotli). Vercel compresses application/wasm automatically.
- Second Draco copy: emitted by DRACOLoader's `new URL(..., import.meta.url)` declarations; never requested (1.3 MB build output only).

Proposals (ranked):
- J1 Interruptible createRoom (stages; scheduler.yield; 5–10 ms slices), also for the returning-visitor background preload; ~0 total CPU saved, removes multi-second blocking. Medium, 2–4 d.
- J2 Bonsai generation in a worker + remove redundant per-vertex clone/transform: 800–1,000 ms off main thread (phone), 200–400 ms real saving. Medium, 2–4 d.
- J3 Remove asset waterfalls: asset manifest separate from engine; start downloads while engine imports; Draco preload; lightmap groups concurrently; portrait alongside. 0.5–1.5 s wall time. Low–medium.
- J4 Audio out of the readiness chain: fetch chime early, set up separately. ~0.75–0.9 s off the serial chain.
- J5 Precompute picking hulls at build: 150–210 ms phone CPU; removes ConvexHull code.
- J6 Benchmark meshopt vs Draco (decoder −66 KiB gzip; total unmeasured).
- J7 Lazy-load mini-game controllers (3–8 KiB), cube templates (30–50 ms).
- J8 gsap-core only, replace two CSSPlugin fades: −6–8 KiB gzip.
- J9 Stop emitting unused Draco copy (build hygiene, 0 transfer).
- J10 Returning-listener YouTube prep under the same background budget.
- J11 Root `/` Badge pulls tailwind-variants (~20 KiB gzip) — only affects `/`.
- J12 Drop `document.fonts.ready` wait (0 observed saving); favicon compression on Vercel.

Top 5: J1, J2, J3, J4, J5. Tempting but wrong: swapping three for three.core / chasing Threlte; wrapping the whole initializer in requestIdleCallback or deferring visible objects until clicked.
