# TBT implementation results

No qualifying implementation was retained. All 18 source trials were dropped: they either failed to cut Lighthouse mobile TBT, delayed room-ready, or only moved a native wait. The goal of reducing TBT with unchanged output and no slower readiness was not achieved. The perf/tbt2 branch remains at c9be94d, with no commits and zero source diff after cleanup. No push, merge or deployment.

## Attribution

- Native AudioContext construction: 78.77 ms observed / 315 ms Lantern, 98.33 ms real-4x, sound.ts:3-4 inside engine.ts:257 breathe().then(createBootSound). Explicit sample rate and asynchronous output selection probes did not remove it. Asynchronous device enumeration primed the browser service and reduced construction in a navigation-time probe; its source trial failed the no-slower-ready constraint.
- Native texSubImage2D: 170.01 ms observed / 680 ms Lantern; renderer.initTexture(room-day), the fifth baked lightmap, 1024x1024. Capture-only texture labels confirm room-day (the initial draft incorrectly inferred props-day). Source: three.module.js:10659 and engine.ts:837-848. GPU-backed bitmap trials moved the stall to getProgramInfoLog/getProgramParameter. Driver internals remain unknown.
- GLTF loadBufferView, blob URL/fetch, texture/material setup, decoded mesh/node assembly: 47.51 ms observed / 190 ms Lantern, 304.45 ms real-4x. loadTextureImage bufferView promise continuations (GLTFLoader.js:3364,3381), loadMaterial Promise.all continuation (3794), loadMesh Promise.all continuation (3888), Draco worker onmessage resolves geometry (DRACOLoader.js:448,252). Mesh starts reduced the real burst to 72 ms but failed Lighthouse A/B; texture starts reduced it to 179 ms plus 53 ms but delayed ready.
- Module evaluation plus the resumed await import(engine) calling createRoom/WebGLRenderer/setSize: 116.78 ms observed / 234 ms linked Lantern node, 272.94 ms real-4x. BootIntro.svelte:200; engine.ts:127-136; three.module.js:16409,16708. An initial yield split real tasks but failed Lighthouse.
- Other >10 ms tasks: SvelteKit hydration/effect flush (124.45 ms real-4x), post-parse scene/material/cube bounds (69.95 ms), rounded cube construction (50.96 ms), buffer upload (40.39 ms), setup after upload(foliage) (47.48 ms), cube ConvexGeometry (88.64 ms), individual bounds scans, shader submissions, warm-render shader reflection/texture transfers, Svelte readiness transitions and the first visible clock/portrait/render frame (56.48 ms). Every observed >10 ms task, its sampled functions and continuation is listed in findings.md; marked baseline ledgers verify exact engine resume labels.

Chrome/Vulkan exposes no KHR_parallel_shader_compile here. compileAsync polling is not the anonymous native burst. No node_modules or binary assets were edited. No Stages 4/5 experiments were revisited. Native construction/upload/reflection calls remain indivisible through the public APIs exercised; this is not a proof that no other optimization exists.

## Measurement

Chrome 154 at the requested path, --use-angle=vulkan --enable-gpu; Lighthouse 13.5 mobile simulation and the actual desktop config, fresh profiles, alternating build order. Real phone readiness: 412x915, DPR 2.625, actual CPU 4x, 150 ms RTT / 200000 bytes/s. Exact START performance mark is used, not polling time. Every counted run had START, a rendered canvas/screenshot, and no WebGL errors. The .glb.br local 404 fallback was verified in network logs and is common to both builds.

Local simulation differs from the deployed 76 / 827 ms report: simulated LCP often spans 3-15 seconds despite a prompt observed heading. These local results cannot establish a deployed score change. All valid samples are retained; no outlier was dropped to obtain a gain. Cohort 13 round 1 overlapped lint checks and is documented as a contamination risk; that candidate was rejected on readiness regardless. The first two desktop-labelled rounds of the earliest cohort used a mobile config and are invalid for desktop, excluded below. Later desktop reports verify configSettings.formFactor.

## Mesh hook and initial yield

### mobile

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 594.97 / 52 / 5.862 / 14.781 | 588.85 / 54 / 5.353 / 10.010 |
| 2 | 316.50 / 63 / 4.982 / 9.065 | 738.46 / 52 / 5.227 / 9.061 |
| 3 | 368.32 / 61 / 5.148 / 9.072 | 661.67 / 53 / 5.459 / 9.152 |
| 4 | 379.13 / 61 / 4.913 / 9.123 | 300.76 / 64 / 4.440 / 9.041 |
| Median | 373.72 / 61 / 5.065 / 9.098 | 625.26 / 54 / 5.290 / 9.106 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 791.0@1824.0 U; 467.0@1261.0 U; 342.0@734.0 U; 130.0@9834.2 E; 118.0@9964.2 E; 113.0@2944.0 U; 107.0@2691.0 U; 90.0@1171.0 U; 80.0@654.0 P; 80.0@2798.0 U; 76.0@2615.0 U; 74.0@3113.0 U; 66.0@2878.0 U; 56.0@3057.0 U; 52.0@1076.0 U.
- candidate 1: 791.0@1476.6 U; 440.0@870.6 U; 161.0@2306.6 U; 138.0@732.6 U; 134.0@2665.6 U; 117.0@9765.4 E; 87.0@645.6 P; 74.0@2467.6 U; 73.0@2592.6 U; 62.0@1352.6 U; 60.0@2856.6 U; 57.0@2799.6 U; 52.0@9895.4 E; 51.0@2541.6 U.
- baseline 2: 703.0@1191.9 U; 369.0@778.9 U; 168.0@9312.8 E; 136.0@1946.9 U; 104.0@2274.9 U; 102.0@9480.8 E; 84.0@694.9 P; 74.0@2082.9 U; 73.0@2201.9 U; 63.0@9582.8 E; 62.0@2438.9 U; 60.0@2378.9 U.
- candidate 2: 928.0@1540.5 U; 454.0@928.5 U; 150.0@2525.5 U; 130.0@798.5 U; 115.0@2890.5 U; 104.0@694.5 P; 103.0@9891.0 E; 89.0@2801.5 U; 85.0@2675.5 U; 74.0@3061.5 U; 56.0@1484.5 U; 56.0@3005.5 U; 53.0@1431.5 U.
- baseline 3: 756.0@1200.2 U; 369.0@786.2 U; 169.0@2017.2 U; 159.0@9385.4 E; 110.0@2390.2 U; 104.0@9544.4 E; 92.0@694.2 P; 85.0@2305.2 U; 77.0@2186.2 U; 62.0@2542.2 U.
- candidate 3: 792.0@1532.9 U; 471.0@902.9 U; 139.0@763.9 U; 139.0@2378.9 U; 127.0@2793.9 U; 109.0@654.9 P; 104.0@2689.9 U; 82.0@9827.5 E; 82.0@2517.9 U; 71.0@2974.9 U; 57.0@9948.5 E; 54.0@2324.9 E; 54.0@2920.9 U; 52.0@1419.9 U.
- baseline 4: 733.0@1049.9 U; 328.0@721.9 U; 172.0@1827.9 U; 142.0@2205.9 U; 138.0@9328.7 E; 136.0@9192.7 E; 87.0@2400.9 U; 83.0@1999.9 U; 82.0@2123.9 U; 78.0@643.9 P; 55.0@9466.7 E; 53.0@2347.9 U.
- candidate 4: 740.0@1269.7 U; 319.0@900.7 U; 130.0@2065.7 U; 125.0@775.7 U; 124.0@9429.5 E; 117.0@2397.7 U; 88.0@2309.7 U; 85.0@690.7 P; 70.0@2195.7 U; 69.0@2566.7 U; 52.0@2514.7 U; 50.0@1219.7 U.

Actual phone START-ready ms:

| Run | c9be94d | Trial |
|---|---:|---:|
| 1 | 14256.0 | 14288.0 |
| 2 | 14308.1 | 14184.0 |
| 3 | 14096.0 | 14058.2 |
| Median | 14256.0 | 14184.0 |

## Texture hook

### mobile

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 205.13 / 67 / 4.883 / 9.125 | 199.30 / 67 / 4.915 / 9.950 |
| 2 | 187.11 / 68 / 4.734 / 9.096 | 244.40 / 67 / 4.262 / 9.112 |
| 3 | 377.62 / 62 / 4.720 / 10.163 | 228.98 / 67 / 4.324 / 9.040 |
| 4 | 289.25 / 64 / 4.731 / 9.939 | 176.14 / 69 / 4.157 / 10.007 |
| Median | 247.19 / 66 / 4.733 / 9.532 | 214.14 / 67 / 4.293 / 9.531 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 700.0@1029.4 U; 307.0@722.4 U; 118.0@9788.2 E; 117.0@1777.4 U; 109.0@2042.4 U; 91.0@9906.2 E; 81.0@1961.4 U; 79.0@643.4 P; 67.0@1894.4 U; 63.0@2202.4 U; 51.0@2151.4 U.
- candidate 1: 696.0@1219.7 U; 327.0@892.7 U; 122.0@9328.4 E; 120.0@1967.7 U; 100.0@2221.7 U; 93.0@799.7 U; 87.0@712.7 P; 68.0@2087.7 U; 66.0@2155.7 U; 61.0@627.7 U; 56.0@2371.7 U; 50.0@2321.7 U.
- baseline 2: 626.0@1013.9 U; 300.0@713.9 U; 137.0@1656.9 U; 126.0@9743.4 E; 111.0@1984.9 U; 90.0@9869.4 E; 85.0@1899.9 U; 76.0@637.9 P; 68.0@1831.9 U; 56.0@2095.9 U; 55.0@2151.9 U.
- candidate 2: 798.0@1171.0 U; 351.0@820.0 U; 127.0@2016.0 U; 124.0@9379.1 E; 105.0@2275.0 U; 96.0@724.0 U; 82.0@642.0 P; 67.0@2143.0 U; 65.0@2210.0 U; 55.0@2429.0 U.
- baseline 3: 733.0@1096.2 U; 320.0@717.2 U; 123.0@9241.4 E; 122.0@1877.2 U; 122.0@2255.2 U; 106.0@1999.2 U; 99.0@2156.2 U; 89.0@9364.4 E; 73.0@644.2 P; 73.0@2424.2 U; 59.0@1037.2 U; 51.0@2105.2 U.
- candidate 3: 695.0@1217.0 U; 332.0@885.0 U; 158.0@9328.0 E; 126.0@1965.0 U; 111.0@774.0 U; 99.0@2219.0 U; 87.0@687.0 P; 66.0@2153.0 U; 62.0@2091.0 U; 59.0@2373.0 U; 55.0@2318.0 U.
- baseline 4: 829.0@1071.7 U; 294.0@777.7 U; 140.0@9311.5 E; 138.0@1950.7 U; 127.0@2227.7 U; 84.0@9451.5 E; 82.0@695.7 P; 74.0@2088.7 U; 65.0@2162.7 U; 55.0@626.7 U; 51.0@2399.7 U.
- candidate 4: 670.0@1145.9 U; 300.0@803.9 U; 129.0@9219.7 E; 115.0@1858.9 U; 103.0@2102.9 U; 87.0@716.9 U; 75.0@641.9 P; 67.0@1973.9 U; 62.0@2040.9 U; 52.0@2245.9 U.

### desktop

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 28.00 / 90 / 1.260 / 1.928 | 11.00 / 89 / 1.172 / 2.107 |
| 2 | 12.50 / 99 / 1.277 / 0.762 | 13.00 / 89 / 1.173 / 2.079 |
| Median | 20.25 / 95 / 1.269 / 1.345 | 12.00 / 89 / 1.173 / 2.093 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 146.0@308.5 U; 81.0@216.5 U; 78.0@1874.8 U.
- candidate 1: 141.0@314.4 U; 76.0@238.4 U; 61.0@1845.7 U.
- baseline 2: 177.0@317.6 U; 89.0@217.6 U; 60.0@1726.2 U; 55.0@1786.2 U.
- candidate 2: 145.0@317.8 U; 75.0@242.8 U; 63.0@1719.2 U.

Actual phone START-ready ms:

| Run | c9be94d | Trial |
|---|---:|---:|
| 1 | 13980.6 | 13933.9 |
| 2 | 13861.4 | 14207.1 |
| 3 | 13932.3 | 14129.6 |
| Median | 13932.3 | 14129.6 |

## Mesh hook alone

### mobile

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 201.50 / 67 / 4.654 / 10.012 | 295.49 / 62 / 5.043 / 14.606 |
| 2 | 251.50 / 84 / 4.733 / 3.150 | 261.97 / 84 / 4.532 / 3.161 |
| 3 | 203.00 / 67 / 4.785 / 9.111 | 133.68 / 70 / 4.506 / 9.049 |
| 4 | 209.00 / 67 / 5.005 / 9.264 | 155.00 / 70 / 4.197 / 9.098 |
| Median | 206.00 / 67 / 4.759 / 9.188 | 208.49 / 70 / 4.519 / 9.073 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 687.0@1058.0 U; 299.0@715.0 U; 129.0@1793.0 U; 122.0@9154.9 E; 103.0@9276.9 E; 98.0@2067.0 U; 75.0@1922.0 U; 72.0@643.0 P; 70.0@1997.0 U; 56.0@2165.0 U.
- candidate 1: 664.0@1525.5 U; 393.0@1132.5 U; 356.0@776.5 U; 140.0@9610.0 E; 105.0@2319.5 U; 97.0@2558.5 U; 76.0@2243.5 U; 73.0@703.5 P; 70.0@2424.5 U; 64.0@2494.5 U; 54.0@2655.5 U; 53.0@2709.5 U.
- baseline 2: 692.0@1067.3 U; 297.0@729.3 U; 137.0@2066.3 U; 131.0@9171.6 E; 110.0@1809.3 U; 99.0@9302.6 E; 82.0@647.3 P; 81.0@1919.3 U; 66.0@2000.3 U; 59.0@2255.3 U; 52.0@2203.3 U.
- candidate 2: 787.0@1178.5 U; 407.0@728.5 U; 128.0@2057.5 U; 117.0@9382.1 E; 117.0@2377.5 U; 80.0@648.5 P; 77.0@2300.5 U; 73.0@2185.5 U; 68.0@2545.5 U; 51.0@9509.1 E; 51.0@2494.5 U.
- baseline 3: 664.0@1032.8 U; 307.0@725.8 U; 136.0@9766.7 E; 121.0@1713.8 U; 101.0@1990.8 U; 89.0@9902.7 E; 82.0@643.8 P; 68.0@1922.8 U; 59.0@2136.8 U; 57.0@1865.8 U.
- candidate 3: 618.0@1053.3 U; 292.0@761.3 U; 124.0@1722.3 U; 121.0@9156.6 E; 115.0@1981.3 U; 74.0@687.3 P; 68.0@1913.3 U; 67.0@1846.3 U; 63.0@2153.3 U; 57.0@2096.3 U.
- baseline 4: 698.0@1037.5 U; 314.0@723.5 U; 118.0@9771.2 E; 113.0@2044.5 U; 108.0@1788.5 U; 89.0@9889.2 E; 81.0@1963.5 U; 79.0@644.5 P; 67.0@1896.5 U; 60.0@2212.5 U; 55.0@2157.5 U.
- candidate 4: 642.0@1009.6 U; 299.0@710.6 U; 127.0@1668.6 U; 118.0@9747.4 E; 109.0@1966.6 U; 74.0@1892.6 U; 70.0@640.6 P; 67.0@1825.6 U; 54.0@2120.6 U.

### desktop

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 8.00 / 88 / 1.177 / 2.191 | 20.50 / 90 / 1.553 / 1.856 |
| 2 | 31.00 / 92 / 1.152 / 1.780 | 18.00 / 88 / 1.200 / 2.238 |
| Median | 19.50 / 90 / 1.164 / 1.986 | 19.25 / 89 / 1.377 / 2.047 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 156.0@295.3 U; 80.0@205.3 U; 56.0@1711.4 U; 52.0@1767.4 U.
- candidate 1: 167.0@343.4 U; 91.0@1963.8 U; 84.0@247.4 U.
- baseline 2: 141.0@286.1 U; 81.0@1836.6 U; 75.0@211.1 U.
- candidate 2: 150.0@289.5 U; 76.0@213.5 U; 68.0@1860.8 U.

Actual phone START-ready ms:

| Run | c9be94d | Trial |
|---|---:|---:|
| 1 | 13897.9 | 13961.5 |
| 2 | 14002.3 | 13966.1 |
| 3 | 13993.8 | 13917.8 |
| Median | 13993.8 | 13961.5 |

## Material/bounds boundary

### mobile

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 319.75 / 63 / 4.762 / 9.263 | 201.00 / 67 / 4.775 / 9.104 |
| 2 | 407.50 / 58 / 5.209 / 14.788 | 318.50 / 63 / 4.920 / 9.082 |
| 3 | 169.39 / 68 / 4.735 / 9.998 | 217.00 / 67 / 4.763 / 10.135 |
| 4 | 161.00 / 68 / 4.763 / 9.121 | 342.50 / 60 / 5.245 / 14.790 |
| Median | 244.57 / 66 / 4.763 / 9.630 | 267.75 / 65 / 4.847 / 9.620 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 711.0@1082.1 U; 361.0@721.1 U; 144.0@1841.1 U; 143.0@2220.1 U; 128.0@9203.3 E; 103.0@1985.1 U; 91.0@9331.3 E; 85.0@2135.1 U; 75.0@646.1 P; 71.0@2420.1 U; 57.0@2363.1 U.
- candidate 1: 634.0@1019.1 U; 304.0@715.1 U; 140.0@1710.1 U; 127.0@9756.5 E; 103.0@2073.1 U; 89.0@9883.5 E; 77.0@1996.1 U; 76.0@639.1 P; 65.0@1931.1 U; 60.0@2176.1 U; 52.0@1879.1 U.
- baseline 2: 767.0@1056.1 U; 386.0@1882.1 U; 332.0@724.1 U; 128.0@9238.2 E; 120.0@2602.1 U; 116.0@2268.1 U; 98.0@9366.2 E; 77.0@2525.1 U; 75.0@649.1 P; 74.0@2384.1 U; 67.0@2458.1 U; 63.0@2782.1 U; 60.0@2722.1 U.
- candidate 2: 767.0@1097.3 U; 328.0@769.3 U; 144.0@9287.6 E; 116.0@1919.3 U; 111.0@9431.6 E; 100.0@2180.3 U; 78.0@2035.3 U; 73.0@696.3 P; 67.0@2113.3 U; 59.0@2329.3 U.
- baseline 3: 661.0@1011.6 U; 298.0@713.6 U; 123.0@9747.7 E; 120.0@1689.6 U; 106.0@1980.6 U; 87.0@9870.7 E; 73.0@640.6 P; 72.0@1908.6 U; 68.0@1840.6 U; 60.0@2086.6 U; 54.0@2146.6 U.
- candidate 3: 625.0@1020.2 U; 305.0@715.2 U; 128.0@9727.3 E; 117.0@1659.2 U; 102.0@1997.2 U; 84.0@9855.3 E; 80.0@2099.2 U; 78.0@637.2 P; 72.0@1805.2 U; 61.0@1936.2 U; 59.0@1877.2 U; 53.0@2179.2 U.
- baseline 4: 651.0@994.3 U; 277.0@717.3 U; 122.0@9781.9 E; 110.0@1659.3 U; 108.0@9903.9 E; 106.0@1930.3 U; 73.0@644.3 P; 62.0@1807.3 U; 61.0@1869.3 U; 53.0@2076.3 U.
- candidate 4: 818.0@1042.6 U; 321.0@1911.6 U; 319.0@723.6 U; 135.0@2232.6 U; 127.0@9269.2 E; 110.0@2551.6 U; 88.0@9396.2 E; 73.0@650.6 P; 66.0@2422.6 U; 63.0@2488.6 U; 55.0@2367.6 U; 55.0@2661.6 U; 50.0@2716.6 U.

### desktop

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 59.00 / 87 / 1.490 / 2.208 | 54.00 / 87 / 1.568 / 2.126 |
| 2 | 10.00 / 88 / 1.167 / 2.206 | 13.00 / 89 / 1.157 / 2.082 |
| Median | 34.50 / 88 / 1.328 / 2.207 | 33.50 / 88 / 1.362 / 2.104 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 175.0@312.5 U; 97.0@1727.5 U; 91.0@208.5 U; 62.0@1824.5 U.
- candidate 1: 180.0@353.0 U; 90.0@253.0 U; 83.0@1795.2 U; 71.0@1878.2 U.
- baseline 2: 145.0@296.1 U; 74.0@210.1 U; 60.0@1855.9 U.
- candidate 2: 131.0@296.4 U; 79.0@205.4 U; 63.0@1850.9 U.

Actual phone START-ready ms:

| Run | c9be94d | Trial |
|---|---:|---:|
| 1 | 14098.8 | 13999.2 |
| 2 | 14005.6 | 13967.4 |
| 3 | 13968.2 | 13922.9 |
| Median | 14005.6 | 13967.4 |

## Audio service priming

### mobile

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 235.50 / 66 / 4.782 / 9.556 | 125.11 / 69 / 4.889 / 9.128 |
| 2 | 252.00 / 66 / 4.807 / 9.175 | 205.00 / 60 / 6.274 / 14.779 |
| 3 | 223.82 / 66 / 4.822 / 9.105 | 157.02 / 86 / 5.168 / 3.196 |
| 4 | 406.49 / 60 / 5.303 / 9.070 | 215.71 / 67 / 4.830 / 9.111 |
| Median | 243.75 / 66 / 4.815 / 9.140 | 181.01 / 68 / 5.029 / 9.119 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 736.0@1034.5 U; 317.0@717.5 U; 126.0@9180.1 E; 123.0@9306.1 E; 102.0@2054.5 U; 92.0@1823.5 U; 77.0@640.5 P; 76.0@1915.5 U; 65.0@2205.5 U; 63.0@1991.5 U.
- candidate 1: 659.0@836.9 U; 128.0@9791.3 E; 118.0@1514.9 U; 109.0@727.9 U; 103.0@1854.9 U; 90.0@9919.3 E; 80.0@647.9 P; 74.0@1632.9 U; 71.0@1783.9 U; 52.0@1997.9 U.
- baseline 2: 717.0@1065.8 U; 313.0@752.8 U; 137.0@9218.8 E; 121.0@1828.8 U; 109.0@2093.8 U; 96.0@9355.8 E; 94.0@658.8 P; 77.0@2016.8 U; 67.0@1949.8 U; 66.0@2250.8 U.
- candidate 2: 860.0@1252.5 U; 183.0@896.5 U; 180.0@2228.5 U; 140.0@9544.0 E; 115.0@2671.5 U; 113.0@9684.0 E; 101.0@640.5 U; 98.0@9882.0 E; 92.0@2579.5 U; 82.0@1170.5 U; 81.0@2408.5 U; 74.0@822.5 P; 70.0@2839.5 U; 65.0@741.5 P; 55.0@2173.5 U; 54.0@9797.0 E; 53.0@2786.5 U.
- baseline 3: 716.0@1009.2 U; 282.0@727.2 U; 131.0@9757.1 E; 128.0@1771.2 U; 108.0@2101.2 U; 94.0@9888.1 E; 85.0@642.2 P; 80.0@2021.2 U; 79.0@1899.2 U; 50.0@2250.2 U.
- candidate 3: 728.0@974.7 U; 147.0@9910.4 E; 146.0@1724.7 U; 122.0@10057.4 E; 116.0@817.7 U; 110.0@2085.7 U; 109.0@708.7 P; 93.0@1915.7 U; 77.0@2008.7 U; 57.0@2236.7 U.
- baseline 4: 765.0@1286.0 U; 377.0@828.0 U; 147.0@2119.0 U; 135.0@9482.0 E; 129.0@699.0 P; 121.0@2467.0 U; 107.0@9617.0 E; 78.0@2389.0 U; 75.0@2314.0 U; 69.0@2641.0 U; 54.0@9724.0 E; 53.0@2588.0 U.
- candidate 4: 788.0@878.8 U; 167.0@1683.8 U; 119.0@9766.7 E; 116.0@715.8 U; 112.0@2093.8 U; 91.0@1886.8 U; 87.0@9885.7 E; 75.0@640.8 P; 70.0@2023.8 U; 59.0@2258.8 U; 53.0@2205.8 U.

### desktop

Cells: TBT ms / score / SI seconds / LCP seconds.

| Run | c9be94d | Trial |
|---|---|---|
| 1 | 15.00 / 88 / 1.166 / 2.205 | 43.00 / 90 / 1.505 / 1.911 |
| 2 | 17.00 / 89 / 1.214 / 2.080 | 29.00 / 88 / 1.172 / 2.204 |
| Median | 16.00 / 89 / 1.190 / 2.143 | 36.00 / 89 / 1.338 / 2.058 |

Per-run simulated long tasks, duration@start in ms (U = Lighthouse unattributable, E = engine chunk, P = route):

- baseline 1: 138.0@291.0 U; 76.0@215.0 U; 63.0@1795.1 U; 52.0@1858.1 U.
- candidate 1: 179.0@302.9 U; 82.0@1859.4 U; 61.0@1941.4 U.
- baseline 2: 162.0@295.0 U; 77.0@207.0 U; 63.0@1720.2 U; 54.0@1783.2 U.
- candidate 2: 154.0@247.9 U; 75.0@1854.3 U; 54.0@1929.3 U.

Actual phone START-ready ms:

| Run | c9be94d | Trial |
|---|---:|---:|
| 1 | 14750.9 | 14356.8 |
| 2 | 14368.7 | 14428.6 |
| 3 | 14391.5 | 14416.5 |
| 4 | 14152.9 | 14109.7 |
| 5 | 14358.8 | 14185.3 |
| 6 | 14392.4 | 14632.2 |
| 7 | 14743.8 | 14641.4 |
| Median | 14391.5 | 14416.5 |

