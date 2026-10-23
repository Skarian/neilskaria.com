# Matched CPU and network findings

The trace repair passed. Four new measured sessions provide the two missing pairs.

At 4x CPU stress, the hint shows repeated frame gaps in both full boots. The network pair keeps loaded text near 16.7 ms. These results require caution before accepting the hint across renderers. They do not establish an Android cause or production acceptance.

## Collection and identity

Original: a796e9aea60def6e0849cb75a151fd6570942339. Hint: bcc409e43708ee7b543b53ca8f3700a8ef82ff14. The original is the hint’s sole parent. The only difference is the engine screen context option willReadFrequently: true. Each stage contains 91 exact Git blobs. Each copied build contains 115 byte-identical files from its prior build. The source preserves the camera and emoji. No app build, source edit, dependency change, Git mutation, policy change, or deployment occurs.

Node 24.21.0 runs the scripts. Chrome 154.0.8037.57 uses RX 590 and ANGLE Vulkan 1.3.260. Viewport is 1280x800 at DPR 1. Each result records SystemInfo, actual Browser command line, renderer, version, and live CDP protocol. The launch adds --enable-automation to expose the actual command line. Both variants use this same flag. T3 status and open explicitly report no host in environment e3105d80-56f1-4c15-a6bc-b91e70b157b5. The runner uses only owned Chrome profiles. No device measurement occurs.

ReturnAsStream is present in the live protocol. Each recording owns a new completion listener. The runner waits at most 45 seconds, retrieves the returned stream with IO.read, and requires EOF. It keeps raw JSON and gzip copies. Each trace reports dataLossOccurred=false. Blank-page preflight also passed after one absolute-profile-path correction. The first CPU completion took 10.72 seconds. The old 10-second bound could truncate it. No prior failed trace becomes valid.

| Run | Trace MB | Events | End to complete ms | Drain ms | Max buffer % | EOF / loss |
| --- | --- | --- | --- | --- | --- | --- |
| cpu-original | 167.89 | 952266 | 10720 | 4864 | 17.12 | yes / no |
| cpu-hint | 154.82 | 871549 | 10108 | 4503 | 15.92 | yes / no |
| network-hint | 146.88 | 824293 | 8845 | 4309 | 15.43 | yes / no |
| network-original | 156.43 | 884620 | 9599 | 4557 | 16.55 | yes / no |

Each recording contains trusted START, site completion, actual BACK, room return, second trusted START, and second site completion. No reverse animation substitutes for replay. All selected glyphs in the measured windows map to native renderer-main FireAnimationFrame spans. Clock alignment uses native User Timing marks against performance.now. The maximum mark residual is 0.20 ms.

The unchanged external hook records rAF, selected N glyphs, DOM phases, and trusted clicks. It seeds boot-seen=1 and room-place=room in owned storage. It changes no draw arguments and performs no pixel reads. The hook has no UI. No screenshot or recorder runs. Hook, tracing, and polling overhead remain present and equal by script. They are not calibrated away.

## Matched setup and loading

CPU order is original then hint. Each warms resources, closes Chrome, and starts a fresh browser and renderer with the same owned disk profile. CPU slowdown is 4x. These are warmed-resource measurements. Network order is hint then original. Each uses a new cold profile, CPU1, 80 ms latency, 1500000 B/s download, and 750000 B/s upload. Successful commands and all CDP errors are recorded. Disk cache is enabled. All measured command journals contain zero errors.

Both variants use http://127.0.0.1:4389/lab/boot. An artifact-only server serves exact copied Svelte SSR and static build bytes. Static delivery is uncompressed and uses max-age=3600. It writes no previous files or root dependencies. This delivery differs from Vercel and the prior Vite host. No localhost-versus-Vercel latency claim follows.

| Run | Document responseEnd | START DOM | Native intro end | Response to DOM | Response to intro | Network bytes / disk hits |
| --- | --- | --- | --- | --- | --- | --- |
| cpu-original | 6.30 | 2590.40 | 3754.84 | 2584.10 | 3748.54 | 9428 / 32 |
| cpu-hint | 5.40 | 2593.30 | 3736.34 | 2587.90 | 3730.94 | 9428 / 32 |
| network-hint | 102.60 | 3445.00 | 4468.53 | 3342.40 | 4365.93 | 3144362 / 1 |
| network-original | 347.80 | 3754.50 | 4780.52 | 3406.70 | 4432.72 | 3144338 / 1 |

Native intro ends come from the initial delay/pop Web Animation events. CPU-original’s first click precedes the native intro-end notification by 8.34 ms. This timing warning stays explicit. Every other first/replay intro ends before its START click. Both full boot sequences finish in all recordings.

The network hint reaches START DOM 309.5 ms earlier. Its document response ends 245.2 ms earlier. After response normalization, the DOM difference is 64.3 ms and the intro difference is 66.8 ms. One pair cannot establish a causal loading advantage. CPU START DOM differs by only 2.9 ms.

Both cold network sessions transfer about 3.144 MB. Asset and Draco bytes match exactly. Variant scripts account for 24 additional transferred bytes in the hint. Both sessions retain the same bedroom.glb.br 404 and successful raw GLB fallback. The sole cold-profile cache hit occurs on a later repeated favicon request. The warmed CPU sessions have 32 disk hits and 9428 network bytes each. Resource manifests retain responses, cache flags, timing, failures, transfers, and payload hashes.

## Loaded text

Each window starts at its first selected N glyph and lasts 3150 ms. Values are milliseconds. n counts intervals. Quantiles use nearest rank. Full rAF, glyph, native glyph callback, and headless presentation metrics appear in cadence-metrics.md and CSV.

| Run / boot | rAF n | mean | p50 | p95 | max | >=25 / >=42 / >=100 |
| --- | --- | --- | --- | --- | --- | --- |
| cpu-original / 1 | 177 | 17.70 | 16.70 | 33.30 | 33.40 | 11 / 0 / 0 |
| cpu-original / 2 | 181 | 17.31 | 16.70 | 16.80 | 33.40 | 7 / 0 / 0 |
| cpu-hint / 1 | 130 | 24.10 | 16.70 | 33.40 | 50.10 | 54 / 4 / 0 |
| cpu-hint / 2 | 137 | 22.87 | 16.70 | 33.40 | 50.00 | 50 / 1 / 0 |
| network-hint / 1 | 188 | 16.67 | 16.70 | 16.80 | 16.80 | 0 / 0 / 0 |
| network-hint / 2 | 188 | 16.67 | 16.70 | 16.70 | 16.80 | 0 / 0 / 0 |
| network-original / 1 | 188 | 16.67 | 16.70 | 16.80 | 16.80 | 0 / 0 / 0 |
| network-original / 2 | 188 | 16.67 | 16.70 | 16.70 | 16.80 | 0 / 0 / 0 |

CPU-original has 11 then 7 rAF gaps at least 25 ms. CPU-hint has 54 then 50 such gaps. The hint has four then one gaps near 50 ms. Neither variant has a gap at least 100 ms. The repeated losses occur throughout loaded text. This supports a sustained cadence penalty under this 4x desktop stress. It does not show a steady 33 ms cadence or emulate Android hardware.

Native glyph callback and selected glyph gaps support the same difference. Headless presentation mean is 17.80/17.31 ms in the original and 24.10/22.87 ms in the hint. This feedback describes a virtual compositor, not physical FPS. In the network pair, rAF and glyph means stay near 16.7 ms with zero gaps at least 25 ms. The original has one 33.33 ms headless presentation gap on boot 1. Loaded text cadence remains distinct from resource loading.

## CPU, raster, and upload boundary

| Run / boot | RunTask n | Recorded tdur ms | tdur coverage | Wall dur | RasterTask n | RasterCHROMIUM n / wall | Upload leaf samples / sampled ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| cpu-original / 1 | 1134 | 646.00 | 1101/1134 | 2607.74 | 0 | 185 / 571.41 | 1039 / 635.86 |
| cpu-original / 2 | 1149 | 500.42 | 1058/1149 | 2057.09 | 0 | 190 / 526.39 | 1043 / 577.73 |
| cpu-hint / 1 | 885 | 802.74 | 838/885 | 3117.69 | 0 | 6 / 0.81 | 3321 / 1906.55 |
| cpu-hint / 2 | 919 | 803.74 | 886/919 | 3115.61 | 0 | 6 / 0.81 | 3324 / 1932.97 |
| network-hint / 1 | 1186 | 1114.53 | 1165/1186 | 1184.14 | 0 | 6 / 0.17 | 1249 / 736.26 |
| network-hint / 2 | 1180 | 965.83 | 1157/1180 | 1015.78 | 0 | 7 / 0.19 | 1155 / 656.45 |
| network-original / 1 | 1228 | 527.55 | 1174/1228 | 580.08 | 0 | 196 / 163.36 | 336 / 191.68 |
| network-original / 2 | 1181 | 500.16 | 1147/1181 | 540.82 | 0 | 196 / 145.00 | 265 / 157.22 |

RunTask sums use complete renderer-main tasks whose start occurs inside the window. tdur measures native thread CPU. The table sums only reported tdur and shows event coverage. Missing tdur values are not independently measured CPU. dur measures wall time. CPU4 can add throttling delays. Statistical leaf time deltas are not actual thread CPU and are not additive with tdur. No nested event totals are added. Service/raster, link, and wait events retain separate thread scopes in measurements.json.

Loaded text windows contain no RasterTask spans. They do contain RasterImplementation::RasterCHROMIUM and GPU decoder raster service spans. The hint reduces these calls from 185/190 to 6/6 under CPU stress and from 196/196 to 6/7 under network stress. RasterTask exists elsewhere in each full trace. Do not rename the raster service calls as RasterTask or infer completed GPU execution.

The upload leaf is function xe at zero-based line 4195, column 13880 in each exact engine chunk. Its body calls e.texSubImage2D(...arguments). Source snippets and SHA256 hashes prove this attribution. The exact engine marks screenTexture.needsUpdate at source line 1374. These samples identify the upload API boundary. They do not isolate conversion, queue wait, transfer, or GPU hardware time. Under CPU4, upload sample attribution rises from 578–636 ms to 1907–1933 ms. At CPU1, the hint records 966–1115 ms of renderer thread CPU versus 500–528 ms in the original.

## Limits, failures, and cleanup

There is one new pair per stress mode. Boot 1 and replay are correlated windows, not independent sessions. Fixed order, OS caches, driver caches, temperatures, and browser overhead remain uncontrolled. The prior native pairs provide context only. The old unpaired network hint is not pooled. The physical Adreno observation of about 33 ms versus 16.7 ms stays separate. Desktop CPU stress cannot identify that Android cause.

The new evidence supports a hint acceptance warning on this desktop backend. It supports no additional source optimization and no production acceptance. The separate Astra review owns prior native/radio interpretation. This task adds no interaction recording or native pair.

failure-log.json preserves setup and analysis corrections. Prior failed CPU and network-original results remain excluded and unchanged. Chrome launch logs retain updater pipe-access and deprecated endpoint messages. These background messages produce no measured CDP failure or app runtime exception. Auto-review granted narrow artifact/owned-browser commands after sandbox denial. No approval refusal occurred.

All owned measured and warm-up browsers report exit code 0 without forced termination. Each server stops through its owned process handle. Profiles and raw evidence remain available. cleanup-verification.json records the final process and port check. verification.json records exact source/build identity and unchanged tracked files, index, HEAD, and proposal ref.
