# Stage 4: deliver useful asset groups sooner

Candidate `aaab469`, base `fb9ce37`, branch `perf/stage4`, worktree `C:/projects/neilskaria.com-stage4`. 11 October 2026. **The asset/appearance work passes; the performance gate fails.** This candidate does not make the complete room ready sooner and does not satisfy the required Lighthouse non-regression. No push, merge or deploy.

## Implementation

The packer uses glTF-Transform to clone and prune five whole-root groups after the existing simplification, texture conversion and Draco settings. Shell retains the nightstand, lantern, portrait, bed, walls, floor plant and other decor. SP retains its entire hierarchy; Cube*, Clock* and Bonsai* are separate meaningful groups. It preserves both retained texture-coordinate sets and the shared external atlases. The original root order is a small table in shell scene extras, consumed and removed during assembly.

Each embedded texture belongs to one group: shell 12, clock 1, bonsai 2, SP/cube none. None is shared across these boundaries; no external texture-sharing layer is needed. Fifteen images yield fifteen distinct image hashes, with no duplicated bytes. All 53 material properties and sampler/image references match the original.

Shell and both decoder requests start first. When the small decoder wrapper finishes, SP, cube, clock, bonsai and all lighting/portrait/environment/chime requests start together. Model fetches use browser high priority; pictures retain ordinary priority. Every model keeps the PROD `.br`-first validation/fallback. One GLTFLoader and one DRACOLoader pool parse each group as its promise resolves. Bonsai generation starts from its own parsed transforms. The engine merges children into shell, restores root order and puts the turntable last as before. Common room preparation and the complete reveal remain gated on all groups.

Precompress now matches all five content-hashed room group names and writes their copies, encoding/cache routes and content-type overrides. A fixture verifies five Brotli round-trips, routes and overrides; deployed CDN behavior is not verified.

## Assets

| Group | Raw bytes | Brotli bytes | Nodes | Embedded textures |
|---|---:|---:|---:|---:|
| baseline | 1,183,392 | 965,768 | 97 | 15 |
| shell | 678,620 | 611,828 | 38 | 12 |
| sp | 155,316 | 85,612 | 33 | 0 |
| cube | 44,620 | 20,179 | 7 | 0 |
| clock | 68,580 | 47,541 | 10 | 1 |
| bonsai | 238,096 | 206,864 | 9 | 2 |

The five files total **1,185,232 raw / 972,024 Brotli bytes**, against **1,183,392 / 965,768**: **+1,840 raw (+0.16%) / +6,256 Brotli (+0.65%)**. Brotli uses the postbuild quality 11 and size hint. The other assets, including the atlases, portrait, reflection map, chime and console hull, are unchanged.

## Slow-phone A/B

Original `%TEMP%/perf/baseline.mjs`, actual 4× CPU, 150 ms RTT, 200,000 B/s download, 412×915, headless Edge/D3D11. Three fresh alternating runs each against fb9ce37 per mode, same owned Vite preview port 4250, HTTP 200 before launch, server stopped between labels. All twelve runs have zero runtime exceptions. They use the committed production code, without capture hooks.

Plain mode removes `.glb.br` copies from the preview output and exercises the normal short failed request plus raw fallback. Brotli mode uses copies and a local-only middleware with the same model encoding/type headers as the verified Vercel routes. This fixture compresses models only; it is not a deployed/CDN test. Decoder WASM and other local asset transfers differ from the deployed profile. Do not compare its absolute totals with the profile's 2.03 MB.

| Mode | Before runs ms -> median | After runs ms -> median | Change | Total wire bytes before -> after |
|---|---|---|---:|---:|
| Plain preview | 14421, 13959, 14981 -> **14421** | 15104, 14901, 15362 -> **15104** | **+683 ms** | 2,389,195 -> 2,393,207 |
| Brotli model fixture | 12853, 12791, 12740 -> **12791** | 13983, 13765, 13873 -> **13873** | **+1082 ms** | 2,171,293 -> 2,178,613 |

Plain request counts are 51 -> 59; correctly encoded Brotli counts are 50 -> 54. There is one successful fetch per model/texture. The extra plain attempts are the four additional `.br` fallbacks. All per-file request and finish times, byte counts and complete sample records are in [waterfall.json](waterfall.json); [waterfall.html](waterfall.html) plots the median sample from each label/mode.

The waterfall does show pictures requested much sooner. It also shows shell finishing much later while those transfers compete for the same bandwidth. Inference from that and the unchanged engine gate: the common scene/material/cube/picking/shader work loses the old model-first overlap with picture downloads. The 6,256-byte Brotli overhead alone adds only about 31 ms of transfer at this throughput and does not explain the one-second regression. Splitting files with a complete reveal is not itself enough to accelerate this engine.

### Ordering trials

Trial phone settings match the final phone profile. Readiness-only trials preserve the original harness's startup tracing/network/ready detection and omit its later idle probes. Trials are exploratory samples, not pooled into the final medians. Some also test earlier CPU preparation; those differences are labelled.

| Configuration | Plain ready ms | Brotli ready ms |
|---|---:|---:|
| Shell completion releases groups and pictures; worker after all groups | 15138 | 14103 |
| Both decoder files release groups/pictures; worker after all groups | 14968 | 14159 |
| Wrapper releases groups/pictures, model priority, early bonsai worker (selected) | 14764 | 13786 |
| Selected plus explicit low image priority | 14915 | — |
| Selected plus early lightmap upload and early audio setup | 15346 | — |
| Early lightmap upload, ordinary audio timing | — | 13677, 13813 |
| Wrapper release without model priority | 15159 | — |

The selected graph had the earliest simple ordering samples. More early uploads/extra priority parameters did not improve the target and were removed. The no-hint variant's single audit is exploratory, not part of either final A/B set. The final repeated result still fails the speed goal.

## Lighthouse 13.5.0

Four alternating mobile plus two alternating desktop audits **each**, in each transfer mode. All valid samples retained; all audit run-warning lists are empty and no runtime audit errors occur. Raw JSON is in [audits](audits/); medians in [lighthouse-summary.json](evidence/lighthouse-summary.json). The earlier set actually received correctly decoded Brotli models (verified network records), so it is retained as the Brotli set. The subsequent set explicitly removes those copies for plain fallback.

| Transfer / profile | Before TBT / score / SI / LCP | After TBT / score / SI / LCP |
|---|---:|---:|
| plain / mobile | 341.2 ms / 60.5 / 5131.1 ms / 14279.3 ms | 391.1 ms / 57 / 5690.6 ms / 14911.9 ms |
| plain / desktop | 113.0 ms / 82 / 1823.4 ms / 2462.7 ms | 58.0 ms / 82 / 1568.3 ms / 2813.3 ms |
| brotli / mobile | 294.5 ms / 62.5 / 4902.7 ms / 13151.2 ms | 295.0 ms / 62 / 5080.0 ms / 13623.9 ms |
| brotli / desktop | 76.5 ms / 87 / 1603.1 ms / 2030.5 ms | 109.5 ms / 89.5 / 1876.9 ms / 1249.8 ms |

**Non-regression fails.** In plain mobile, median TBT rises 49.9 ms, score falls 3.5 points, SI rises 559.4 ms and LCP rises 632.6 ms. Brotli mobile TBT is essentially unchanged, but score/SI/LCP still regress. Desktop measures vary and also do not satisfy every required metric. LCP remains the heading; its observed early paint and the simulated dependency estimate should not be confused with room-ready.

## Scene, pixels, picking and controls

Decoded comparison: all **97 nodes**, parents, world matrices, child order, primitive mode, index/attribute byte hashes and normalized/type flags match. Complete serialized properties for **53 materials**, texture images and sampler settings match. All **65 original scene roots** restore in original order. Packer's five trunk-root distance checks and console hull generation pass.

Final twelve viewport pairs (1280×800 and 412×915; wide, bonsai, cube, clock, lantern, portrait): **0 changed pixels, 0 maximum and mean channel delta**. Clock/date, dust and render time are fixed only for capture. Initial sequence captures had 9 pixels at the phone lantern UI shadow edge and later 16 at the phone clock UI edge; these results are retained. Re-capture lets finite UI transitions finish and freezes only infinite CSS animations. Three independently focused phone-clock pairs and same-build repeats match exactly; direct clock canvas comparison at 824×1830 also has 0 changed pixels. Camera matrices and panel bounds match. The committed engine has no capture hooks.

All seven picking parts on each viewport retain vertex counts and **0 support delta across 2,000 directions**. SP: 151; cube: 1308; clock: 474; lantern: 114; bonsai: 330/846; portrait: 36. Console hull JSON remains unchanged.

Desktop mouse/phone touch checks pass for each focus, Game Boy/START boot and return, cube turn/scramble/solve, bonsai trim, lantern color/brightness, radio tuning/display and power, mute/unmute, ready/focused SKIP and back. Additional checks without frozen simulation time pass watering (growth 1 -> 1.53), turning and reset to 1 on both viewports. The frozen capture hook intentionally prevents simulated growth, so its initial watering values are not used as behavioral evidence.

Held-engine SKIP, ready SKIP/Escape/return, START mid-`?land=2`, reduced-motion loading and reduced-motion first visit all pass with no exceptions. Pre-hydration SKIP/Escape handlers remove intro state in 1.8–2.3 ms with no room flashes. One next-frame measurement is 269.6 ms; state correctness is not a universal fast-paint guarantee. The supplied `tap-repeat` scenario label is not evidence of repeated physical taps. Audio resumes from trusted input and decoded chime playback occurs; audible listening and external station listening are not verified.

## Quality, determinism and workspace

ESLint and Prettier pass for all five changed code files; the packer is checked explicitly despite the default Prettier asset ignore. Svelte-check has only the documented `src/routes/+layout.svelte` missing `./$types` junction error, zero other errors/warnings. Sourcemap builds produce complete preview output and end with the expected adapter-vercel EPERM symlink failure.

Re-running the packer leaves **all 19 generated checkout files byte-for-byte unchanged**; the five changed GLBs also exactly match their committed Git blobs. The copied, unchanged `lightmaps.json` uses the checkout's CRLF while Git stores LF; only that existing text normalization differs from raw Git blob bytes. Canonical JSON and all model/image/hull bytes match. [determinism.json](evidence/determinism.json) retains hashes and this distinction.

`git diff --shortstat fb9ce37 -- ':!src/lib/boot/assets'`: **5 files changed, 105 insertions(+), 41 deletions(-)**. Asset diff: five binary files (one bedroom -> shell rename plus four additions), total sizes above. The local cache/middleware config is restored; temporary hooks are restored. All owned preview servers are stopped and the node_modules junction is removed before handoff. Worktree/branch remain for review.

- `2ff67d8` Pack the room into five useful groups
- `aaab469` Download and parse room groups while the pictures arrive

Both commits end with `Co-Authored-By: GPT-6.1 Sol <noreply@openai.com>`. No PR, push, merge or deployment. Unverified: physical phone, audible output/live station listening, deployed/CDN headers and performance. **Required outcome not achieved:** complete-room readiness and audit non-regression. The per-group files are a validated foundation for further work, not evidence that this Stage 4 candidate is faster.

## Per-file median-sample ledgers

Times are relative to the first navigation request as recorded by the supplied harness; finish = start + duration. Wire bytes include HTTP overhead. Full request ledgers (including JS, CSS and fonts) are in the JSON evidence.

### plain: baseline

| File | Request ms | Finish ms | Wire bytes | Encoding |
|---|---:|---:|---:|---|
| bedroom.mDI30nfq.glb.br | 1499 | 1666 | 203 | none |
| draco_wasm_wrapper.js | 1501 | 1850 | 12,080 | gzip |
| draco_decoder.wasm | 1503 | 4536 | 192,639 | none |
| bedroom.mDI30nfq.glb | 1670 | 9848 | 1,183,663 | none |
| bed-day.BC533XVw.webp | 9892 | 11759 | 59,232 | none |
| bed-lamp.ox8MhZdQ.webp | 9894 | 11106 | 34,964 | none |
| plant-day.BG3_w08z.webp | 9896 | 12041 | 70,374 | none |
| plant-lamp.CmpX6c0Y.webp | 9898 | 11277 | 41,838 | none |
| props-day.D4Qi5Pzz.webp | 9900 | 11898 | 64,110 | none |
| props-lamp.D5g_V8QY.webp | 9902 | 12938 | 105,879 | none |
| room-day.Bj5e9mIF.webp | 9905 | 12334 | 40,226 | none |
| room-lamp.CSe9vDz5.webp | 9907 | 12687 | 45,092 | none |
| wall-day.Jtrb4LN9.webp | 9909 | 12810 | 33,160 | none |
| wall-lamp.D6I1KUFl.webp | 9911 | 12918 | 34,434 | none |
| portrait.BzOMar63.webp | 9912 | 12610 | 13,722 | none |
| env.CZrC90Jt.webp | 9914 | 13198 | 44,896 | none |
| gba-boot.DcboyRJk.mp3 | 9915 | 13318 | 56,686 | none |

### plain: final

| File | Request ms | Finish ms | Wire bytes | Encoding |
|---|---:|---:|---:|---|
| room-shell.-Q40vLGb.glb.br | 1335 | 1517 | 203 | none |
| draco_wasm_wrapper.js | 1336 | 1765 | 12,080 | gzip |
| draco_decoder.wasm | 1338 | 6647 | 192,639 | none |
| room-shell.-Q40vLGb.glb | 1520 | 13048 | 678,890 | none |
| room-sp.BtJqwwNW.glb.br | 1774 | 1956 | 203 | none |
| room-cube.DhHibUE9.glb.br | 1777 | 1972 | 203 | none |
| room-clock.ChQX7fIZ.glb.br | 1780 | 2041 | 203 | none |
| room-bonsai.pRByn5lO.glb.br | 1783 | 2145 | 203 | none |
| bed-day.BC533XVw.webp | 1786 | 3854 | 59,232 | none |
| bed-lamp.ox8MhZdQ.webp | 1787 | 3261 | 34,964 | none |
| plant-day.BG3_w08z.webp | 1790 | 4354 | 70,374 | none |
| plant-lamp.CmpX6c0Y.webp | 1791 | 4617 | 41,838 | none |
| props-day.D4Qi5Pzz.webp | 1793 | 5864 | 64,110 | none |
| props-lamp.D5g_V8QY.webp | 1795 | 7519 | 105,879 | none |
| room-day.Bj5e9mIF.webp | 1797 | 5975 | 40,226 | none |
| room-lamp.CSe9vDz5.webp | 1799 | 7315 | 45,092 | none |
| wall-day.Jtrb4LN9.webp | 1802 | 7128 | 33,160 | none |
| wall-lamp.D6I1KUFl.webp | 1803 | 7691 | 34,434 | none |
| portrait.BzOMar63.webp | 1805 | 7627 | 13,722 | none |
| env.CZrC90Jt.webp | 1808 | 8702 | 44,896 | none |
| gba-boot.DcboyRJk.mp3 | 1810 | 9173 | 56,686 | none |
| room-sp.BtJqwwNW.glb | 1959 | 10895 | 155,586 | none |
| room-cube.DhHibUE9.glb | 1973 | 9101 | 44,889 | none |
| room-clock.ChQX7fIZ.glb | 2043 | 9699 | 68,849 | none |
| room-bonsai.pRByn5lO.glb | 2151 | 12154 | 238,366 | none |

### brotli: baseline

| File | Request ms | Finish ms | Wire bytes | Encoding |
|---|---:|---:|---:|---|
| bedroom.mDI30nfq.glb.br | 1228 | 8561 | 965,964 | br |
| draco_wasm_wrapper.js | 1229 | 1703 | 12,080 | gzip |
| draco_decoder.wasm | 1231 | 4433 | 192,639 | none |
| bed-day.BC533XVw.webp | 8598 | 10461 | 59,232 | none |
| bed-lamp.ox8MhZdQ.webp | 8599 | 9817 | 34,964 | none |
| plant-day.BG3_w08z.webp | 8601 | 10753 | 70,374 | none |
| plant-lamp.CmpX6c0Y.webp | 8603 | 10017 | 41,838 | none |
| props-day.D4Qi5Pzz.webp | 8604 | 10583 | 64,110 | none |
| props-lamp.D5g_V8QY.webp | 8606 | 11642 | 105,879 | none |
| room-day.Bj5e9mIF.webp | 8607 | 11075 | 40,226 | none |
| room-lamp.CSe9vDz5.webp | 8609 | 11426 | 45,092 | none |
| wall-day.Jtrb4LN9.webp | 8611 | 11519 | 33,160 | none |
| wall-lamp.D6I1KUFl.webp | 8612 | 11596 | 34,434 | none |
| portrait.BzOMar63.webp | 8613 | 11319 | 13,722 | none |
| env.CZrC90Jt.webp | 8614 | 11918 | 44,896 | none |
| gba-boot.DcboyRJk.mp3 | 8615 | 12041 | 56,686 | none |

### brotli: final

| File | Request ms | Finish ms | Wire bytes | Encoding |
|---|---:|---:|---:|---|
| room-shell.-Q40vLGb.glb.br | 1292 | 11895 | 612,024 | br |
| draco_wasm_wrapper.js | 1293 | 1740 | 12,080 | gzip |
| draco_decoder.wasm | 1295 | 6911 | 192,639 | none |
| room-sp.BtJqwwNW.glb.br | 1745 | 4400 | 85,807 | br |
| room-cube.DhHibUE9.glb.br | 1746 | 2495 | 20,374 | br |
| room-clock.ChQX7fIZ.glb.br | 1748 | 3451 | 47,736 | br |
| room-bonsai.pRByn5lO.glb.br | 1750 | 8638 | 207,060 | br |
| bed-day.BC533XVw.webp | 1751 | 5377 | 59,232 | none |
| bed-lamp.ox8MhZdQ.webp | 1752 | 5594 | 34,964 | none |
| plant-day.BG3_w08z.webp | 1753 | 7541 | 70,374 | none |
| plant-lamp.CmpX6c0Y.webp | 1754 | 6990 | 41,838 | none |
| props-day.D4Qi5Pzz.webp | 1755 | 8891 | 64,110 | none |
| props-lamp.D5g_V8QY.webp | 1756 | 10044 | 105,879 | none |
| room-day.Bj5e9mIF.webp | 1757 | 8861 | 40,226 | none |
| room-lamp.CSe9vDz5.webp | 1758 | 9048 | 45,092 | none |
| wall-day.Jtrb4LN9.webp | 1759 | 9683 | 33,160 | none |
| wall-lamp.D6I1KUFl.webp | 1760 | 9966 | 34,434 | none |
| portrait.BzOMar63.webp | 1761 | 9468 | 13,722 | none |
| env.CZrC90Jt.webp | 1762 | 10313 | 44,896 | none |
| gba-boot.DcboyRJk.mp3 | 1763 | 10562 | 56,686 | none |
