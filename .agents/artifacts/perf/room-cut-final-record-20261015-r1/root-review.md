# Room bed/plant cut: root closing review (2026-10-15)

Record only. No source, Git, build, browser, benchmark, deploy, or account change was made for this record.

## Scope

The user authorized an extra bed / floor-plant cut, a new preview, the same full-scene views, matched Lighthouse and room benchmarks, and a merge recommendation. The user did not authorize a merge.

## Evidence (raw reports)

- R (cut, local): [room-bed-plant-cut-20261014-r1](../room-bed-plant-cut-20261014-r1/README.md)
- Review of R: [room-bed-plant-cut-review-20261015-r1](../room-bed-plant-cut-review-20261015-r1/README.md)
- S (preview deploy + perf): [room-bed-plant-cut-deploy-perf-20261015-r1](../room-bed-plant-cut-deploy-perf-20261015-r1/README.md), also `summary.json`, `provenance.md`, `lighthouse/`, `f1/`, `f1-control/`, `hosted-*`
- Views shown to the user: [full-scene.html](full-scene.html), [benchmarks.html](benchmarks.html) (saved exactly as supplied by root; not published or modified here)

The original R and S reports contain worker interpretation. Where they differ from this file, the root qualifications below apply.

## Root qualifications

- R: cut-d-ring2, 7 prim partial cuts. 76 non-target prims, 10 bonsai prims, 11 images, and 48 materials are unchanged. GLB 881,512 -> 833,884 raw, 688,868 -> 645,950 br (-42,918 B, 6.23%). Root accepted R for preview only, not for integration.
- Leaf-card correction: 54 of 60 leaf cards are margin-visible, and 44 are kept under the strict rule. The "56" in the R README was wrong wording, not an asset bug. There is no universal invisibility proof.
- Preview: https://portfolio-z1jbr6jar-neil-skarias-projects.vercel.app/lab/boot (`dpl_GSXdc9paoabAXGkH5TsSiQqFVrkM`), READY. One hosted source build, exactly 94 files, 2,021,675 B, digest `0d1d29b7eba209b0e8fee47a93d6ecf7fcb4fb10310fb7aaaf771cf51521a314`. Only the GLB differs from the c2s1byb9d6mi baseline. Accepted GLB sha256 `715a369985af1f3555a14192bf8990e6da13a11862a959495c5814918a29a059`; served br is exactly 645,950 B. Old previews, production, repo, Git, deps, R, and D are unchanged.
- Hosted flow at 1280x800, 390x844, 844x390 passes (START, site, BACK, lantern, radio ON AIR, replay) with no errors, raw fallback, or diagnostics. F2 fresh landscape lantern settled: candidate vs baseline 19,114 px; baseline repeat 20,727 px. The earlier 180,807 px was mid-zoom. Exact 820 square at DPR 2 covered room, pointer, and cube, but the lantern click missed and a bonsai point opened the lantern, so extra square focus coverage is incomplete.
- F1 (encoded GLB, same frame, 17 poses x 3 repeats + 4-pose control): the planned subset showed 0 differences, but the encoded GLB has real small shading shifts, mainly 1-2/255, up to 71,218 pixels, at most 3 pixels >16, max 25. No holes were detected at the selected poses. A zero-pixel c2s decoding control supports re-quantization as the cause. Limited-sample evidence.
- Lighthouse 13.5, Chrome 154, Windows, fresh profiles, alternating B/A, 3 pairs per preset: 12 valid, no warnings or runtime errors. Mobile score median 61 -> 61; desktop 93 -> 94. All timing ranges overlap; no clear Lighthouse gain. LCP is the NEIL SKARIA intro heading and does not measure room readiness. Do not repeat the S HTML claim that Lighthouse does not time the model at all: audits still fetch the model, and network and CPU are affected. Mobile transfer median 1,594,324 -> 1,551,303 (-43,021 B, 2.7%).
- Room readiness (CDP 150 ms latency, 209,715 B/s, CPU 4x, 412x823 DPR 1.75, returning-visitor state, cold profiles, warm edges, 5 pairs, all valid): median START ready 11,529.2 -> 11,354.1 ms (-175.1 ms, 1.5%). After was lower in all 5 pairs (-24.1, -124.6, -355.9, -428.2, -146.2). This is encouraging evidence of a small benefit. Overlapping ranges alone do not prove no effect; fixed B/A order, server jitter, and small N limit a stable general estimate. Do not claim "nothing measured faster". The earlier 1.4 s gain from the c2s map reduction is separate. No FPS or animation gain was measured.
- Process: root reviewed all 188 activity descriptors. F1 setups 1-2 failed (disposed Draco / eval timeout; kept-buffer bug) and were fixed, but over the timebox. The 0.2% settle threshold failed; 1.5% was derived from the idle floor. An extra A2 capture of landscape/square shows camera and animation variance. No timing outliers were dropped. No T3 preview host; owned Chrome closed with exit 0; own server closed; no permission refusals. One root read-only PowerShell parse command had a syntax error (empty pipe); corrected, no side effects.

## Recommendation

Do not merge this extra cut now. Keep the prior c2s choice and keep this preview as an experiment. The modest byte and loading benefit does not justify a camera-specific derived-asset process: a re-export loses the cut, future camera moves can expose holes, and the cut adds faint shading changes. No functional regression is claimed for untested ranges. Bonsai is untouched.

The user request is complete after root publishes the views, benchmarks, link, and assessment. No automatic next optimization, deploy, or merge. The current main checkout is stale/rejected and must not be uploaded.
