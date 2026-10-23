# Room trim candidate: Vercel preview (r1), 2026-10-13

**https://portfolio-d8ciaj66d-neil-skarias-projects.vercel.app/lab/boot**

- Deployment `dpl_GxPpz3Vf4FrFzC95aXzfosznmna8` is READY. Target: preview. Project `portfolio` (QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw), scope `neil-skarias-projects`. Inspector: https://vercel.com/neil-skarias-projects/portfolio/GxPpz3Vf4FrFzC95aXzfosznmna8
- This was one deployment, made from a hosted source build (no `--prebuilt`) with CLI 62.4.0 on Node 24.21.0 and spawned by `tools/deploy.mjs`. The child-only env set `GIT_CEILING_DIRECTORIES` to P and `GIT_OPTIONAL_LOCKS=0`. Exit code 0. Logs are in `deploy/`. Vercel downloaded 94 files. The build kept the known npm peer-dependency (runed/kit) and chunk-size warnings. The CLI also printed a harmless warning: "Did you mean to deploy the subdirectory deploy?" (the cwd was P).
- Upload stage `upload-stage/` holds exactly the 94 E candidate manifest files: 2,350,541 bytes, stage digest (path NUL sha256 lines) `4eccb09bff282756b90c49216824f2ca3ee5034e82debf2116e00526a5302912`. Against the accepted atlas base (a1485640…2c40c), only `src/lib/boot/assets/bedroom.glb` changes (`2df7922e…4335`). There are no helpers, metadata, fixture, node_modules or .vercel files. Checked before upload (`verification/stage-copy.json`) and after (`stage-final.json`).

## Phone bonsai framing check (before deploy)

`tools/altprobe.mjs` was run on E's clean builds. Four fresh sessions in this order: baseline, candidate, baseline, candidate. Each used 390×844 at DPR 1 with E's seed, storage and click point. Each opened bonsai focus once and reopened it once, with a settled screenshot 4 s after each click. The panel bounds came from a test-side `getBoundingClientRect` hook. The camera pose is **not available** in clean builds, and no instrumentation was added. Results are in `framing/` and `verification/framing-shifts.txt`.

- The settled panel was identical in all 8 openings: x12 y574 w366 h258. Every opening also had the same reads during the opening (top 618.13).
- First opening, best whole-pixel shift: s1 baseline vs s3 baseline: 0. **s3 baseline vs s4 candidate: 0.** s1 baseline vs s2 candidate: −2. s2 vs s4 (both candidate): +2. So one candidate session (s2) was 2 px off, and the other candidate session matched the baseline exactly. The shift is not tied to the variant. It is run-to-run framing variance.
- Reopening shifted the view by ≥4 px from the first opening in both variants (search limit ±4). Baseline vs candidate on reopening: 0 and −1 px.
- There was no missing surface (`verification/framing-open0-s1b-s2c-s3b-s4c.png`). Page errors: 0. Rejections: 0. The only console warning is the known `KHR_parallel_shader_compile` warning.
- This is recorded as a known experimental-preview limit: the bonsai focus framing varies by a few pixels between runs and between openings, the same in both variants.

## Hosted checks

T3 `preview_status` reported that no preview automation host is available. The checks therefore used owned headless Chrome over CDP (`tools/session.mjs`, a copy of the clean-atlas deploy session with the expected model hash changed). One session each: desktop 1280×800 (`hosted-desktop/`) and phone layout 390×844 (`hosted-phone/`, desktop Chrome emulation).

Both passed: room, START (on its own introend), site, BACK to room, lantern open/close, radio open/close (`playing`, ON AIR), and replay START. All clicks were trusted. 0 page errors, 0 rejections, 0 CDP exceptions, 0 local HTTP failures, 0 external failures. No diagnostic globals, controls or bundle markers. Model `bedroom.Cup06qcx.glb.br`: HTTP 200, `Content-Encoding: br`, decoded 948,532 B with SHA-256 `2df7922e…4335`. No raw `.glb` request. The atlas PNG matched (37,034 B, `e7eb731d…fc6e`). No traces or timings were taken.

## Preserved

- The baseline preview `dpl_4qdrPjNH58JrG8v7yz8DoYSb4gHe` is still READY (preview) and returns HTTP 200 (`verification/inspect-baseline.*`).
- Production was not changed. The production list shows only deployments from 1,763 days ago or earlier (`verification/ls-production.*`). There were no domain, settings or Git-connection changes, and no commits or pushes.
- `identity-before.json` matches `identity-after.json` (`verification/protection.json`, no differing keys). The comparison covers HEAD d82230a, branch, refs, Git index, tracked file hashes, git status, ignore files, accepted source and manifest, shared node_modules metadata and junction targets, every E/F/clean-atlas-deploy file outside the profiles, the policies and the candidate GLB.

## Full-scene renders

See `full-scene/NOTE.md`: BEFORE and AFTER files for two angles, with identical cameras and inspection-only lighting.

## Cleanup

Every owned Chrome (4 framing sessions, 2 hosted sessions, 2 viewer sessions) closed with `Browser.close` and exit code 0. Nothing was force-killed. Every local server stopped through its own child handle. A final scan found no process with P in its command line apart from the scan shell itself, and no listener on 4392/4393/9932/9941–9943. The profiles stay in `profiles/` and `hosted-*/profile` (about 313 MB in `profiles/`).

## Limits

These are finite local samples. The phone check is emulated, not a real Android or Safari device. No startup or FPS gain has been shown. The bonsai framing cause is not isolated (it varies the same way in both variants). Radio playback was checked by status only.
