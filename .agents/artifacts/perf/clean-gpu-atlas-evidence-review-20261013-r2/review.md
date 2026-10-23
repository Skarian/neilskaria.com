**Decision: APPROVE the unchanged clean experimental preview.** Publication remains conditional on the separate execution worker's source, packaging, and untimed local app smoke checks. The packaged source must match the accepted allowlist and atlas digest. This decision does not approve production.

The recorded CPU contrast and raw cadence separation support this limited decision. R1's requested checks are complete enough for preview. Both CPU4 strict audits remain failed. Counter semantics, startup neutrality, physical presentation, and general reliability remain unresolved. I found no concrete material startup, first-use, fidelity, or cleanup blocker in the supplied evidence. No runtime revision or additional capture is required for this verdict.

I reviewed with GPT-6 Astra at extra-high reasoning. I read the applicable AGENTS.md, models.md, STE100 skill, [R1 review](../clean-gpu-atlas-evidence-review-20261013/review.md), and [source review](../clean-gpu-atlas-source-review-20261013/review.md). I inspected the new scripts, compact native extracts, command records, source excerpts, and corrected images. Read-only inline calculations checked the accounting and image statistics. I did not run a browser, build, test, project script, Git command, or child agent. I did not load or recompute full traces. This review.md is my only write.

Evidence references below use [P](../clean-gpu-atlas-startup-state-profile-20261013/README.md), [S](../clean-gpu-atlas-stress-counterpart-20261013/README.md), and [N](../clean-gpu-atlas-native-audit-20261013/README.md). P contains O1/A1/A4. S adds O4. N contains the native audit and corrected fixtures. Historical statements in P and S remain stage records. This verdict uses the completed evidence and the qualifications below.

**1. R1's CPU-counter objection: addressed for preview, with the physical qualification retained.**

I independently summed every retained RunTask in N's four compact native files. All eight windows reproduce the stored lower, upper, and task-wall totals. They also agree with the original analysis files and P/comparison.json. I checked native timestamps, renderer identities, boundary intersections, and window lengths. Each window remains 3150 ms.

The compact records contain no duplicate or overlapping RunTask wall spans. They contain no negative counters or backwards finite adjacent thread endpoints. Missing tdur and tts occur together. These checks exclude several accounting faults. They do not certify the clock or unaffected counters.

R1's O1 task remains anomalous: native index 177841 has 4.958 ms wall duration and 6.761 ms tdur. The child context also retains the inconsistency. Between indices 177846 and 177849, wall time advances 41 microseconds while the thread counter advances 1907 microseconds. The adjacent task endpoints do not reverse. This locates the inconsistency without explaining its cause.

The anomaly also occurs in atlas. A1 has excesses of 1.498 ms in first text and 1.472 ms in replay. O1 first-text excess totals 1.804 ms across two tasks. Other windows retain their smaller excesses. The audit does not selectively repair original or silently clamp counters.

[N/audit.mjs](../clean-gpu-atlas-native-audit-20261013/audit.mjs) implements the stated fallback. Impossible or missing counters contribute zero lower and overlapping task-wall upper. Clipped tasks retain zero lower and overlap upper. Other fully contained records retain their finite tdur. I independently reproduced that arithmetic and the separate exclusion of entire anomalous tasks. These are accounting sensitivities. They are neither confidence intervals nor corrected physical CPU truth.

The independently reproduced recorded ranges, in milliseconds, are:

- CPU1 first: O1 433.177–436.620 versus A1 256.160–257.767. The endpoint reduction is 40.494–41.331%.
- CPU1 replay: O1 410.312–412.710 versus A1 248.905–250.241. The reduction is 39.012–39.690%.
- CPU4 first: O4 670.650–687.798 versus A4 331.230–339.578. The reduction is 49.366–51.842%.
- CPU4 replay: O4 568.580–583.491 versus A4 336.412–344.602. The reduction is 39.393–42.345%.

The formula is 1 − atlasUpper/originalLower through 1 − atlasLower/originalUpper. Fallback reductions remain 39.899–41.833% and 39.363–40.375% for CPU1. They remain 49.361–51.847% and 39.394–42.353% for CPU4.

Subtracting the entire original observer wall budget from the original fallback lower leaves positive margins against the unchanged atlas fallback upper. Those first/replay margins are 161.987/154.832 ms for CPU1 and 286.627/189.115 ms for CPU4. I reproduced these values. They bound the specified recorded contributions, not indirect tracing, scheduling, or cache effects.

**2. R1's missing O4 comparison and failed A4 gate: completed without changing the gate.**

I inspected S/run.mjs, runner-exception.json, measured command journals, audits, result records, trace completion records, and profile-clone metadata. The runner permits only O4. Its exception bypasses only the preceding A4 observerBound gate. The original audit script remains byte-identical.

O1/A1 audits pass. A4/O4 both retain audit.pass=false and observerBound=false. Every other recorded audit check passes. result.valid=true means collection completed. It does not override the failed audit.

The measured command records confirm successful CPU4 throttle commands, identical trace categories, native network settings, and enabled disk caches. Browser version, viewport, DPR, and normalized launch flags match. The hook hash matches across all four sessions. Original and atlas manifests match their respective earlier records. Trace completion records report EOF and no data loss.

Both START inputs follow actual introend events. Verified first-letter markers and hook restoration precede the remaining text measurement. Each marker lies inside one selected native callback. The maximum recorded clock residual remains below both marker-to-callback-edge margins in all eight cases. These checks support semantic alignment. They do not identify the first physical glyph presentation.

O4 uses the documented clone of the completed O1 profile. A4 reuses A1's profile. The clone record reports 573 matching files and identifies the source through O1/result.json. I checked that correspondence without reopening profile contents. Actual disk-cache counts are O4 32/33 and A4 33/34. Both retain the Brotli model response, expected decoded hash, and no raw-model fallback.

Trace-start commands are 20.728 minutes apart. Variant order, OS activity, and driver caches remain uncontrolled. These are ordered pairs without session replicas. Replay and individual frames are not independent session replicates. This limits causal strength and population claims, but does not erase the large descriptive contrast needed for an experimental preview.

**3. R1's outlier and window objections: addressed with fixed endpoints and unchanged cadence.**

N's whole-task exclusions keep both original window endpoints fixed. I independently identified each marker task from the semantic timestamp. I also checked the outlier task identities and reproduced their separate and combined exclusions. Earlier textExcludingBoundary values remain labeled as shortened windows.

Combined marker/outlier exclusion preserves reductions of 40.827–41.017% and 39.305–39.460% for CPU1. CPU4 retains 50.604–50.826% and 40.650–40.836%. These exclusions remove application work too. They do not produce observer-free measurements.

I checked all six A4 and three O4 recurring observer outliers against the native extracts, analysis records, and S/sensitivity.json. Callback, enclosing-task, and presentation values agree, including unavailable startup predecessors.

The first-text A4 callback remains 1.011 ms wall and 0.233 ms recorded CPU inside a 15.221 ms task. O4's corresponding flagged callback is 1.666 ms wall and 0.446 ms recorded CPU inside a 19.509 ms task. Each surrounding virtual presentation interval is 16.666 ms. The local extracts retain adjacent callbacks and presentation records. These facts neither identify the cause of the wall/CPU difference nor prove the callbacks harmless.

I recomputed gaps from the retained raw timestamps. The sparse rAF arrays also match the original result.json arrays within each window. No task exclusion deletes or joins cadence intervals.

- CPU1 has 188 rAF gaps per text window, means near 16.666 ms, and no gap at least 25 ms.
- A4 first/replay means are 16.665/16.666 ms, with no gap at least 25 or 42 ms.
- O4 first/replay means are 18.540/18.762 ms. Both have 17 gaps at least 25 ms, with 2/4 gaps at least 42 ms.
- O4 virtual presentation independently retains 18/17 gaps at least 25 ms and 2/4 at least 42 ms. A4 has none.

This is useful flagged evidence of cadence separation under CPU4. CPU counters and cadence remain distinct measurements. Headless virtual presentation is not physical display timing. Native callback means combine multiple loops and must not become FPS claims.

**4. R1's phase-specific observer and startup objections: retained and bounded for this decision.**

I recomputed observer budgets from each analysis file's individual observer records. They agree with N's phase records. I also compared startup, both prefixes, both handoffs, full activations, and return separately.

A4 startup contains 54.841 ms of observer wall duration, including a 22.734 ms maximum callback. O4 startup contains 26.467 ms, with a 4.474 ms maximum. The text-only gate cannot qualify startup or every interaction phase.

Recorded atlas task aggregates are lower in the compared phases. A stronger statement about improvement in every phase would be unsupported. After full original observer-wall subtraction, both CPU1 prefixes have inconclusive margins of −2.926/−2.322 ms. CPU4 replay handoff has an inconclusive margin of −0.774 ms. These results do not establish a material adverse atlas change. Non-text counters also lack the new complete text-window invariant audit.

Cold navigation-to-introend is A1 2257.6 ms versus O1 2287.8 ms. A1's longest startup task is 149.176 ms versus O1's 142.840 ms. Keep both observations. The longer atlas task must not disappear behind a favorable aggregate.

Warm navigation-to-introend is A4 3824.8 ms versus O4 4080.6 ms. Their longest startup tasks are 161.265/186.917 ms. Warm startup does not establish cold-start neutrality. The prior +585/+735 ms startup result remains cache/state-confounded. This evidence does not establish a reproducible moved startup stall or certify startup neutrality.

The accepted source still requires atlas readiness at the existing asset boundary. That dependency and the larger allocation remain preview risks. No supplied first-use, handoff, return, error, or cleanup record establishes a concrete blocker for this limited decision.

**5. R1's incorrect background objection: corrected, with real raster differences retained.**

I inspected [fade-comparison.png](../clean-gpu-atlas-native-audit-20261013/fidelity/fade-comparison.png), [solid-return-comparison.png](../clean-gpu-atlas-native-audit-20261013/fidelity/solid-return-comparison.png), and the enlarged fade-edge image. I read N/fidelity.mjs and fixture-parameters.json. Both corrected states use #f6f1e7.

The accepted source module hashes and transpiled fixture module hashes match the earlier fixture. Projection, UV orientation, dimensions, filters, and mipmaps remain unchanged. Only the selected state inputs, background, output locations, and diagnostic background reference change.

I independently decoded the original and atlas PNGs and reproduced the stored pixel statistics:

- Fade at t=3.7 has mean absolute RGB difference 0.295303/255 and maximum channel difference 139. It has 58,395 changed pixels and 2,678 pixels above delta 32. Reported threshold bounds match at [66,196,902,493].
- Solid return at fade=0.7 has maximum channel difference 1 across all 614,400 pixels. Original is uniformly RGBA #494845ff. Atlas is uniformly #4a4845ff. There are no edges or geometry differences in this flat state.

The enlarged fade crop shows softer atlas coverage along glyph edges. I saw no missing glyph, new seam, or large new clipped region. This is sufficient fixture fidelity for preview, with the appearance difference disclosed.

R1's old exact-return claim used the wrong background and is excluded. The earlier corrected #1d201d off fixture remains separate. These fixtures do not establish exact visual identity on the moving screen or throughout the full scene.

**6. Source, removed work, memory, and cleanup scope.**

The baseline remains original91 at a796e9aea60def6e0849cb75a151fd6570942339, including camera042dc805. Rejected d82230a and the rejected context hint are not baselines. The approved atlas94 digest remains a148564062b30b3fd51326eb023e3bbfa60bc49814323bb198051796092ed40c.

I independently checked the served original/atlas engine hashes, drawing/atlas module hashes, metrics hash, and PNG hash against the accepted manifests. I read the unchanged atlas module and relevant engine integration points. I rely on the accepted source review and completed validation for the prior full inventory, build, type, and lifecycle checks.

Source inspection proves removal of recurring boot Canvas2D painting, font measurement, glyph rasterization requests, and texture-update requests. The accepted exact-source preflight separately establishes one initial atlas upload with mipmaps and zero recurring boot uploads. I did not repeat that preflight. These findings do not assign the saving exclusively to driver synchronization, upload submission, GPU execution, or another cause. Overlapping link/query/wait spans must not be added as independent GPU costs.

Readiness rejection ownership, abort, late bitmap closure, and guarded disposal remain unchanged. Supplied run records report complete flow, no runtime errors, and normal owned-browser exits. The corrected fixture also reports cleanup. Physical allocation reclamation remains unmeasured. The separate clean-package smoke remains a publication condition.

Comparable nominal texture-plus-mipmap storage is about 10.67 MiB for atlas versus 3.125 MiB for original, approximately 3.41 times. Atlas additionally retains an 8 MiB bitmap. Original canvas backing and other copies are unknown. The unequal 18.67/3.125 totals are not a measured total-memory ratio. Physical GPU execution, bandwidth, VRAM allocation, and presentation remain unknown.

**7. Exact wording for the preview handoff.**

Use this wording instead of historical claims of physical CPU bounds, exact solid-return identity, or resolved stutters:

> In these ordered captures, atlas has substantially lower recorded renderer-main task CPU during boot text. CPU1 reductions are about 39–41%. Flagged CPU4 reductions are about 49–52% for first text and 39–42% for replay. The contrast survives the specified counter fallback, task exclusions, and full original observer-wall subtraction. Both CPU4 strict observer audits remain failed. Atlas also records more regular CPU4 rAF and virtual presentation intervals. Counter semantics, startup neutrality, physical presentation, and general reliability remain unproven. Corrected fixtures show softer glyph edges and a uniform one-channel-level solid-return difference. Full-scene visual identity is unproven. Nominal texture storage is larger, and physical GPU/VRAM cost is unknown.

No recapture is required to make these wording corrections. Publish only the unchanged clean experimental preview after the separate source, packaging, and untimed local smoke pass. Keep production release outside this approval. Lantern/radio stalls remain a separate task. Safari and missed clicks remain deferred.
