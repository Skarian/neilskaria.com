# Original versus atlas: CPU1 benefit; advancement remains inconclusive

**Do not advance the preview or release.** The valid CPU1 pair supports lower atlas renderer-main text CPU, comparable cadence, and no demonstrated moved startup stall. CPU4 comparison is incomplete: atlas failed the strict recurring-observer wall bound, so original CPU4 was not run. This is a measurement rejection, not an attributable atlas performance regression. Exact visual identity is also unproven.

Two separately owned unmeasured CPU4 validations ran. Validation1 failed only recurring observer wall1.039ms. Validation2 passed every gate (clock residual0.096ms; first/replay observer wall maxima0.795/0.597ms). Both are excluded from all measured comparisons. Three new measured sessions ran in authorized order: O CPU1 cold, A CPU1 separate cold, A CPU4 fresh renderer with A CPU1 disk profile. No replacement, fourth session, extra warmup, readiness delay, or source change.

## Valid CPU1 comparison

Milliseconds; CPU intervals are renderer-main fully contained RunTask tdur lower bounds through missing/clipped task wall upper bounds. No nested durations or statistical samples are summed as CPU.

| Field | Original O1 | Atlas A1 |
|---|---:|---:|
| Navigation -> START DOM |1257.2|1251.7|
| ResponseEnd -> START DOM |1226.2|1220.9|
| Navigation -> real introend |2287.8|2257.6|
| ResponseEnd -> real introend |2256.8|2226.8|
| Startup renderer CPU bounds |562.11–562.54|550.63–551.06|
| Longest startup renderer task wall |142.84|149.18|
| Trusted START -> site, first/replay |7478.4 / 7463.8|7477.6 / 7479.7|
| First/replay 3150ms text CPU |433.18–436.62 / 410.31–412.71|256.16–257.77 / 248.91–250.24|
| Text CPU excluding whole marker task |433.18–434.29 / 410.31–411.14|256.16–256.32 / 248.91–249.04|
| Prefix longest task, first/replay |7.640 / 3.236|3.817 / 2.599|
| Fade/handoff longest task, first/replay |2.298 / 2.128|1.945 / 1.593|
| BACK -> returned-room introend |4169.9|4181.4|
| Return renderer CPU / longest task |439.81–440.14 / 6.645|382.94–383.20 / 3.819|

Text CPU falls about39–41%. The30.2ms startup difference and small handoff/return differences are order-sensitive, inconclusive observations. They do not prove startup neutrality or population reliability. Native startup link service contains20 DoLinkProgram spans in each CPU1 run, max5.021/5.402ms. No shader identity/API/decode duration is invented; loading and overlapping native link/query/wait records are retained separately. Unknown long-task work is not attributed to shaders. First-use work counts wherever observed; prefix, fade/handoff, return and full activation remain separately available in [comparison.json](comparison.json).

All text cadence windows start at the native FireAnimationFrame containing the semantic first-letter submission, last3150ms, and retain raw boundaries. Semantic uniforms/N-paint are not physical draw timestamps.

| Text cadence, first/replay | Original O1 | Atlas A1 |
|---|---|---|
| Sparse rAF gaps n |188 / 188|188 / 188|
| rAF mean / p95 / max |16.66596 / 16.7 / 16.8; 16.66543 / 16.7 / 16.8|16.66596 / 16.7 / 16.8, both|
| rAF gaps >=25 / >=42 |0 / 0, both|0 / 0, both|
| Native app callback gaps n / mean / p95 / max |378 / 8.33105 / 17.241 / 18.135; 378 / 8.33185 / 16.203 / 17.316|378 / 8.33048 / 17.481 / 18.454; 377 / 8.31643 / 16.801 / 21.032|
| Native app gaps >=25 / >=42 |0 / 0, both|0 / 0, both|
| Virtual presentation gaps n / mean / p95 / max |184 / 16.93773 / 16.666 / 33.332; 187 / 16.75512 / 16.666 / 33.332|188 / 16.666 / 16.666 / 16.666, both|
| Virtual presentation gaps >=25 / >=42 |3 / 0; 1 / 0|0 / 0, both|

Aggregate native app callbacks include multiple loops; their roughly8.33ms mean is not screen cadence. Presentation is headless virtual feedback, not hardware presentation. The few O1 missed virtual intervals cannot establish reliable stutter improvement.

## Gate and CPU4 limit

Actual atlas initial powered=0/returning=0 writes were captured on new-document startup, with location/program identity, epoch and timestamps. Scalar/lookup observers restored at first real introend. First START seeded from these writes only; source has boot=-1 and no intervening power/return path before trusted START. BACK invalidated that seed; replay required actual prefix returning=0 then powered=1 writes. Positive default Vector4 alpha while powered off never marked a letter. [Startup source correspondence](startup-source-correspondence.json)

All marker hooks restored immediately at verified first letters. Whole marker task wall bounds for CPU1 first/replay are O2.486/1.698ms and A1.633/1.307ms. They include application work and are conservative bounds, not pure observer overhead. Raw aligned windows retain their contamination; the second CPU calculation excludes the entire containing task.

O1/A1 clocks pass at0.068/0.121ms. Recurring native observer maxima first/replay are O0.245/0.119ms, A0.219/0.128ms. No per-call stopwatches, shader/query/useProgram/draw/texture logging, fetch/decode/bitmap wrappers, V8 statistical sampling, debugger pauses, screenshots or pixel reads ran during timing.

A4 passed actual initial state, full trusted flow, marker restoration, exact compressed delivery, clock0.101ms and trace completion. It failed first-text externalTimingRAF wall1.011ms at7374.232ms; native thread CPU was0.233ms. The discrepancy does not isolate scheduler/observer cost and does not satisfy the wall gate. A4's otherwise regular16.666ms rAF/presentation and raw CPU/startup fields are descriptive **excluded evidence**, not a valid paired CPU4 comparison. The runner requires every preceding audit to pass, so O4 remains unrun. No threshold relaxation or automatic repeat.

## Delivery, fidelity and scope

All collected traces completed ReturnAsStream EOF/loss=false. Every run has actual successful throttle commands, flags, Chrome154/RX590 ANGLE Vulkan,1280x800 DPR1, Node24.21.0, native network, boot-seen1/room-place room, trusted inputs after real Svelte introend, and two completed site phases. Cold profiles had only a same-session cached favicon; A4 had33/34 cached resources, including atlas and model. O1/A1 resource encoded totals2926537/2968057 bytes, decoded totals2568430/2572728; totals include observed request bodies and are not unique asset inventories. Model br delivery is case-insensitive, encoded965768/decoded1183392, SHA2564d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4; no compressed404 or raw fallback.

The untimed [fidelity screen](fidelity/results.json) uses exact accepted source modules transpiled into an isolated prior-method960x640 orthographic fixture at arrival0.7, overlap1.1, settled1.5, glint2.78, fade3.7, off and solid-return fade0.7. Original/atlas/x4-difference PNGs and enlarged edge/clipping crops were inspected. Flying glyphs clip at the same outer boundaries; no additional seam or missing glyph was seen. Edge antialiasing differs, with settled bounds O[62,193,903,493] versus A[62,192,902,493], max channel differences183–250 in active states, and139 during fade. Whole-image means0.231–0.476/255 do not excuse those edge differences. Glint and overlap remain visually corresponding, without pixel identity. Solid-return and [corrected off](fidelity-off-correction/results.json) match exactly. Full app animation/camera control was unavailable; this does not verify full-scene fidelity.

Fidelity faults are preserved: first contact-sheet composition failed after arrival; its cleanup and files remain in fidelity-attempt1. The first completed off reference incorrectly used black; it is excluded, and one focused correction used the original material's #1d201d. No runtime shader, mask or preparation bytes changed.

Exact original91 a796e9aea60def6e0849cb75a151fd6570942339 and accepted atlas94 outputs were served read-only. Rejected redesign d82230a was never a baseline. All231 built hashes and source hashes stayed exact. Atlas digest a148564062b30b3fd51326eb023e3bbfa60bc49814323bb198051796092ed40c; PNG37034bytes SHA256e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e. [Verification](verification.json) confirms tracked/index/refs/shared metadata/dependency destinations unchanged. Accepted builds/typechecks/lifecycle tests were not repeated. Earlier exact-source one-upload+mipmap/zero-recurring-upload evidence remains separate, unrecollected. Nominal atlas bitmap+mips18.67MiB versus original3.125MiB; actual VRAM/GPU hardware execution unknown.

Evidence: each runs/* directory has trace.json/gz, stream completion, raw result/network/resources, protocol, command journal, clock/overhead/flow audits, native analysis and startup loading/link/service records. [Run manifest](run-manifest.json), [faults](harness-faults.json), before/after identity and built-output snapshots complete provenance. All owned Chrome instances exited0 without force; servers closed and ports4389/9923 have no listeners; [cleanup](cleanup.json). T3 status/open explicitly reported no host, authorizing owned CDP fallback. Sandbox artifact creation received narrow Auto-review approval after denial; no refusal/bypass. No children, runtime/package/policy/Git/account/system/install/deploy changes, commit, push or release. Safari/missed clicks and lantern/radio remain deferred.