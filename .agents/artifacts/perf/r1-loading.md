# Round 1 · L (GPT-6 Astra) · Loading strategy

Key facts (measured from the waterfall, the code, and in-memory encoding tests):
- Phone waterfall: engine chunk 1.46–2.80 s; GLB 3.15–23.99 s; Draco 24.09–25.30 s; five lightmap groups loaded one after another 25.60–34.53 s; portrait 34.56–35.94 s; scene preparation, then the chime 41.18–41.93 s; START 42.69 s.
- Bandwidth floor: 6.55 MB at 1.6 Mbps is about 32.8 s. Running downloads in parallel can't get under that.
- Lightmap phase: 8.94 s for 1.585 MB, against an ideal 7.93 s. Parallelising saves about 1 s, not 9.
- GLB HTTP compression: raw 4,055,756 B; gzip-9 3,723,970; brotli-11 3,655,237. Only 0.33–0.40 MB saved. Vercel's compression allowlist doesn't include `model/gltf-binary`.
- WASM compresses from 192 KB to about 49–55 KB, and Vercel compresses wasm automatically.
- Draco is loaded from unversioned `/draco/` paths. Every other asset already has a hashed, immutable URL.

Proposals (ranked):
- **L1: lossless WebP for the two PNGs.**
  - Leaf texture in the GLB (EXT_texture_webp): 1,282,699 → 803,102 B.
  - Portrait sheet: 240,270 → 14,060 B.
  - Decoded pixels are identical. Saves about 706 KB, roughly 3.5 s on the phone. Effort M, low risk.
- **L2: replace the serial chain with a dependency graph.** Draco preload, concurrent lightmap groups, an independent portrait load, and an early chime fetch kept separate from audio setup. Saves 1–3 s. Effort M. Decode/upload bursts need controlling separately.
- **L3: poster, early exit and Save-Data.** Show an immediate small poster (50–100 KB), a "Continue to site" control that works before the engine exists, honest loading stages, and Save-Data/slow-network handling on the first visit. Better perceived wait; real room readiness unchanged. Effort M.
- **L4: returning-visitor preload downloads only.** Fetch at low priority; defer creating the renderer, PMREM and compiling until there's intent to enter the room. Removes about 3 s of work while people read the page. Cold readiness unchanged. Effort M–L.
- **L5: start critical downloads earlier.** A build-generated manifest plus the early visit decision starts the GLB before the engine chunk finishes (it currently starts at 3.15 s). Saves 0.5–1.5 s. Effort S–M.
- **L6: low-resolution lightmaps first, then full resolution.** Day and lamp layers would always switch together. Half resolution: 575 KB against 1,582 KB, about 5 s earlier first display. High visual risk (popping, PMREM captured with the low-res maps). Effort L; screenshots must pass.
- **L7: defer interaction-only preparation** (particles, trails). Visible objects stay complete from the first frame. Byte saving uncertain. Effort L.
- **L8: check production compression; pre-compress the GLB** only after repacking it.
- **L9: hashed/immutable Draco URLs.** Fine as a fix, but saves nothing on a cold load.
- **L10: service worker.** Only if a real need is shown. Zero first-visit gain.

Top 5: L1, L2, L3, L4, L5. Estimate from L1, L2 and L5 alone: 35–38 s cold on the phone. Bigger gains need the asset and GPU tracks.

Tempting but wrong:
- Loading the day layer first and the lamp layer later visibly changes the room.
- A service worker that precaches everything.
