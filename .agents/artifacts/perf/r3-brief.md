# Performance panel · Round 3 brief (final positions)

The original brief and rules are unchanged: see `r2-brief.md` in this folder. **Plan only.** Experiments go in `%TEMP%\perf\scratch\<letter>\`. Never use port 4173 or 5174, and stop any server you start before you finish.

Read every round-2 report first: `r2-A.md`, `r2-G.md`, `r2-J.md`, `r2-L.md`. The owner's review set is `shots-r2/`.

## Where round 2 landed (adjudicator's reading)
- **Asset track measured:** a scratch build with only the asset files replaced reaches phone START in 19.0 s (from 42.7 s) and moves 2.33 MB. Desktop START: 2.9–3.6 s.
- **Remaining phone critical path (A):**
  - 2.7 s of discovery before the GLB starts
  - 1.2 s of Draco decoder download
  - 1.0 s of serial lightmap pairs
  - 4.3 s of CPU between the last texture and START
- **Dropped:**
  - L6 (low-res lightmaps first)
  - meshopt (Draco at 14-bit wins, even with brotli)
  - KTX2
  - G2 as a separate item (folded into J1)
  - room-lamp 512² as a dispute: A's renders show it is indistinguishable, so it's withdrawn
- **G1 env map:** 8-bit sRGB at size 256, exported from the engine's own capture point, is a match (44.5 KB on the wire). Size 128 is rejected.
- **Android:** `KHR_parallel_shader_compile` is on only 0.21% of Android contexts, so ordering is the only lever there.
- **G3 idle cap:** 30 fps halves the emulated phone's idle main thread. The START ring alone costs 14.8 points. Anything under 20 fps needs the `dt` clamp changed.

## Disputes to close in round 3 (give a final position on each that touches you)
- **R1. Lightmap ladder.** Recommend one default rung and one fallback for the owner's flip test, e.g. WebP q95 sharp-YUV + wall 1024² + lamp maps at 512²; or AVIF q80. Weigh AVIF decode cost on the phone and Safari < 16.4. G: confirm or contest A's claim that G10's size saving is 82 KB, not 400 KB.
- **R2. Bonsai attachment-point stability.** Any GLB re-encode re-samples the twig attachment points (only 15% survive Draco), and the canopy visibly rearranges. This blocks A3.
  - Specify the fix: vertex-order-independent sampling in `bonsai.ts`, or points emitted by the packing script, or attachment data in `bonsai-foliage.json`.
  - Name who owns it and its exact acceptance test.
  - Saved user states (trimmed trees in localStorage) must survive.
- **R3. Idle CPU dropped from 88% to 65% with assets only** (no runtime change).
  - G/J: explain it, ideally with a measurement (picking hulls from simpler meshes? fewer vertices? texture sampling?).
  - Re-state G3's expected gain on top of the new baseline.
- **R4. The post-asset critical path.** Agree one concrete loading design that attacks the four items above, and one forecast for phone START after:
  - assets + loading
  - all tracks
  
  Separate measured from assumed.
- **R5. The 4.3 s CPU tail on the phone.** Break it down (shader links, texture decode/upload, bonsai, hulls, sound, PMREM) using the scratch build if possible, and say which items remove which seconds.
- **R6. Compile on Android.** Give the cheapest real-device protocol. The owner can plug a phone into USB for Chrome remote debugging. List exactly what to record, in which order, cold and warm (shader cache), so one session answers the open questions.
- **R7. G3 details.** 30 fps vs 20 fps, the `dt` clamp change, time-based parallax, and how the owner judges it (a recording spec).
- **R8. Foliage compaction details** (G9/J2): attribute formats, linear vs sRGB colour, whether a worker still pays afterwards, and the screenshot acceptance.
- **R9. Delivery.** Can Vercel serve a pre-compressed brotli GLB (adapter-vercel static output, `Content-Encoding`, caching)? Or should the GLB be fetched as a `.br`/other file and decompressed with `DecompressionStream` (gzip/deflate only; brotli isn't supported there)? Settle the −218 KB question with a concrete mechanism, or drop it.
- **R10. Latent defects found along the way** (the radio grille z-fight in close-up; anything else): classify each as in scope or a separate fix.

## Output
Write `.agents/artifacts/perf/r3-<letter>.md` with these sections:
1. **Final positions on R1–R10:** only those that touch you; one paragraph each, evidence-labelled.
2. **Final ranked list** for your track. Each item needs:
   - an ID
   - the change
   - its saving (measured or assumed)
   - quality risk, and whether the owner must approve visually
   - effort
   - re-bake or re-export needed
   - dependencies
   - the verification step
3. **Proposed implementation phases** for the whole plan, as you'd sequence them, with a commit point at the end of each.
4. **Anything you still disagree with,** to go to the adjudicator.

End your reply with a 10-line summary.
