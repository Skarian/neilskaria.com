# Reproduce the startup comparison

Run `python .agents/artifacts/perf/affected-lean-startup-analysis-20261013/analyze.py` from the workspace. The script uses only the Python standard library. It reads the two supplied attachments, preview schema, and four staged source files. It writes only in this directory. Protected artifact permissions can require narrow per-command Auto-review approval.

Files:

- `original.json` and `hint.json`: byte-identical attachment copies.
- `analyze.py`: schema assertions, semantic checks, hash checks, and interval calculations.
- `metrics.json`: exact arithmetic, markers, resource entries, fingerprints, hashes, and checks.
- `metrics.md`: complete interval table.
- `findings.md`: recommendation, evidence, source meanings, and limits.
- `checks.md`: failures, corrections, and final checks.

| Copy | Bytes | SHA256 |
|---|---:|---|
| original.json | 14835 | ef43ea002c6c9f5fb0f8d3e008003301b65595d6e2bc9572dff4d502b9b67e3a |
| hint.json | 14265 | 25f0dd7c258ae83290e276326237a59a3fb3c3451aacc3c82ab9b0af88006bcc |

Both originals remain unchanged. No browser, source execution, build, deployment, dependency, system, application-source, coordination, or Git mutation occurred. All new files belong to this directory. Reports use STE100 structural guidance. They do not claim certified dictionary compliance.
