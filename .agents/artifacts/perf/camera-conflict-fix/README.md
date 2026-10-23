# Camera tween conflict correction

Source baseline: 1aafb1102b0ceecbd179f21afeb9b270e0c246b9 on redesign.
Focused commit: 042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0.
Execution thread (confirmed live): thread:delegated-task:command%3Amcp%3A80542bac-c478-4132-82ff-eeb498252c1f%3Adelegate-task%3Acamera-conflict-fix-20261012-r1.

Exactly two added calls: gsap.killTweensOf(focusBlend), immediately before gsap.to in focus() and unfocus(). No assignment to the blend value; focus remains 1.1s, BACK 1.0s, both power3.inOut. No panel, picking, radio policy, or boot changes.

Two successful actual-UI captures, desktop 1280x800 DPR1, normal and 4x CPU. Windows headless Chrome 154 / ANGLE Radeon RX 590 Vulkan 1.3.260, AMD proprietary driver. Fresh isolated profiles; ordinary audio policy. Radio is engine object "clock".
Normal focus/BACK, two 100ms BACK/reselection sequences per object per rate, and BACK during forward focus all pass. Eight reselections have zero falling blend samples, remain at the current blend initially (easing/rounding), then increase to 1. Every settled BACK reaches 0; early BACK decreases monotonically from a partial blend. No console/runtime errors. Focused screenshots were visually reviewed.

Prior rapid radio data showed falling blend after registered selection, e.g. 0.979130 to 0.947546 in the first 250ms. Current 4x examples increase 0.990830 to 0.990978 (radio) and 0.993925 to 0.994025 (lantern) in the same window, with zero falling samples over the entire reselection. Reverse movement is corrected in this environment.
The prior report describes 3–4 retreating sampled frames; our summary counts strictly decreasing adjacent values, not all plateau frames before recovery.

Evidence: 1x.json, 4x.json, summary.json, four focused screenshots, scripts, capture.log. Prior evidence unchanged. capture-failed-launch.log retains one failed harness attempt with a relative Chrome profile path; corrected to an absolute path before successful runs. One premature analysis attempt preceded 4x.json; final analysis.log and summary reflect both completed captures.

Checks: npm run check: zero errors/warnings. Source Prettier and ESLint: pass. git diff --check: pass. npm run lint: all repository formatting passes; ESLint fails with 563 multiple-tsconfig-root parsing errors caused by discovering the existing .agents/worktrees/h3-resize-study tree. No config change.
Instrumented Node 24.21.0 build generates production client/server, but adapter-vercel packaging fails EPERM on its Windows function symlink despite an approved escalated command. Full build/precompression did not pass. This differs from the prior Node 26 unsupported-version failure. Preview used generated app output only.
Measurement hooks restored byte-for-byte before capture; committed source contains only the intended fix. Final clean-output rebuild and resource cleanup are recorded with the follow-up report.

Limits: instrumented engine callbacks measure blend and CPU submission, not display-presented frames or GPU execution. No physical phone, macOS, Android, or Safari verification. Missed clicks and Safari remain deferred. No push/deploy, dependency changes, or global settings.

Final verification: clean production client/server output regenerated with Node24.21.0 and checked across61 JS/map files: no __diag/__attrib/__profile/__probe hooks. Packaging still fails Windows symlink EPERM. All task-owned Chrome profiles removed after absolute-path checks; preview4292 stopped. Type/source-format/source-lint pass. Camera commit remains in HEAD history; unrelated later .gitignore-only archive commit a796e9a preserved. Expanded quantitative attribution reports: ../boot-text-diagnosis/README.md and ../interaction-attribution/README.md.
