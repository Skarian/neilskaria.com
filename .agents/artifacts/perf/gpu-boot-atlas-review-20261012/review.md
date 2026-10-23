# Independent GPU boot atlas review

Decision: **Request one correction before experimental preview.** No approval for a reliable fix or production.

Source: `canvas-control-93+gpu-atlas-prototype-20261012-mip-grad`.
Stage digest: `54d77d25219eaa74962aff96684dea7ba08141be02d82d4d8bec74eb2f7299fb`.
Source references below are within `../gpu-boot-atlas-prototype-20261012/source-stage/`.

## Blocking defect

**B1 — P2: Atlas initialization does not own early rejection or failure cleanup.**

`src/lib/boot/boot-atlas.ts:96` immediately starts a rejecting fetch/decode promise.
`src/lib/boot/engine.ts:155` creates it before model loading, buffer preparation, and shader submission.
Its first rejection handler arrives through `Promise.all` at engine line 866.
A fast HTTP error, network rejection, or invalid image can produce an unhandled rejection before that boundary.

The later rejection exits `createRoom` without its explicit disposal path.
`BootIntro.svelte:202` assigns `engine` only after creation succeeds.
Its load catch hides the intro, but cannot dispose the unreturned room.
The new mandatory asset failure abandons initialized renderer and room resources without explicit cleanup.
This does not establish permanent allocation after garbage collection.

A read-only Node probe executed the exact readiness statement with a mocked HTTP 404.
It recorded `Error: Boot atlas HTTP 404` through `unhandledRejection` before the delayed await.
The delayed await subsequently rejected with the same error.
This confirms promise timing. It is not a full browser failure test.

Smallest correction: attach a rejection handler when creating the readiness promise.
Preserve failure for the readiness boundary. Do not report successful readiness or silently substitute canvas mode.
Dispose resources allocated during failed initialization before propagating failure.
Make atlas disposal idempotent. Close a bitmap that finishes decoding after disposal instead of assigning or uploading it.

Verify immediate 404, rejected fetch, corrupt bytes, and disposal during delayed decode.
Require intentional error reporting, incomplete readiness markers, and no unhandled rejection or retained live room after failure.
Then verify normal boot, return, and replay with one atlas request/submission and zero boot canvas work.
Update the hashes and manifest after correction.

## Code assessment

The successful path directly replaces the screen material and preserves its geometry and UVs.
There is no added draw, glyph geometry, intermediate canvas, render target, or recurring texture update.
Only readiness sets atlas `needsUpdate`.
CPU uniforms preserve ten letter transforms, colour order, domain, glint, fade, power-off, and solid return.
Both canvas modes retain their context, painting, texture, and power paths.

Installed Three is 0.186.1. Its ShaderMaterial conversion emits GLSL 300 ES and precision declarations.
`textureGrad`, derivatives, integer indexing, and uniform arrays fit the installed WebGL2 path.
Derivatives precede fragment-dependent rectangle clipping. Enclosing branches depend on uniforms.
I found no derivative-coherence, gamma-order, alpha-order, orientation, or clipping blocker.
Mask alpha composes in sRGB before linear conversion and normal output conversion.

The asset has transparent gutters, mipmaps, and explicit gradients.
Final images show no obvious rectangle seams or neighbouring-glyph contamination.
Eight-pixel gutters do not prove isolation at every coarse mip level or viewing distance.
Physical-device filtering remains unverified.

Normal engine disposal follows readiness. The pending-decode race is not demonstrated during normal boot.
A separate in-memory readiness probe disposed a mock texture before decode completed.
The code then assigned the bitmap and set `needsUpdate`. The bitmap remained open.
The retained disposal test starts after START. It does not test pending decode.
Loading-time route cancellation is also absent in the inherited BootIntro lifecycle.
Successful boot-disposal checks do not establish loading-cancellation safety.

## Visual review

I used `view_image` for all 33 retained canvas/GPU PNG pairs across three end colours and eleven times.
I inspected all sixteen final `3d-*` images, three amplified edge differences, and three isolated power-off images.
The other twelve of the claimed 45 comparisons retain solid-return centre values, not PNG pairs.
I reviewed those values and their generation script.

Text is readable. Settled spacing, overlap, screen-edge clipping, domain placement, and glint agree visually.
Atlas word edges appear slightly softer in isolated images.
No obvious visual artifact independently blocks diagnostic preview.
Mean RGB difference of 0.585/255 does not establish perceptual equality.
Maximum channel difference is 250. Up to 5,992 pixels exceed 32. Settled word bounds differ by one bottom pixel.
Solid-return centre channels differ by at most one. Power-off evidence records uniform `[29,32,29,255]`.
User review must decide whether edge changes are acceptable.
Windows font identity is inferred from matching declarations and platform-span reports.
Android canvas fallback is unknown. Typography equality is not established.

## Verification and diagnostic assessment

I independently checked the exact 96-file allowlist and every current hash.
Three changed files and three additions match the stated scope.
All 93 prior-stage hashes and 134 recorded main-file hashes match.
Asset SHA256: `e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e`.
The stage digest matches. Retained verification records unchanged HEAD and branch.
I did not execute Git commands.

I inspected scripts, logs, and results for 109 normal and 43 extended checks. All retained checks pass.
Formatting and type logs report success with zero type errors or warnings.
I independently rechecked four sample/download files with the retained schema validator without rewriting its results.
They pass revised and original structural schemas.
The custom validator implements the used structural rules, but is not a complete JSON Schema implementation.
Separate semantic assertions cover finite frame costs, completion, markers, and texture counters.
I did not repeat the full functional matrix.

GPU `paintMs` stays zero. `gpuPrepareMs` measures CPU arithmetic. `submitMs` measures whole-scene CPU submission.
Screen `onAfterRender` and texture `onUpdate` establish submissions, not GPU completion or displayed frames.
GPU mode does not fabricate canvas markers.
Session upload observations and per-run glyph/domain observations remain separate.
Completion means timeline completion. Missing markers, run IDs, errors, and mode-specific fields remain explicit.
Storage is bounded. Marker checks still execute each applicable frame.
Downloads remain local and user initiated.

The final timing script disables screenshots and runs control before GPU sequentially.
Final records report no errors or dropped data.
Excluded screenshot gaps, concurrent-Vite replay failure, and GSAP serialization hang remain separate.
There is no evidence that excluded runs were merged into the final pair.

## Limits after correction

Both RX590 arrival means remain about 16.7 ms.
Whole-scene arrival submission means are 4.73 ms for control and 0.79 ms for atlas.
This supports local CPU screening only.
No physical Android atlas result, native cause, presentation measurement, or startup causal comparison exists.
Atlas fetch-to-ready measured 71.2 ms locally. Shader-specific and mip generation costs remain unisolated.
The possible 176 ms startup penalty and 118.9 ms camera tail remain unresolved.
Lantern/radio stutters are not fixed by this stage.

Storage increases from an estimated 3.125 MiB original mip chain to 10.67 MiB for the atlas.
A retained bitmap plus atlas mips nominally totals 18.67 MiB. Actual GPU allocation is unmeasured.
These costs, target fonts, and startup behaviour prevent reliability or production approval.
No 50 ms or 42 ms acceptance gate was applied.

After B1 correction and verification, remaining findings permit **EXPERIMENTAL PREVIEW ONLY**, with these limits disclosed.
The package is hash-consistent. This review does not authorize deployment.

Scope: no source, Git, build, deployment, install, or settings edits.
Only this new review artifact was written.
The initial artifact write failed. The user-authorized narrow approval attempt created this file.
