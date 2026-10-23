# Radio program mapping: evidence limit

The mouse session did not reproduce the earlier radio graphics wait. Do not select a shader fix from this capture. Do not accept the canvas hint as a general fix.

The complete flow reached two START inputs, two site exits, and two returns. It then opened Lantern, selected Candle, closed Lantern, opened Clock radio, and closed Clock radio. The radio panel reported playing and On air. Audio and network policies stayed active.

Chrome 154.0.8037.57 used the RX 590 with ANGLE Vulkan. The viewport was 1280 by 800 at DPR 1. CPU rate was 1. Network latency was 0 with unlimited throughput. The profile was new. Only boot-seen and room-place were seeded.

lantern: trusted click to panel DOM 8.200 ms. Clock residual 0.102 ms. Full window 46226.900 to 48483.600 ms. Native GetProgramiv time 0 ms. Maximum observer rAF gap 33.400 ms. Renderer main task CPU bound 265.364 to 267.244 ms. Maximum clipped task wall time 33.483 ms. Layout total 20.657 ms.

First 1200 ms after click: CPU bound 145.582 to 178.714 ms. Layout 20.657 ms. Maximum rAF gap 33.400 ms. No GL query, upload, or draw call exceeded 1 ms in either action window.

radio: trusted click to panel DOM 25.900 ms. Clock residual 0.054 ms. Full window 53843.400 to 56097.400 ms. Native GetProgramiv time 0 ms. Maximum observer rAF gap 33.300 ms. Renderer main task CPU bound 354.195 to 354.237 ms. Maximum clipped task wall time 36.922 ms. Layout total 10.765 ms.

First 1200 ms after click: CPU bound 191.204 to 227.988 ms. Layout 7.471 ms. Maximum rAF gap 33.300 ms. No GL query, upload, or draw call exceeded 1 ms in either action window.

All 20 programs linked during startup. All 666 recorded query/reflection calls occurred during startup. Each query above 1 ms maps to its program, shaders, exact sources, generated defines, result, duration, and stack in mouse-programs.json. Those slow calls were program or shader info-log APIs. Log APIs have no public enum argument. Hidden native enums remain unknown. Existing application requests reported KHR_parallel_shader_compile unavailable. No extra GL request tested availability.

Action draws used framebuffer 0. No outline-composite source or outline render target draw appeared. No identical vertex-and-fragment source pair occurred in two programs. Shared single shader hashes do not prove duplicate programs. Material names are retained only when generated SHADER_NAME supplies them. Generic MeshBasicMaterial sources cannot uniquely identify clock, mask, or another material by color.

The pointer move-to-click intervals were 6.7 ms for lantern and 4.0 ms for radio. Source engine.ts:1261 clears hover when focus starts. Lines 1378�1408 draw the outline only when its opacity exceeds 0.001. This session can miss that pass before focus clears it. The absence does not disprove the earlier hover hypothesis. No matched touch control was authorized by this result.

Observer limits: no records dropped. Four startup frames exceeded 1 ms of measured wrapper bookkeeping. The maximum was 4.700 ms. Flag the capture for startup timing claims. Neither full action window had a frame above 1 ms. These checks omit rAF/DOM observer overhead and timer overhead. No benefit claim follows from this run.

The three native traces reached stream EOF and reported no data loss. Maximum trace buffer use was 18.091%. No screenshot ran during a trace. Native waits, tasks, samples, and nested service events are separate quantities. CPU bounds cover renderer main tasks only. rAF and headless presentation are not physical screen FPS. Network events and resource timing remain in result.json. Iframe clocks were not aligned with the page clock.

Panel opening completion was not measured. The transition listener recorded no opening transition-end event. A snapshot after 2.1 seconds retained panel state and browser animations. Source focusBlend uses a 1.1 second camera tween. setFree can use 0.5 second eye/target tweens. The 1200 ms window covers those nominal durations. It does not prove camera completion. Intro-exit DOM marks remain in proof.json and result.json.

Next action: obtain a mapped occurrence of the radio first-use wait before changing shader checks. This run supplies no execution-ready source fix. A future capture needs the same bounded observer with lower startup bookkeeping. Preserve immediate trusted input and verify whether an outline draw occurs. Do not add startup or background preparation. Keep the panel forced-layout finding separate.

Proof files: proof.json validates flow and trace transport. mouse-analysis.json contains both action windows. mouse-programs.json contains exact source and API mapping. program-lifecycle.csv indexes all programs. runs/mouse contains raw traces, protocol, command journal, network, DOM state, and cleanup evidence. analyze.mjs and report.mjs reproduce the analysis.

Failures and limitations: initial artifact writes failed under the read-only .agents sandbox. Narrow automatic review approved authorized artifact writes and profiling commands. A PowerShell brace-list read failed and was corrected. The first analysis double-counted the CPU upper bound and used an incorrect native query-name filter. The corrected proof script and final analysis use clipped boundary wall time and actual native names. No further measured session ran.
