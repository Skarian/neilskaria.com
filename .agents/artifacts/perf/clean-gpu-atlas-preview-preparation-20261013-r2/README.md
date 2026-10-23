# Atlas preview preparation R2 — incomplete smoke gate; no publication

Exact source packaging passed. Phone-layout smoke passed. Desktop trusted functional destinations were observed, but the final replay START did not wait for the newly created START button's actual introend after radio close. The helper incorrectly accepted a cumulative count from the earlier lantern-close START. desktop/result.json contains no fifth START introend. The desktop browser was already closed when this audit found the gap. The authorized one desktop session was not reopened. **Do not advance or deploy from this result.** Root must resolve the missing desktop settlement check before assigning publication. This is a helper evidence gap, not a demonstrated runtime source failure.

## Source and protected identity

upload-stage/ is a fresh copy from clean-gpu-atlas-source-20261013/source/, never the old upload stage or rejected main redesign. It contains exactly 94 allowlisted files, 2,585,401 bytes; SHA256 stage digest:

a148564062b30b3fd51326eb023e3bbfa60bc49814323bb198051796092ed40c

Digest definition: sorted accepted manifest rows, UTF-8 path + NUL + lowercase SHA256 + LF. Full before manifest: upload-manifest.json, copied unchanged from accepted source manifest; actual full after manifest: stage-after-manifest.json. stage-before-smoke.json and stage-after-smoke.json match. PNG is 37,034 bytes, SHA256 e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e.

No helper, profile, trace, log, screenshot, metadata, .git, .agents, dependency, build output, or .vercel file is added to upload-stage. Original vite.config.ts, vercel.json, package.json and lockfile bytes remain exact. Camera, audio, font, and timeline source bytes remain exact.

identity-before.json and identity-after.json match: tracked checkout bytes, HEAD, branch, refs, index, accepted source/manifest, accepted atlas output/public/delivery, policies/research and previous validation identity. verification.json records success after cleanup. prior-evidence-before.json and prior-evidence-after.json verify preserved prior preparation files, excluding owned profile contents. No prior directory was deleted or moved.

This task served the existing accepted atlas SSR/client build read-only, without rebuilding/typechecking/reformatting. protected-build-summary.json records 116 atlas output hashes + 4 public hashes + 1 Brotli delivery hash unchanged (121 records). accepted-build-inventory-verification.json independently checks all 51 atlas client/delivery inventory rows against the accepted build inventory. The prior 231 combined original/atlas output verification is existing evidence, not a new 231-file claim here.

## Untimed browser evidence

T3 preview_status followed by preview_open explicitly reported no available host. Authorized owned headless Chrome/CDP fallback used Node v24.21.0 at C:/Users/Neil Skaria/AppData/Local/node24/node-v24.21.0-win-x64/node.exe. Exactly one fresh desktop profile and one fresh phone-layout profile were launched. Target was /lab/boot. Phone is desktop Chrome layout emulation at 390x844, not Android/Safari verification.

The final viewport captures are 1280x800 desktop and 390x844 phone. screenshots.json records actual PNG dimensions and hashes. Screenshots and DOM/full text are outside upload-stage:

- desktop/room.png, desktop/site.png, desktop/returned-room.png, desktop/lantern.png, desktop/radio.png, desktop/replay-site.png
- phone/room.png, phone/site.png, phone/returned-room.png, phone/lantern.png, phone/radio.png, phone/replay-site.png

Phone: trusted START -> site -> BACK TO THE ROOM -> room; trusted lantern open/close and radio open/close; captured actual new START introend -> trusted replay START -> site all passed. Both panels were captured after their existing Svelte introend. See phone/flow-checks.json, phone/resume-phone-commands.json and phone/result.json.

Desktop: START/site, BACK/room, lantern open/close and radio open/close, then replay/site were observed with trusted clicks. Final replay readiness is incomplete for the reason above. See smokechecks.json and preparation-result.json for the qualified result; desktop/flow-checks.json is the raw helper report, whose destination pass flags must not override that qualification.

The external functional helper records capture-phase introend and trusted click evidence plus bounded error/rejection collections; it is test-browser context only. It creates no helper UI and is not served or uploaded. No timing benchmark, source hook, GL query, native color-picker click, or external-account mutation occurred. No fixed-time pixel equivalence is claimed. Camera/audio/fonts/timeline fidelity is protected by exact source hashes, with functional screenshots only.

## Runtime, delivery and diagnostics

Both sessions: 0 runtime errors, 0 unhandled rejections, 0 failed local assets; all recorded clicks were trusted. Radio reached playing / ON AIR in both. No remote policy/network soft block was observed. Natural radio playback was the authorized test; remote resources were not independently refetched for body hashing.

Existing .glb.br request returned HTTP200, Content-Encoding br, decoded SHA256 4d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4 in both sessions. No compressed404 or raw fallback. */actual-local-resource-audit.json contains actual post-flow local HTTP statuses/body sizes/hashes, including atlas PNG; these are not inferred prior resource hashes.

DOM/control/global/resource and actual loaded JS checks found no shipped recorder, download/diagnostic control, manualJSON, renderer selector, experimental query switch or external helper marker. Native browser showDirectoryPicker/showOpenFilePicker/showSaveFilePicker globals are browser APIs, not app diagnostic globals. emitted-diagnostic-audit.json also checks accepted output JS/HTML/CSS (client and SSR); forbidden marker hits are empty. Functional helper selectors are in external artifact code only.

## Recovery, faults and cleanup

Old task server PID20448 and Chrome main PID26952 were freshly checked by command line against the old server.mjs and old owned desktop/profile path before Stop-Process. No PID-only termination occurred. Prior evidence/profiles are retained. recovery-process-verification.json and recovery-cleanup.txt record that action.

Own desktop PID20748 and phone PID13484 were closed with Browser.close. Own server PID35500 was freshly command-line-verified against R2/server.mjs before stopping. cleanup-processes-before.json / cleanup-processes-after.json show no remaining matching old or current task process. cleanup.json records ports4397/9937/4398/9947/9948 no longer respond. No unrelated process/profile/tab was used or closed.

Sandbox denied initial artifact-directory writes and CIM process inspection; narrow per-command Auto-review retries were approved. There was no refusal or bypass. Faults preserved: first desktop BACK selector selected footer radio POWER; viewport overrides reset after CDP disconnect and preliminary captures used default764x429; corrected connections set explicit metrics; desktop final replay introend gate remained insufficient; phone CDP initialization hit a startup race and retried the same browser once; phone helper interpolation produced a SyntaxError after radio close, then resumed the same already-settled room with actual introend verified before replay. Preliminary/fault command journals, helper versions and captures remain in this directory. No source fix was made.

## Review and handoff

User reports root accepted Astra R2 review conditionally: ../clean-gpu-atlas-evidence-review-20261013-r2/review.md. That review approves the unchanged experimental preview subject to packaging and local smoke. This task has not satisfied the entire smoke condition. No profiling was repeated. Recorded CPU benefit remains qualified; physical-counter certification, startup neutrality/general reliability and CPU4 observer failures are unchanged.

See deploy-handoff.md for the publication destination and hosted Linux source-build requirement. It is a handoff document only. No Vercel/auth/account/upload/install/deploy command, commit, push, Git/index/ref/checkout edit, dependency/system/account/policy change or production release occurred.