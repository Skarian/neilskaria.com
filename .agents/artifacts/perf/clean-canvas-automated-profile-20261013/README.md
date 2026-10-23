# Automated clean-canvas profiling

Read [findings.md](findings.md) for the results and limits. Read [measurements.json](measurements.json) for exact values.

The native pairs are complete. The CPU pair and network baseline failed the trace-completion bound. Failed samples remain excluded.

- `original/manifest.json`, `hint/manifest.json`: exact commit blobs and SHA256 values.
- `exact-option.diff`: the complete proposal change.
- `verification.json`, `state-before.json`, `state-after.json`: source and Git identity checks.
- `runs/*/trace.json.gz`: complete native startup, first START, actual BACK, and replay START traces.
- `runs/*/interactions-trace.json.gz`: separate trusted lantern/radio interaction traces.
- `runs/*/failure-trace.json.gz`, `result.json`, and logs: retained failures and exclusion reasons.
- `runs/*/protocol.json`: the live Chrome CDP protocol.
- `runs/*/profile`: isolated Chrome storage/cache profiles.
- `runs/*/*proof.png`, `after-interactions.png`: functional proof after recording.
- `radio-native-detail.json`: radio input, native waits, and third-party requests.
- Scripts: extraction, build, CDP, external hook, bounded matrix, analysis, and native inspection.

No source or Git mutation is authorized or performed. Do not rerun the matrix without a new task because its eight measured sessions are complete. The corrected runner permits 45 seconds for trace completion, but existing runs used 10 seconds.

Reports use short controlled English. Exact ASD dictionary compliance is not certified.
