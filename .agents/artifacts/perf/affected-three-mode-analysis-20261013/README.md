# Affected-device three-mode analysis

**Advance the minimal `willReadFrequently:true` hint as the lean preview candidate. Retain the atlas as an experiment.** Current evidence supports that bounded decision without another capture matrix. It does not establish production readiness or absence of startup cost.

The same-preview, source-matched captures independently validate. GPU/control text intervals remain about16.69 ms. Default remains33.91/32.68 ms on first/replay. Default replay retains slowdown. The user separately reports default visually slower, GPU/control “About the same,” and GPU text “Looks consistent.” These observations do not accept startup or production.

| Text window, first / replay | GPU atlas | Canvas control | Default |
|---|---:|---:|---:|
| Valid engine intervals n | 189 / 188 | 189 / 189 | 93 / 97 |
| Mean ms | 16.688 / 16.686 | 16.683 / 16.685 | 33.905 / 32.682 |
| p95 ms | 17.10 / 17.30 | 17.86 / 17.00 | 51.24 / 48.86 |
| >=42 count | 0 / 0 | 0 / 0 | 10 / 7 |
| >50 count | 0 / 0 | 0 / 0 | 8 / 2 |
| Previous submit mean ms | 2.51 / 2.42 | 8.85 / 8.39 | 3.06 / 2.79 |
| Previous total mean ms | 3.18 / 2.97 | 9.92 / 9.21 | 4.40 / 3.79 |
| Camera-tail max ms | 17.2 / 54.2 | 53.2 / 37.6 | 66.8 / 66.2 |

Text is 0.35<=boot<3.5. Quantiles use linear interpolation at (n-1)*p. Intervals belong to destination frames. Null/reset gaps and idle/site spans are excluded. >=42/>50 rates are descriptive, not acceptance limits. rAF independently agrees with the text contrast. All source-phase windows, counts/rates, means/p50/p95/max, previous callbacks and elapsed remainders are in [metrics.md](metrics.md) and [summary.json](summary.json).

The atlas saves about6 ms measured submission versus control, with equal perceived smoothness. Its nominal10.67 MiB mips plus8 MiB retained bitmap exceed the original3.125 MiB mips. Extra memory/code does not earn inclusion in the lean candidate. Actual allocation, shader execution, completion and presentation remain unmeasured. Shorter callbacks do not prove a cheap native shader. Timings nest inside total.

**Startup negative:** create-room-to-ready is GPU1842.6, control1257.5, default1107.7 ms. GPU is585.1 ms longer than control. Control is149.8 ms longer than default. GPU also records a362 ms startup long task and140 ms atlas decode. Response-end-to-ready is2298.7/1907.6/1631.4 ms, which is not pure CPU time.

Initial states differ. GPU loads into the room. Control/default load into the page, then perform a run0 BACK/return before START appears. Their START completion7953.6/7484.3 ms cannot be compared with GPU3627.5 as navigation readiness. Human waits, exact run0 events, network/cache evidence, promises, warm-draw boundaries and unobserved import/native timings are separated in [findings.md](findings.md). GPU has positive transfers for shared assets while control/default show cache reuse. No causal startup penalty or zero-cost claim follows from these one-trial differences.

The historical118.9 ms hint handoff does not recur. Smaller camera-tail gaps remain, without overlapping recorded markers, long tasks or resource requests at the worst intervals. Default powered returns remain about28 ms versus about16.6 ms for alternatives. Post-power-off intervals converge. No boot/recorded-return long task overlaps. See the complete negative findings and worst-gap neighborhoods in JSON.

This set strengthens evidence for a default canvas-path contribution. It does not identify exact raster/driver/GPU/compositor/scheduler cause. Fixed order, thermal state, caches, initial state and background load remain uncontrolled. Default being last and slow weakens only simple universal warm-up explanations. Historical data is not pooled. Camera, lantern and radio remain separate.

## Validation and handoff

Original hashes/byte counts match. Copies remain byte-identical: GPU432078/control438791/default336233 bytes. 1252/1250/942 frames. SchemaRevision gpu-boot-atlas-1 and corrected sourceId match. Four inspected staged source hashes match the preview manifest. Mode/context options, trusted first/replay, both returns, phase/gap reconstruction, bounds and mode-aware session/per-run markers pass. Drops/errors/missing markers are zero. Visible state, loaded fonts, reduced motion false and device/viewport match. Session counters are not boot upload counts.

Run `python analyze.py`, then `python report.py`. Both use stdlib only and write this directory only. Hash provenance is in summary.json. Semantic/source checks are in [verification.json](verification.json). [comparison.html](comparison.html) passes visual inspection at728/360px, heights611/663px, with no console messages or horizontal clipping. Root publishes it. [preview-inspection.json](preview-inspection.json) retains the inspection record.

Prior root preview inspection is accepted as supplied context. No source/build/Git/deployment/dependency/system action occurred. Main HEAD d82230a remains rejected. Original attachments and prior artifacts remain unchanged. Coordination record appended. Initial protected artifact write failed; narrow per-command Auto-review approvals succeeded. No refusal or bypass occurred. A schema BOM read error was corrected before final validation.
