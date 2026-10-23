# GPU boot atlas prototype

Ready for root code and fidelity review. No deployment, commit, or push occurred. Main HEAD d82230a remains rejected.

The stage copies the deployed canvas context control after all 93 manifest hashes pass.
The final source allowlist has 96 files. Only engine.ts, diagnostic.ts, and context-control.ts change.
Added files are boot-atlas.ts, boot-atlas-metrics.json, and public/boot-atlas.png.
The a796e9a reference and approved camera 042dc805 remain. Main source, HEAD, branch, and prior source hashes pass final verification.

**Review these files:** [source diff](gpu-atlas.diff), [upload manifest](source-manifest.json), [pixel results](fidelity/results.json),
[layout measurements](fidelity/layout-analysis.json), [local timing](local-comparison.json), and [full implementation notes](implementation-notes.md).

The candidate is /lab/boot?bootCanvas=gpu-atlas. The primary reference is ?bootCanvas=will-read-frequently.
Default mode retains omitted Canvas2D context options. All three modes remain available.

**Implementation.** One shader replaces the material on the original screen mesh. It samples the offline atlas directly.
The screen geometry clips enlarged letters. There is no added screen draw, geometry, video, render target, or intermediate canvas.
Original time, transforms, colours, alpha order, domain glint, runtime fade, power-off, and solid-return fade remain.
CPU arithmetic still prepares ten letter transforms and colours. Font measurement, raster painting, and recurring boot texture uploads disappear in GPU mode.
Existing cameras, sound, panels, radio, resolution, and startup warm draws remain.
The asset promise joins the existing readiness boundary. No extra warm draw or artificial delay occurs.
Ordinary mipmaps are generated once at upload. Explicit gradients prevent clipping-branch mip seams.

**Size and fonts.** The single 2048x1024 PNG is 37,034 bytes. Its base RGBA8 estimate is 8 MiB.
The mip chain estimate is 10.67 MiB. A retained bitmap plus that chain nominally totals 18.67 MiB, excluding copies and driver overhead.
This exceeds the original texture's roughly 3.125 MiB mip-chain estimate.
The installed Windows Chrome generator and sharp add no dependencies. Font declarations, platform-span reports, and font-file hashes are retained.
Windows spans report Arial Black. Canvas identity is inferred. Android fallback can differ. Target font equality is not claimed.

**Validation.** Formatting and types pass with zero errors or warnings. 109 normal flow checks and 43 extended checks pass.
They cover trusted first/full replay, return, skip, interrupted return, power-off, and disposal during boot.
Four sample/download files pass schema checks. GPU data needs mode-aware analysis.
The GPU capture records zero boot canvas paints/requests/uploads, one atlas request, and one onUpdate submission.

45 isolated pixel comparisons cover every requested time, three end colours, intermediate fade, and solid returns.
Actual 3D screenshots are named 3d-*. Pixel differences remain and require root review.
Maximum whole-screen mean absolute RGB difference is 0.585/255. Maximum channel difference is 250.
Up to 5,992 pixels exceed a 32-level channel difference. Settled word bounds differ by one bottom pixel. Domain bounds match.
Coverage and centroids differ. Solid-return centre channels differ by at most one. Power-off is uniformly [29,32,29,255].
These are observations, not approved fidelity tolerances. Filtering and target typography remain review items.

**Local screening.** The final screenshot-free ordered Windows RX590 pair averages about 16.7 ms arrival gaps in both modes.
First arrival submission means are 4.73 ms for control and 0.79 ms for GPU.
Maximum recorded callback gaps are 18.9 ms and 19.7 ms. Atlas fetch-to-ready is 71.2 ms, including 35.7 ms decode.
Room-create-to-ready examples are 1115.7 ms and 978.2 ms. Caches and order confound startup comparisons.
There is no physical Android result, reliable fix claim, GPU completion timer, or presentation measurement.
Shader-specific startup duration remains unmeasured. The local driver lacks KHR_parallel_shader_compile.
The affected camera-tail gap and possible startup penalty remain unresolved.

**Diagnostics and negatives.** schemaRevision is gpu-boot-atlas-1. Original clocks, windows, bounds, labels, and local-download privacy remain.
paintMs stays zero in GPU mode. gpuPrepareMs measures CPU uniform preparation. submitMs retains whole-scene submission timing.
GPU markers follow actual screen onAfterRender callbacks. Canvas paint markers are never fabricated.
Session atlas and per-boot glyph observations have separate missing-marker rules. Completion means timeline completion.
Detailed semantics and instrumentation limits are in implementation-notes.md and capture.schema.json.

Retained negatives include screenshot-induced 0.8-second gaps, a concurrent Vite reload, and a corrected CDP timeline-serialization hang.
Linear-only filtering showed jagged edges. Naive mip filtering showed seams. The final gradient-corrected mip candidate addresses those observed regressions.
Excluded runs and probe files remain for audit. They are not combined with the final normal pair.

**Handoff.** Root must review code and fidelity before a separate preview deployment task.
Upload only the exact 96 source-stage files in source-manifest.json. No artifact, research, secret, dependency, or generated output belongs in that upload.
No packaging or deployment was attempted. The known Windows Vercel symlink EPERM issue was left for the later Linux source build.
Run check.mjs, validate.mjs, extended.mjs, and fidelity.mjs sequentially with installed Node24 from the repository root.
Then run the analysis scripts, verify-json.py, and finalize.mjs. Never rerun prepare.mjs over this retained stage.
cleanup.json records stopped task-owned processes and ports.
