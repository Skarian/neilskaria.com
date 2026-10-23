Do not accept the unconditional canvas hint for release. Keep it available for limited review because the affected Android result remains useful. The desktop cost is real enough to challenge the earlier preference for the smallest code diff.

Choose one next experiment: map first-use WebGL programs during radio opening. Use one matched touch control only if those programs belong to the hover outline. Do not add startup preparation.

Evidence root: `.agents/artifacts/perf/clean-canvas-automated-profile-20261013/`, called E below. Source references use E's exact original stage, not rejected main HEAD.

1. Evidence and measurement audit

I independently compared all 91 staged files per variant with their manifest hashes and Git blobs. All comparisons passed. Commit bcc409e43708ee7b543b53ca8f3700a8ef82ff14 has sole parent a796e9aea60def6e0849cb75a151fd6570942339. HEAD, index hash, and tracked file hashes still match E/state-after.json.

There are two valid native text pairs. Interaction evidence contains one matched pair and one extra hint run. The first original has no interaction trace. Replays share their browser and resources with first boots. Frame gaps are correlated observations, not independent experimental replicates.

Trusted clicks, separate N draws, site phases, BACK, room, and second START support complete first and replay flows. Each START-to-site interval is approximately 7.44–7.46 seconds. Only the selected 3150 ms text windows support the zero-gap claim. Their rAF gaps contain no values at least 25 ms. This does not establish smoothness across the full boot.

Clock alignment uses the first START mark as its offset. Its zero residual is automatic. Independent second START residuals are within 0.089 ms. Interaction input marks agree within 0.129 ms. Do not align iframe clocks with the page offset.

The native callback grouping is unsuitable as a frame counter. For example, pair2-hint first boot contains 269 grouped gaps despite 188 observer rAF gaps. Callbacks more than 5 ms apart can belong to one frame. Use rAF timestamps, glyph draw timestamps, and presentation feedback as separate measures.

The renderer RunTask intervals do not overlap. However, native-detail.mjs includes entire tasks that start inside each window. It excludes tasks that start before the window. It also treats missing tdur as zero. Text-window tasks without tdur total only 0.010–0.096 ms of wall time. Boundary tasks add several milliseconds of uncertainty.

A conservative CPU bound uses fully contained tdur as its lower bound. Add missing-duration wall time and clipped boundary wall time for its upper bound. Pair1 first boot gives original 505.9–509.3 ms and hint 1265.6–1271.5 ms. The cost increase survives this correction.

Reported paired CPU ratios are 2.502 and 1.997 for pair1, then 2.115 and 2.359 for pair2. Say “about 2.0–2.5 times,” not “every window exceeds twice the CPU.” These totals cover the renderer main thread, including shared measurement overhead. They are not whole-browser CPU or energy.

Native event groups can include several threads and processes. Nested query, wait, function, and task durations must not be added. GPU-service spans measure service execution. They do not measure hardware completion. The texture-upload samples support a changed work path, not exclusive CPU or GPU canvas backing.

Response-normalized startup remains inconclusive. START DOM minus document responseEnd is 1237.2/1328.2 ms for pair1 original/hint, then 1425.6/1335.6 ms for pair2. Hint-minus-original is +91.0 and -90.0 ms. Normalized intro completion differences are +101.3 and -79.7 ms. Removing document delay does not control later resource delivery or scheduling.

Presentation feedback belongs to the headless compositor. The original pair2 first boot has one 50 ms gap and two smaller missed intervals. This does not establish a repeatable hint benefit or physical-screen presentation.

Both CPU runs and network-original failed trace completion. Their actions reached both START inputs. Do not label them failed application flows. Exclude their incomplete traces from comparisons. Network-hint is unpaired. Retain the home-route, occupied-port, and D3D11 failures separately. The eight-session limit belonged to the original task. I did not inspect or duplicate the separately assigned stress reruns.

2. Residual stalls have different signatures

Lantern's largest task lasts 28.075 ms in pair2-original and 37.114/40.476 ms in the hints. Its layout spans last 15.692/20.506/23.506 ms respectively. The sampled stack maps to BootIntro.svelte:94–107: report() calls getBoundingClientRect() after panel insertion. The built original mapping is nodes/3.B4i53AY5.js, zero-based line 1, column 16136. These longest tasks contain no GetProgramiv spans. This is direct evidence for synchronous panel layout as a lantern contributor. It does not support restoring prepared panels.

Radio maximum rAF gaps are 66.6 ms in the original and 83.3 ms in both hints. Radio's longest tasks last 45.516 ms original and 54.575/53.372 ms hint. Their thread CPU totals are 17.224, 16.858, and 16.689 ms. Disjoint GetProgramiv spans total 25.234, 28.779, and 29.605 ms inside those tasks. Nested WaitForCmd and WaitForGetOffset spans describe overlapping waits.

The largest radio leaf-sample groups are getProgramInfoLog and getShaderInfoLog through Three's first-use getUniforms path. Original raw task timestamp: 1746437966812 microseconds. Its samples include 43 program-log and 10 shader-log observations. These are sample counts, not CPU milliseconds. Five DoLinkProgram service spans occur during each largest radio task. Their timing alone does not identify the corresponding materials.

The exact engine bundle BRbf-dSZ.js, zero-based lines 4161 and 4168, shows the log checks before uniform/attribute discovery. Local Three 0.186.1 references are WebGLProgram.js:863–984 and WebGLUniforms.js:1114. Queries can concern link status, active uniforms, active attributes, or completion. Native GetProgramiv records have empty arguments here. Some can occur inside log APIs. Do not assign an enum or call all these spans compilation.

COMPLETION_STATUS_KHR is a nonblocking availability query when the extension exists. It does not prove completed rendering. See the [Khronos extension specification](https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/). The next capture must record actual extension availability.

The source supports specific hypotheses:

- engine.ts:803–884 prepares current object materials, a lit screen, and a foliage clump. Warm draws use visible meshes. This does not cover every later pass.
- engine.ts:547–593 creates mask/occluder materials and a separate outline scene. Lines 1378–1408 render these with override materials and another render target.
- engine.ts:1452–1507 activates hover for mouse movement. focus() fades that outline at line 1261. cdp.mjs sends mouseMoved, mousePressed, and mouseReleased without a deliberate hover dwell. Touch does not follow the same hover path.
- engine.ts:496–508 and 1783–1792 swap dial materials. Their color differences alone do not establish different shader programs. Render target color space, mesh attributes, instancing, and light parameters can affect program keys.
- BootIntro.svelte:209–224 powers radio on. player.svelte.ts:141–187 creates local audio and starts stream work. youtube.ts:35–50 requests its API. Later player evaluation remains separate from the mapped render wait.
- engine.ts:160–168 and 1356–1363 use the separate clock canvas. The screen-context hint does not change that canvas.

Program identity and parameter churn remain unproven. Map both before proposing a shader correction.

Panel insertion timestamps need another correction. Existing values start before CDP input dispatch, not at trusted clicks. Click-to-DOM is 7.8–9.7 ms for lantern and 23.9–29.0 ms for radio. Neither measures completion of the panel transition or camera motion.

3. One bounded execution brief

Use the exact bcc409e hint build for both conditions. Hold Chrome, RX590 Vulkan, 1280x800 DPR1, storage seed, native CPU, and network policy fixed. Use fresh owned profiles. Keep radio audio and third-party requests active.

Run one mapping session first. Preserve START, site, BACK, room, replay, and return. Then reproduce mouse lantern, Candle, close, radio, and close. Keep action windows separate. Record the actual trusted pointer movement, pointer type, down, up, and click times. Capture native traces without screenshots.

Install only an external, bounded CDP observer before application execution. Do not add an app recorder or diagnostic UI. Record existing calls without extra GL queries:

- Assign context, shader, and program IDs. Retain shaderSource strings and attach/link relationships. Hash sources after capture.
- Record application query enums and return values. Time getProgramParameter, getShaderParameter, getProgramInfoLog, and getShaderInfoLog.
- Retain first-use stacks and framebuffer/program associations. Map generated defines and sources to the exact built code. Distinguish shared program classes where material identity is ambiguous.
- Record upload and draw boundaries in the action windows. Detect waits that move from a query into reflection, upload, or drawing.
- Measure native task CPU, clipped wall intervals, layout, rAF gaps, panel animation completion, and virtual presentation. Preserve network timing.

Do not add finish(), readPixels(), eager shader checks, or measured-window serialization. Bound observer storage. Flag a capture if observer bookkeeping exceeds 1 ms in an active frame. Shared observer overhead still limits production predictions.

Only if mapping identifies outline programs, run ONE control session. Repeat the same flow with trusted CDP touch taps instead of mouse hover/click input. Keep desktop viewport and all application policies unchanged. Check that touch creates the same panels and powers the same radio state. Check that it does not activate the outline. Do not introduce a hover-dwell matrix or another code variant.

Use the interval from 250 ms before the first pointer event through 2 seconds after the click. Also report the first 1200 ms after the trusted click. This prevents an earlier hover stall from disappearing outside the analysis window.

For an attribution pass, require complete traces and page-clock residuals below 0.5 ms. Map every query longer than 1 ms to a program and JS API. Report hidden native enums as unknown. Do not infer them from GetProgramiv names.

A positive control must remove the mapped outline waits. It must reduce total wait by at least 10 ms. It must reduce maximum rAF gap by at least 16 ms. Reject that interpretation if comparable waits merely move elsewhere in the full interval. Use these proposed bounds for screening, not release acceptance. One pair cannot establish general performance.

If source hashes repeat under different keys, identify the exact changed parameter before proposing a lean correction. Correct only proven redundant variants. Preserve appearance and behavior. If the programs are necessary first-use variants, return that result without adding startup or background warmups. If mapping identifies another path, stop after the mapping session. Do not spend the control on an unrelated hypothesis.

Keep lantern layout as a separate finding within this experiment. Do not combine its correction with the radio control. A future layout change must demonstrate reduced forced-layout work without restoring cached panels.

4. Canvas decision and handoff

The prior Adreno result favors the hint: original text means are about 33 ms, versus 16.7 ms with hint or atlas. This desktop evidence shows smooth scheduling with both canvas modes and substantially higher CPU with the hint. Small code size alone does not settle that tradeoff.

Keep the hint as an affected-device review candidate. Withhold unconditional acceptance. The separately assigned CPU stress pair must show whether the extra CPU reduces frame margin. Any claim about the Android mechanism still needs automated native evidence from that affected renderer. Response-normalized startup and first/replay presentation must accompany it. Do not ask the user for JSON.

UA/GPU rules need evidence that their selector predicts this behavior. These samples do not provide that evidence. Atlas memory and startup uncertainty remain unresolved. Do not accept atlas, background warmups, or rejected glyph/panel preparation by default.

Root can check E/measurements.json, E/radio-native-detail.json, E/runs/*/{result.json,trace-summary.json,trace.json.gz,interactions-trace.json.gz}, and the named exact source lines. The CPU/window corrections above come from independent raw-trace inspection, not new browser sessions.

This review performed read-only source, Git, and evidence inspection. It ran no builds or browsers and made no deployment or dependency changes. Its only write is this new review artifact.
