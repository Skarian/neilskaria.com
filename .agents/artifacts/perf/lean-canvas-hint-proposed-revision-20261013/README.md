# Proposed lean canvas hint revision

Status: LOCAL proposed change ready for review. No production approval.

Branch: `perf/lean-canvas-hint-review`
Full commit SHA: `bcc409e43708ee7b543b53ca8f3700a8ef82ff14`
Sole parent: `a796e9aea60def6e0849cb75a151fd6570942339`
Commit message: `Use the canvas readback hint for the boot screen`

## Exact source change

Only `src/lib/boot/engine.ts:153` changes:

```diff
-const screenCtx = screenCanvas.getContext('2d')!;
+const screenCtx = screenCanvas.getContext('2d', { willReadFrequently: true })!;
```

The tree differs from the accepted baseline by one insertion and one deletion in one file. `proposed.patch` equals the reviewed `production-eligible-proposal.patch` byte for byte. The base blob equals reviewed `baseline-engine.ts`. The proposed blob equals reviewed `proposed-engine.ts`.

The accepted baseline preserves camera fix `042dc805`, the approved emoji fix, and original direct text rendering. No rejected glyph caches or panel preparation appear in this revision. All other paths match the baseline tree. No diagnostics, atlas, warmup, assets, dependencies, configuration, policy, timeline, audio, or font changes appear.

## Reviewed experimental preview

- [Hint](https://portfolio-l3mjwpd3y-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=will-read-frequently)
- [Original](https://portfolio-l3mjwpd3y-neil-skarias-projects.vercel.app/lab/boot?bootCanvas=default)
- [Deployment inspector](https://vercel.com/neil-skarias-projects/portfolio/BdRi826ZYAwiEyaDYXuqXKLL7iSn)

Deployment: `dpl_BdRi826ZYAwiEyaDYXuqXKLL7iSn`.

This diagnostic preview contains 93 allowlisted sources from the original baseline, diagnostic instrumentation, and the context option. It contains no atlas. The exact proposed commit has no diagnostic instrumentation and no separate hosted deployment. The preview is evidence for review, not production acceptance.

## Measured benefit and unresolved startup

Root accepted the measurements as evidence. Root retained the hint as the best lean review candidate.

Affected Android Chrome 154 on Adreno 740 measured first/replay text callback means of 33.905/32.682 ms for original and 16.683/16.685 ms for hint. Hint recorded zero text gaps of at least 42 ms. GPU measured 16.688/16.686 ms. The user reported original as slower and hint/GPU as about the same. Atlas has added memory, asset, and shader maintenance without a perceived benefit. Atlas remains experimental and is absent from this proposal.

The warmed matched startup pair measured original/hint create-to-ready at 964.4/1064.7 ms: hint was 100.3 ms longer. Create-to-START entry completion was 1983.7/2099.5 ms: hint was 115.8 ms longer. Model-to-assets was 539.8/676.6 ms, a 136.8 ms increase. Fonts-to-ready was 119.3/112.2 ms, a 7.1 ms decrease. The earlier 113.3 ms post-font gap did not recur.

Navigation-to-START completion was 2487.9/2439.4 ms, but upstream loading differed. That result does not clear the startup warning. Scene preparation includes CPU construction, bonsai/cube/buffer work, image decode promises, shader submissions, and scheduled yields. No measurement isolates the causal cost of this option.

Cold startup, native raster, driver, GPU, compositor, physical presentation, and remaining camera-tail issues remain unresolved. This proposal is not a proven regression-free fix. It does not establish that all stutters are fixed. No additional broad capture matrix is required for this bounded review candidate.

## Existing checks and their scope

The candidate passed formatting and Svelte type checks with zero errors and warnings. Local client/SSR compilation passed through a separate no-op adapter harness. The original Windows Vercel packaging attempt failed at symlink creation with EPERM. The hosted Linux preview later passed compilation, adapter packaging, serverless generation, and precompression. Its existing large-chunk warning remains.

Hosted verification recorded 107 passing checks. Actual context options and returned attributes matched original/hint modes. Actual JSON downloads, Svelte START entry completion, trusted full hint boot/return/replay, compressed model identity, and no atlas requests passed. The matched room restart procedure passed 16 checks. These hosted checks used desktop Chrome and do not establish affected-device native presentation behavior.

The affected-device startup analysis checked schema, byte identity, SHA hashes, source markers, mode attributes, and entry state. Both reloads entered room from loading and completed the true Svelte START animation without START clicks. Both reused immutable resources with 30 matching fingerprints. Neither recorded errors, longtasks, or dropped records. Negative worker durations remained in raw evidence and were excluded from interval arithmetic.

These prior source/type/build and preview checks apply to the diagnostic preview behavior. This task did not repeat desktop timing, install dependencies, or deploy the exact proposed commit. This task checked source identity and Git safety only.

Prior evidence:

- [Candidate](../lean-canvas-hint-candidate-20261013/README.md)
- [Preview delivery](../lean-canvas-hint-preview-20261013/README.md)
- [Affected startup findings](../affected-lean-startup-analysis-20261013/findings.md)
- [Affected startup metrics](../affected-lean-startup-analysis-20261013/metrics.json)

## Git and checkout safety

`before.json` records checkout branch, HEAD, status, tracked file hashes, real index SHA256, refs, and prior artifact hashes before Git mutation. `after.json` records the final state after the coordination append. `safety-verification.json` records the comparisons. Status comparison excludes only this task's new artifact directory.

The current checkout stays on `redesign` at `d82230acab7f4e2be780afd0847330a6926573d1`. Tracked source, real index, prior artifact bytes, and unrelated refs remain unchanged. The rejected checkout source is absent from the proposed baseline tree. The coordination append preserves all prior bytes.

The task used `proposal.index` in this directory for `read-tree`, `apply --cached`, and `write-tree`. It used `commit-tree` with the exact baseline parent. It checked that the target ref was absent and used atomic create-only `update-ref` with a zero old OID. No checkout switch, worktree, push, merge, reset, cherry-pick, history rewrite, PR, deployment, or settings change occurred.

The sandbox denied the initial evidence-directory creation. Narrow per-command Auto-review escalation approved the authorized commands. No approval refusal occurred. No private credential files were read.

The first pre-mutation script attempt stopped because new task evidence changed status. It performed no Git mutation. The corrected check excludes only this task directory. `propose-attempt1.py` and `git-commands-create-attempt1.json` preserve that attempt. `propose.py` and phase logs record the successful process.

Only local review is complete. Production release remains unauthorized.
