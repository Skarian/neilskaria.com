# Root review: smaller c2s non-bonsai preview and before/after performance (2026-10-14)

Status: COMPLETE. Root-accepted facts. The original deploy-task artifacts (D) are unchanged. This review adds root corrections.

Original evidence (D = `.agents/artifacts/perf/room-nonbonsai-preview-deploy-20261014-r1/`):

- [README](../room-nonbonsai-preview-deploy-20261014-r1/README.md)
- [Comparison](../room-nonbonsai-preview-deploy-20261014-r1/lighthouse/comparison.md)
- [Summary JSON](../room-nonbonsai-preview-deploy-20261014-r1/lighthouse/summary.json)
- Raw Lighthouse reports: [desktop](../room-nonbonsai-preview-deploy-20261014-r1/lighthouse/desktop/), [mobile](../room-nonbonsai-preview-deploy-20261014-r1/lighthouse/mobile/)
- Room-ready results: [roomready](../room-nonbonsai-preview-deploy-20261014-r1/lighthouse/roomready/)
- Results table: [lighthouse-results.html](lighthouse-results.html). It is a report only. Do not upload it with the app.

## Task

- Delegated task `room-nonbonsai-preview-deploy-20261014-r1` is COMPLETE. Latest terminal ordinal is 2: the background audit sequence completed, then the task continued.
- User authorizations: "Give me deploy link" and "Run Lighthouse before/after / real improvement".
- Root read the terminal output, the full README, the full comparison, both activity pages, and the tails of the relevant failure, deploy, audit and setup-check logs. Root also read roomready.mjs, lh.mjs, the intro hook and the protection records.
- Root independently parsed all 12 raw Lighthouse JSON reports and all 6 room-ready result JSON files. Root viewed the two after START-ready PNGs. No CPU test is still active.

## Deployment

- READY: https://portfolio-1byb9d6mi-neil-skarias-projects.vercel.app/lab/boot
- Deployment `dpl_Dxn4EkThRtiYLCDP66mfLgdeRysZ`, preview, project portfolio, scope neil-skarias-projects.
- One actual hosted source upload: 94 files, 2069303 bytes, digest `6588f6b5a6f1f60a0b36f4a1e2dcd4f48c9447a56885d652cf17cf7d71085efb`.
- Hosted bytes verified exact: c2s GLB 881512 bytes, sha256 `5110090d4c2a0508e2eb1666adc62c0d44c898a9a97437c1e72f8542eb555ed2`; Brotli 688868 bytes, sha256 `6fc32912d88bffcf755721789e2749399a7e8d60156b5f8bbe505da9228f452a`; plus the 8 private WebP files. The day, lamp, atlas, code and bonsai props are unchanged.
- Desktop 1280x800 and phone 390x844 both pass: START, site, BACK, lantern, radio, replay, no errors, failure and diagnostic controls, and raw fallback.
- The previous preview d8ciaj66d and production are preserved.
- The protected repo, Git, N/E/F/P and shared metadata are identical. The owned Chrome is closed. The ports have no listeners.

## Performance (accepted with these scopes)

Setup: BEFORE d8ciaj66d vs AFTER 1byb9d6mi. Same Windows machine, Chrome 154.0.8037.57, Lighthouse 13.5.0. Lighthouse was a user-requested, task-local, pinned install. No global or project dependency changes. Fresh isolated profiles, order B,A,B,A,B,A for each of the desktop and mobile presets. Equal edge warmup: 2 passes, 37 URLs, all status 200, 36 HIT each. All 12 reports are valid, with no runtimeError or runWarnings. The changed model and all 8 maps were requested. Do not compare with the user's older Mac 99/97 scores. The LCP element in all 12 reports is the NEIL SKARIA H1 intro, not the room. Benchmark index 2694–2843.

### Lighthouse

| Metric | Before (runs) | After (runs) | Median |
| --- | --- | --- | --- |
| Desktop performance | 89 / 90 / 89 | 92 / 94 / 92 | 89 → 92 |
| Desktop simulated LCP (ms) | 1908 / 1862 / 1932 | 1704 / 1351 / 1710 | 1908 → 1704 |
| Mobile performance | 49 / 45 / 55 | 79 / 55 / 57 | 49 → 57 |
| Mobile LCP (ms) | 11376 / 10427 / 7285 | 1798 / 9078 / 9088 | unreliable |
| Mobile Speed Index (ms) | 5827 / 5004 / 4628 | 4425 / 4642 / 4458 | unreliable |
| Mobile TBT (ms) | 746 / 1310 / 674 | 752 / 637 / 561 | unreliable |

- Desktop observed paint is about 647 → 651 ms, so it is unchanged. Do not say the actual paint got 204 ms faster.
- Mobile scores vary widely (before 45–55, after 55–79). Do not promise a general 8-point gain. The mobile LCP, SI and TBT effect estimates are unreliable.
- FCP and CLS have no meaningful, consistent change.
- Measured network total (median): mobile 1875334 → 1594183 bytes (−281151, about 15%); desktop 1935586 → 1654354 bytes (−281232, about 14.5%). This is measured request transfer, which is different from the earlier aggregate of file bytes.

### Room-first startup (separate CDP test)

Settings: 4x CPU slowdown, 150 ms network latency, download (1638.4*1024)/8 bytes/s, 412x823 viewport, DPR 1.75, mobile. Fresh cold cache, but a deliberate returning-visitor state (boot-seen=1, room-place=room). 3 B and 3 A runs, alternating.

| Measure (ms) | Before | After | Median change |
| --- | --- | --- | --- |
| START intro end | 12873.6 / 12760.4 / 13019.1 | 11286.2 / 11457.4 / 11576.4 | 12873.6 → 11457.4 (−1416.2, −11%) |
| START insertion (median) | 11796.1 | 10376.1 | −1420.0 |
| Map completion (median) | 9859.4 | 8055.8 | −1803.6 |
| GLB completion (median) | 6755.7 | 6521.9 | −233.8 |

- The ranges are separate: 12.760–13.019 s vs 11.286–11.576 s. Every A run was faster than every B run.
- These are completion times. They do not isolate the causal share of the model vs the map gain. The overall gain is consistent with less download, especially the maps. It does not prove each component's exclusive contribution.
- Room long tasks: B counts 19/18/18, totals 2847/2711/2805 ms; A counts 18/19/16, totals 2626/2813/2694 ms. Broadly similar with 3 samples.
- No FPS, GPU, display or animation-stutter gain was measured.

## Root corrections to the worker report

1. Desktop main-thread ranges do NOT overlap: B 1142/1194/1135 ms, A 1067/1125/1081 ms (min B 1135 > max A 1125). In this batch, A was about 5% lower. This is not universal proof. The worker's "overlap" comparison is wrong.
2. Mobile main-thread: B 5818/5787/4945 ms, A 4305/4643/4621 ms, so A was lower in this batch. Therefore a categorical "no CPU gain" is NOT supported. The CPU and render cause was not isolated, and the room long tasks alone do not exclude a CPU improvement.
3. A raw pixel shift of 0 does not mean pixel identity. Make no FPS claim.
4. The mobile values are Lighthouse default simulation, not a physical phone. The current test calibration is different from the Mac reports.
5. The worker's final statement about connector authorization is irrelevant, unsupported and not part of the task. No external connector work is recommended.

## Actual failures (all handled)

- The first `ls` of the owned folder failed. Heredoc quoting was corrected before the commands ran.
- T3 status/open had no host, so the task used the correct fallback.
- `chrome --version` was passed to the user's existing Chrome session and possibly opened a blank tab. This side effect is documented. It was not automation of the user's browser.
- The LCP audit field parser was updated for the Lighthouse 13 insight format.
- No approval refusals and no duplicate deploy.
- Task-local npm Lighthouse install used `--ignore-scripts`, `--no-audit`, `--no-fund`, and a local cache and userconfig. All measured runs were sequential. Summary and du processing ran after the audits.

## Conclusion

Root reports a verified preview with a strong, conditional room-loading gain of about 1.4 s and fewer bytes. The desktop score change is small and the mobile result is uncertain. The requests are COMPLETE. No further optimization or deployment starts automatically. The lantern/radio and animation stutter issues are unresolved and separate.
