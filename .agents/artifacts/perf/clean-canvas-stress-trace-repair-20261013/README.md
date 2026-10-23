# Trace repair and missing matched comparisons

The task completed exactly four new measured sessions. It completed no new native or interaction session.

- findings.md: measured tradeoffs, scope, and limits.
- measurements.json: complete startup, text, CPU, raster/service, clock, and presentation metrics.
- cadence-metrics.md and cadence-metrics.csv: all interval statistics.
- raw-trace-proof.json: trace hashes, bytes, events, EOF, loss, buffers, and command validity.
- runs/*: raw trace.json and trace.json.gz, result, completion metadata, CDP command journals/protocol, resource manifests, and owned profiles.
- original/manifest.json and hint/manifest.json: 91 exact Git blobs per variant.
- */build-copy-manifest.json: 115 exact copied build files per variant.
- network-payload-comparison.json: host, payload identity, and response normalization.
- failure-log.json and prior-failures.json: honest exclusions and technical corrections.
- verification.json and cleanup-verification.json: final source/Git and owned-process checks.

Scripts: prepare.mjs, server.mjs, cdp.mjs, run.mjs, analyze.mjs, enrich.mjs, complete-analysis.mjs, report.mjs. Node 24.21.0. Existing dependencies are read-only. Do not rerun measured sessions: the four-session budget is complete.

No source, Git, policy, dependency, system, production, or deployment change occurs. All writes belong to this new directory.
