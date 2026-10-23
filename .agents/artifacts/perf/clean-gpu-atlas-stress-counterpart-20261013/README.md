# Missing original CPU4 counterpart: flagged descriptive comparison

Exactly one new measured ORIGINAL CPU4 session completed. O4 and prior A4 both retain strict audit **pass=false**, solely for observerBound. No threshold was relaxed and neither session is accepted by this report. The originally planned four-session atlas dataset is now complete for root review; descriptive CPU separation survives conservative whole-task exclusions, but this is not a reliable-fix or release claim.

O4 passed full trusted START/site/BACK/powered return/second START/site, actual Svelte introend/native button flow, clock residual 0.088ms, marker restoration, exact compressed model delivery and loss-free ReturnAsStream EOF. A4 clock residual 0.101ms. No retries, preflight, warm draw, asset delay, source change, repeated build/test or fidelity capture.

## Fixed 3150ms native FireAnimationFrame-aligned text windows

Milliseconds. Renderer-main fully contained RunTask thread CPU supplies the lower bound; clipped or missing-tdur task wall supplies the upper bound. Whole marker/outlier tasks include app work. Exclusions below retain the original window endpoints, remove whole overlapping tasks, and do not estimate pure observer cost.

| Session / boot | Window page ms | All tasks CPU | Exclude marker task | Exclude >=1ms observer tasks | Exclude both |
| --- | --- | --- | --- | --- | --- |
| A4 / 1 | 7323.730–10473.730 | 331.230–339.578 | 331.230–332.672 | 327.428–335.776 | 327.428–328.870 |
| A4 / 2 | 19173.412–22323.412 | 336.412–344.602 | 336.412–337.453 | 336.412–344.602 | 336.412–337.453 |
| O4 / 1 | 7513.038–10663.038 | 670.650–687.798 | 670.650–670.731 | 665.776–682.924 | 665.776–665.857 |
| O4 / 2 | 19412.293–22562.293 | 568.580–583.491 | 568.580–568.613 | 568.580–583.491 | 568.580–568.613 |

| Boot | Conservative atlas reduction, all tasks | Conservative atlas reduction, both excluded |
| --- | --- | --- |
| 1 | 49.366%–51.842% | 50.604%–50.826% |
| 2 | 39.393%–42.345% | 40.650%–40.836% |

These ranges bound task accounting in this pair; they are not confidence intervals or a corrected successful audit.

| Session / boot | Sparse rAF n / mean / p95 / max | rAF >=25 / >=42 | Native app callback n / mean / p95 / max | Native >=25 / >=42 | Virtual presentation n / mean / p95 / max | Virtual >=25 / >=42 |
| --- | --- | --- | --- | --- | --- | --- |
| A4 / 1 | 188 / 16.665 / 16.700 / 16.800 | 0 / 0 | 378 / 8.332 / 13.450 / 14.061 | 0 / 0 | 188 / 16.666 / 16.666 / 16.666 | 0 / 0 |
| A4 / 2 | 188 / 16.666 / 16.700 / 16.800 | 0 / 0 | 378 / 8.333 / 13.734 / 15.039 | 0 / 0 | 188 / 16.666 / 16.666 / 16.666 | 0 / 0 |
| O4 / 1 | 169 / 18.540 / 33.300 / 50.000 | 17 / 2 | 339 / 9.269 / 19.229 / 36.755 | 13 / 0 | 168 / 18.650 / 33.332 / 49.998 | 18 / 2 |
| O4 / 2 | 167 / 18.762 / 33.400 / 50.100 | 17 / 4 | 335 / 9.372 / 23.863 / 39.685 | 16 / 0 | 167 / 18.762 / 33.332 / 49.998 | 17 / 4 |

Native callback counts combine multiple loops; their mean is not display cadence. Virtual presentation is headless feedback, not physical presentation. Outlier tasks remain in all raw cadence calculations.

## Every recurring observer callback with wall duration >=1ms

Inventory covers the complete A4 and O4 traces, including startup and prefix. Times are page milliseconds. Wall duration and native thread CPU are distinct; no scheduler attribution is inferred. All corresponding native FireAnimationFrame spans and presentation endpoints are retained in sensitivity.json.

| Session / callback | Timestamp | Wall | Thread CPU | Containing task wall / CPU | Affected native frame from / wall / CPU | Virtual presentation before–after / gap | Text overlap / fraction; whole task fraction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A4 / externalMutation | 106.646 | 2.865 | 0.720 | 15.918 / 3.969 | none | unavailable–455.730 / unavailable | outside text windows |
| A4 / externalTimingRAF | 887.467 | 7.859 | 0.102 | 8.832 / 0.737 | 887.451 / 7.896 / 0.137 | 884.617–895.865 / 11.248 | outside text windows |
| A4 / externalTimingRAF | 1267.822 | 22.734 | 5.945 | 25.636 / 6.644 | 1267.637 / 22.927 / 5.984 | 1266.432–1292.665 / 26.233 | outside text windows |
| A4 / externalTimingRAF | 7140.287 | 1.422 | 0.346 | 8.063 / 2.050 | 7140.274 / 1.449 / 0.370 | 7138.796–7155.462 / 16.666 | outside text windows |
| A4 / externalTimingRAF | 7223.952 | 1.599 | 0.377 | 9.529 / 2.308 | 7223.935 / 1.635 / 0.408 | 7222.126–7238.792 / 16.666 | outside text windows |
| A4 / externalTimingRAF | 7374.232 | 1.011 | 0.233 | 15.221 / 3.802 | 7374.208 / 1.053 / 0.272 | 7372.120–7388.786 / 16.666 | boot1 1.011ms / 0.032%; task 0.483% |
| O4 / externalMutation | 129.046 | 4.474 | 1.066 | 19.418 / 4.802 | none | unavailable–561.133 / unavailable | outside text windows |
| O4 / externalTimingRAF | 3196.026 | 1.200 | 0.276 | 12.637 / 3.101 | 3196.014 / 1.225 / 0.298 | 3194.361–3211.027 / 16.666 | outside text windows |
| O4 / externalTimingRAF | 7562.563 | 1.666 | 0.446 | 19.509 / 4.874 | 7562.375 / 2.036 / 0.502 | 7560.853–7577.519 / 16.666 | boot1 1.666ms / 0.053%; task 0.619% |

A4 first-text outlier: 1.011ms wall versus 0.233ms native CPU; its whole task spans 15.221ms (0.483% of window). O4: 1.666ms wall versus 0.446ms CPU; whole task 19.509ms (0.619%). Each corresponding virtual presentation interval remains 16.666ms. The recurring outlier therefore does not coincide with a missed virtual interval in either case, while broader O4 cadence gaps remain.

## Startup, prefix, fade/handoff and return

| Field (ms; first / replay where applicable) | A4 atlas | O4 original |
| --- | --- | --- |
| Navigation → START DOM | 2701.500 | 2974.800 |
| ResponseEnd → START DOM | 2665.400 | 2923.300 |
| Navigation → introend | 3824.800 | 4080.600 |
| ResponseEnd → introend | 3788.700 | 4029.100 |
| Startup CPU / longest task | 664.280–671.688 / 161.265 | 713.089–720.605 / 186.917 |
| START → semantic first letter | 3357.400 / 3327.700 | 3353.500 / 3336.800 |
| START → site | 7494.600 / 7480.900 | 7495.300 / 7473.700 |
| Prefix CPU / longest task | 395.532–402.204 / 18.521; 373.634–376.830 / 12.298 | 717.913–726.770 / 59.196; 490.219–495.620 / 17.607 |
| Fade/handoff CPU / longest task | 85.337–96.259 / 9.333; 92.905–103.107 / 9.860 | 145.224–169.635 / 15.091; 112.655–119.263 / 11.814 |
| Full START→site CPU | 815.308–827.853; 806.334–814.180 | 1541.536–1561.281; 1175.445–1186.437 |
| BACK → return introend | 4212.600 | 4214.800 |
| Return CPU / longest task | 421.520–422.839 / 16.838 | 585.176–586.683 / 21.902 |

Startup native loading/compile/link/query/wait records are retained in runs/o4/startup-native-events.json and prior A4 evidence. Overlapping spans are not summed or labeled as shader/decode cost. Semantic N-paint/uniform submission is not first-active physical draw; no additional GL queries ran.

## Matching and provenance

Model: GPT-6.1 Sol medium. Exact original91 a796e9aea60def6e0849cb75a151fd6570942339 includes camera042dc805. Atlas94 digest a148564062b30b3fd51326eb023e3bbfa60bc49814323bb198051796092ed40c. Rejected d82230a was never the baseline. Accepted validation stages were served read-only.

Hook SHA256 9b6d1d7ec5862986948d84d4b29811e5ae1584fb5cf15bc0a46c1522f6efdd55 matches O1/A1/A4. Unchanged cdp.mjs preserves exact trace categories: devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,v8,loading,blink.user_timing,cc,gpu,viz,disabled-by-default-gpu.service. Unchanged analyze.mjs/audit.mjs/server.mjs hashes and variant source-manifest hashes are retained. Original/atlas sources intentionally differ; O4 original source manifest matches O1. All 91/94 source and 231 built-output hashes match before/after.

Chrome Chrome/154.0.8037.57, Node v24.21.0, Radeon RX590 driver 31.0.21925.1001, ANGLE Vulkan ANGLE_VULKAN, 1280×800 DPR1; successful CPU4 throttle, zero-latency native network and cache-enabled commands are in measured-commands.json. Flags remain identical. Room-first storage seed and trusted START after actual introend remain intact.

O4 cloned only O1 task-owned profile identified from prior runs/o1/result.json. profile-clone.json contains source cleanup, exact clone file hashes and cache inventory; prior O1 profile remained unchanged. Actual disk cached resources: A4 33/34, O4 32/33. The model is cached and retains case-insensitive Content-Encoding br, decoded1183392 bytes, encoded file965768 bytes, SHA2564d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4; no raw fallback. Encoded CDP transfer can be zero for cached responses.

A4 and O4 trace-start requests were separated by 20.728 minutes. Variant order is not counterbalanced, and A4 reused A1 disk profile while O4 uses a byte-exact O1 clone in a fresh browser/renderer. Timing separation, order, host load and uncontrolled OS/driver caches weaken matching. Single-pair lower atlas CPU and better virtual cadence remain flagged observations, not a population estimate or demonstrated startup neutrality.

Prior seven fixed-time fidelity comparisons are not repeated: antialiasing/onepixel edge differences remain; off and solid-return match. Full-scene identity, physical presentation, actual GPU execution/allocation and physical-device benefit remain unproven.

## Exception, protected state and cleanup

runner-exception.json and owned run.mjs document the root-authorized bypass of only the prior A4 observerBound gate. Prior O1/A1 passes and every other A4 gate were required; current audit unchanged. A4 raw audit/result/analysis and prior tools/manifests retain exact hashes. Both raw audit statuses remain false.

verification.json confirms tracked/index/refs/shared metadata/dependency destinations unchanged. prior-protected-after.json confirms prior A4 files and O1 profile unchanged. No runtime/package/policy/Git/index/ref/checkout/account/system/install/deploy/coordination changes, children, commit, push or production release.

Owned Chrome exited 0; forced=false. Owned server 35884 stopped (SIGTERM). Read-only final port check found no listeners on4389/9923. Only owned processes were closed; profiles/evidence retained. T3 preview_status/open returned explicit no host. Sandbox creation/copy denial received narrow Auto-review approval; no refusal or bypass. Setup-only metadata ReferenceError was corrected before app launch; no app retry occurred.

Evidence: runs/o4/result.json, trace.json, trace.json.gz, trace-completion.json, measured-commands.json, measured-protocol.json, audit.json, analysis.json, startup-native-events.json; sensitivity.json, profile-clone.json, runner-exception.json, identity/built-output before and after, verification.json, prior-protected before/after and cleanup.json. Stop after this sole session; root reviews complete data.
