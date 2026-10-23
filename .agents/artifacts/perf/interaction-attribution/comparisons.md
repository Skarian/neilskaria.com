### Boot: omit glyph painting, dirty full uploads retained (4x)

Baselines: extended-4x-A6-light.json, extended-4x-A8-light.json, extended-4x-A9-light.json. Controls: extended-4x-E1-light.json, extended-4x-E2-light.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 27.2–28.8 | 17.7–17.9 | 27.4 → 17.8; Δ -9.6ms (-35.0%) |
| max | 28.9–36.3 | 20.9–21.2 | 29.6 → 21.0; Δ -8.5ms (-28.9%) |
| over34 | 0.0–1.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0 (n/a) |

### Boot: uploads suppressed (4x light)

Baselines: extended-4x-A4-light.json, extended-4x-A5-light.json, extended-4x-A6-light.json. Controls: extended-4x-C3-light.json, extended-4x-C4-light.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 26.0–27.6 | 26.2–26.8 | 27.4 → 26.5; Δ -0.9ms (-3.3%) |
| max | 29.6–32.3 | 31.5–32.2 | 30.9 → 31.9; Δ 0.9ms (3.1%) |
| over34 | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0 (n/a) |

### Boot: uploads suppressed (1x light)

Baselines: extended-1x-A1-light.json, extended-1x-A2-light.json, extended-1x-A3-light.json. Controls: extended-1x-C1-light.json, extended-1x-C2-light.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 17.9–18.0 | 17.8–17.9 | 18.0 → 17.9; Δ -0.1ms (-0.8%) |
| max | 18.3–18.6 | 18.2–18.5 | 18.6 → 18.4; Δ -0.2ms (-1.3%) |
| over34 | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0 (n/a) |

### Boot: scene submission omitted (4x GPU diagnostic)

Baselines: extended-4x-A1.json, extended-4x-A2.json, extended-4x-A3.json. Controls: extended-4x-D1.json, extended-4x-D2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 25.9–37.5 | 22.1–22.6 | 25.9 → 22.4; Δ -3.6ms (-13.7%) |
| max | 29.7–43.6 | 30.1–33.2 | 30.3 → 31.6; Δ 1.3ms (4.5%) |
| over34 | 0.0–11.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0 (n/a) |

### lantern 1x: panel mounting deferred, light

Baselines: lantern-1x-A-2-light.json, lantern-1x-A-3-light.json, lantern-1x-A-4-light.json. Controls: lantern-1x-P-1-light.json, lantern-1x-P-2-light.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 17.7–18.1 | 17.7–17.7 | 18.1 → 17.7; Δ -0.4ms (-2.2%) |
| max | 33.5–37.4 | 18.0–18.0 | 36.6 → 18.0; Δ -18.6ms (-50.8%) |
| over34 | 0.0–1.0 | 0.0–0.0 | 1.0 → 0.0; Δ -1.0 (-100.0%) |
| cameraDelay | 35.8–41.4 | 42.2–43.0 | 39.5 → 42.6; Δ 3.1ms (7.8%) |
| dispatchLead | 15.5–22.9 | 10.6–18.6 | 19.2 → 14.6; Δ -4.6ms (-24.0%) |
| fit | 6.5–7.0 | 6.7–7.0 | 6.6 → 6.9; Δ 0.3ms (3.8%) |
| bounds | 21.1–24.6 | 0.0–0.0 | 23.7 → 0.0; Δ -23.7ms (-100.0%) |
| audioContext | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| radioSynth | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| noise | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |

### lantern 4x: panel mounting deferred, light

Baselines: lantern-4x-A-11-light.json, lantern-4x-A-12-light.json, lantern-4x-A-13-light.json. Controls: lantern-4x-P-7-light.json, lantern-4x-P-8-light.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 21.3–31.5 | 23.9–25.0 | 21.8 → 24.4; Δ 2.6ms (12.2%) |
| max | 276.5–328.6 | 118.6–147.5 | 295.5 → 133.1; Δ -162.4ms (-55.0%) |
| over34 | 2.0–2.0 | 2.0–2.0 | 2.0 → 2.0; Δ 0.0 (0.0%) |
| cameraDelay | 257.0–304.0 | 85.5–102.7 | 284.7 → 94.1; Δ -190.6ms (-66.9%) |
| dispatchLead | 111.5–140.7 | 104.1–125.0 | 125.6 → 114.5; Δ -11.1ms (-8.8%) |
| fit | 37.4–43.1 | 30.4–42.9 | 40.3 → 36.6; Δ -3.7ms (-9.1%) |
| bounds | 145.2–177.4 | 0.0–0.0 | 150.8 → 0.0; Δ -150.8ms (-100.0%) |
| audioContext | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| radioSynth | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| noise | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |

### clock 1x: panel mounting deferred, light

Baselines: clock-1x-A-2-light.json, clock-1x-A-3-light.json, clock-1x-A-4-light.json. Controls: clock-1x-P-1-light.json, clock-1x-P-2-light.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 18.0–18.0 | 17.5–18.1 | 18.0 → 17.8; Δ -0.2ms (-1.1%) |
| max | 35.4–40.4 | 20.1–20.2 | 36.4 → 20.2; Δ -16.3ms (-44.6%) |
| over34 | 1.0–1.0 | 0.0–0.0 | 1.0 → 0.0; Δ -1.0 (-100.0%) |
| cameraDelay | 40.7–46.7 | 26.4–28.4 | 42.8 → 27.4; Δ -15.4ms (-36.0%) |
| dispatchLead | 6.7–16.5 | 13.4–17.2 | 8.9 → 15.3; Δ 6.4ms (71.9%) |
| fit | 7.2–7.5 | 7.5–7.9 | 7.5 → 7.7; Δ 0.2ms (2.7%) |
| bounds | 17.5–19.3 | 0.0–0.0 | 17.8 → 0.0; Δ -17.8ms (-100.0%) |
| audioContext | 0.3–0.5 | 0.3–0.4 | 0.5 → 0.4; Δ -0.1ms (-30.0%) |
| radioSynth | 2.7–3.4 | 2.5–2.6 | 3.0 → 2.5; Δ -0.5ms (-15.0%) |
| noise | 2.1–2.6 | 1.9–2.1 | 2.3 → 2.0; Δ -0.3ms (-13.0%) |

### clock 4x: panel mounting deferred, light

Baselines: clock-4x-A-14-light.json, clock-4x-A-15-light.json, clock-4x-A-16-light.json. Controls: clock-4x-P-7-light.json, clock-4x-P-8-light.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 21.0–55.3 | 34.7–48.0 | 22.7 → 41.4; Δ 18.6ms (82.2%) |
| max | 281.9–405.6 | 178.7–178.7 | 284.2 → 178.7; Δ -105.5ms (-37.1%) |
| over34 | 2.0–4.0 | 4.0–4.0 | 3.0 → 4.0; Δ 1.0 (33.3%) |
| cameraDelay | 279.5–394.8 | 158.4–163.5 | 283.1 → 161.0; Δ -122.1ms (-43.1%) |
| dispatchLead | 110.5–160.7 | 113.9–115.8 | 120.7 → 114.9; Δ -5.9ms (-4.8%) |
| fit | 43.7–61.8 | 44.0–49.7 | 46.4 → 46.9; Δ 0.4ms (1.0%) |
| bounds | 98.4–163.6 | 0.0–0.0 | 120.8 → 0.0; Δ -120.8ms (-100.0%) |
| audioContext | 2.2–3.3 | 2.5–2.9 | 2.8 → 2.7; Δ -0.1ms (-3.6%) |
| radioSynth | 12.0–18.4 | 11.6–16.9 | 12.1 → 14.3; Δ 2.1ms (17.8%) |
| noise | 7.6–11.7 | 7.4–11.4 | 8.2 → 9.4; Δ 1.2ms (14.6%) |

### lantern 4x: fitting removed with panel held out

Baselines: lantern-4x-P-3.json, lantern-4x-P-4.json, lantern-4x-P-5.json. Controls: lantern-4x-PF-1.json, lantern-4x-PF-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 34.8–39.1 | 39.4–42.8 | 37.4 → 41.1; Δ 3.7ms (9.9%) |
| max | 161.2–197.8 | 125.2–141.6 | 181.6 → 133.4; Δ -48.2ms (-26.5%) |
| over34 | 4.0–4.0 | 5.0–6.0 | 4.0 → 5.5; Δ 1.5 (37.5%) |
| cameraDelay | 135.3–154.2 | 79.8–95.0 | 154.1 → 87.4; Δ -66.7ms (-43.3%) |
| dispatchLead | 135.2–179.4 | 172.0–181.9 | 177.2 → 176.9; Δ -0.3ms (-0.1%) |
| fit | 46.5–58.0 | 0.2–0.6 | 49.2 → 0.4; Δ -48.8ms (-99.2%) |
| bounds | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| audioContext | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| radioSynth | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| noise | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |

### lantern 4x: outline omitted

Baselines: lantern-4x-A-10.json, lantern-4x-A-8.json, lantern-4x-A-9.json. Controls: lantern-4x-O-1.json, lantern-4x-O-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 18.8–42.7 | 18.2–18.2 | 20.5 → 18.2; Δ -2.3ms (-11.2%) |
| max | 260.5–386.7 | 213.3–262.1 | 316.0 → 237.7; Δ -78.3ms (-24.8%) |
| over34 | 2.0–3.0 | 2.0–2.0 | 2.0 → 2.0; Δ 0.0 (0.0%) |
| cameraDelay | 237.0–378.4 | 236.1–279.3 | 276.7 → 257.7; Δ -19.0ms (-6.9%) |
| dispatchLead | 141.3–167.3 | 60.2–96.4 | 142.8 → 78.3; Δ -64.5ms (-45.2%) |
| fit | 33.9–48.0 | 35.6–44.0 | 40.3 → 39.8; Δ -0.5ms (-1.2%) |
| bounds | 127.6–202.7 | 145.5–167.8 | 153.0 → 156.6; Δ 3.7ms (2.4%) |
| audioContext | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| radioSynth | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| noise | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |

### lantern 4x: empty native panel animation vs cached bounds

Baselines: lantern-4x-L-3.json, lantern-4x-L-4.json, lantern-4x-L-5.json. Controls: lantern-4x-I-1.json, lantern-4x-I-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 19.3–21.0 | 18.7–35.6 | 20.9 → 27.1; Δ 6.3ms (29.9%) |
| max | 306.1–314.9 | 283.8–372.7 | 306.5 → 328.3; Δ 21.8ms (7.1%) |
| over34 | 2.0–2.0 | 2.0–3.0 | 2.0 → 2.5; Δ 0.5 (25.0%) |
| cameraDelay | 259.3–288.7 | 273.6–317.4 | 286.5 → 295.5; Δ 9.0ms (3.1%) |
| dispatchLead | 149.1–164.2 | 126.5–203.1 | 156.7 → 164.8; Δ 8.1ms (5.2%) |
| fit | 36.9–43.2 | 40.7–44.4 | 42.4 → 42.6; Δ 0.2ms (0.4%) |
| bounds | 0.0–0.1 | 0.2–0.5 | 0.0 → 0.4; Δ 0.4ms (n/a) |
| audioContext | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| radioSynth | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| noise | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |

### clock 4x: fitting removed with panel held out

Baselines: clock-4x-P-3.json, clock-4x-P-4.json, clock-4x-P-5.json. Controls: clock-4x-PF-1.json, clock-4x-PF-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 65.7–83.7 | 57.2–77.9 | 71.1 → 67.6; Δ -3.6ms (-5.0%) |
| max | 233.1–295.7 | 150.1–200.8 | 283.6 → 175.4; Δ -108.2ms (-38.1%) |
| over34 | 6.0–7.0 | 6.0–7.0 | 6.0 → 6.5; Δ 0.5 (8.3%) |
| cameraDelay | 208.1–278.2 | 121.7–193.9 | 234.3 → 157.8; Δ -76.5ms (-32.7%) |
| dispatchLead | 155.9–204.6 | 158.5–173.6 | 160.3 → 166.1; Δ 5.8ms (3.6%) |
| fit | 47.9–71.4 | 0.6–0.7 | 67.7 → 0.7; Δ -67.0ms (-99.0%) |
| bounds | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| audioContext | 3.4–38.4 | 1.8–3.3 | 3.6 → 2.5; Δ -1.0ms (-29.2%) |
| radioSynth | 17.4–20.2 | 13.4–17.9 | 19.0 → 15.6; Δ -3.4ms (-17.6%) |
| noise | 11.6–12.8 | 8.3–11.1 | 11.6 → 9.7; Δ -1.9ms (-16.4%) |

### clock 4x: outline omitted

Baselines: clock-4x-A-10.json, clock-4x-A-11.json, clock-4x-A-12.json. Controls: clock-4x-O-1.json, clock-4x-O-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 31.2–53.1 | 27.6–59.9 | 32.8 → 43.8; Δ 11.0ms (33.4%) |
| max | 289.2–327.6 | 213.3–286.2 | 314.7 → 249.7; Δ -65.0ms (-20.6%) |
| over34 | 2.0–3.0 | 3.0–4.0 | 2.0 → 3.5; Δ 1.5 (75.0%) |
| cameraDelay | 288.3–321.1 | 263.1–325.0 | 295.9 → 294.0; Δ -1.8ms (-0.6%) |
| dispatchLead | 126.4–148.6 | 51.2–100.2 | 133.6 → 75.7; Δ -57.9ms (-43.3%) |
| fit | 43.6–46.3 | 42.1–58.4 | 43.9 → 50.3; Δ 6.3ms (14.5%) |
| bounds | 117.2–130.8 | 110.9–129.4 | 127.1 → 120.2; Δ -7.0ms (-5.5%) |
| audioContext | 1.8–2.4 | 2.3–2.8 | 2.4 → 2.5; Δ 0.1ms (6.2%) |
| radioSynth | 12.6–13.3 | 13.3–21.6 | 13.1 → 17.4; Δ 4.4ms (33.2%) |
| noise | 7.7–8.1 | 9.8–15.4 | 7.8 → 12.6; Δ 4.8ms (61.5%) |

### clock 4x: empty native panel animation vs cached bounds

Baselines: clock-4x-L-3.json, clock-4x-L-4.json, clock-4x-L-5.json. Controls: clock-4x-I-1.json, clock-4x-I-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 50.5–99.7 | 54.5–57.9 | 62.0 → 56.2; Δ -5.8ms (-9.4%) |
| max | 339.6–453.8 | 328.6–376.3 | 426.6 → 352.5; Δ -74.1ms (-17.4%) |
| over34 | 4.0–5.0 | 6.0–6.0 | 4.0 → 6.0; Δ 2.0 (50.0%) |
| cameraDelay | 321.5–448.5 | 323.1–367.4 | 424.1 → 345.3; Δ -78.9ms (-18.6%) |
| dispatchLead | 143.4–200.2 | 131.2–147.2 | 161.4 → 139.2; Δ -22.2ms (-13.8%) |
| fit | 51.1–63.9 | 43.6–53.3 | 60.9 → 48.4; Δ -12.4ms (-20.4%) |
| bounds | 0.0–0.1 | 0.4–0.6 | 0.1 → 0.5; Δ 0.4ms (400.0%) |
| audioContext | 3.1–3.8 | 1.9–2.5 | 3.7 → 2.2; Δ -1.5ms (-40.5%) |
| radioSynth | 17.9–21.1 | 15.5–17.9 | 20.7 → 16.7; Δ -4.0ms (-19.3%) |
| noise | 11.6–14.3 | 9.1–11.8 | 13.8 → 10.5; Δ -3.3ms (-24.3%) |

### Radio 4x: prepared noise with panel/fitting held out

Baselines: clock-4x-PF-3.json, clock-4x-PF-4.json, clock-4x-PF-5.json. Controls: clock-4x-PNF-1.json, clock-4x-PNF-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 54.8–74.3 | 61.2–74.1 | 55.9 → 67.6; Δ 11.8ms (21.0%) |
| max | 178.3–207.2 | 184.9–193.8 | 205.9 → 189.4; Δ -16.6ms (-8.0%) |
| over34 | 4.0–5.0 | 4.0–5.0 | 5.0 → 4.5; Δ -0.5 (-10.0%) |
| cameraDelay | 155.4–185.1 | 145.2–176.0 | 170.3 → 160.6; Δ -9.7ms (-5.7%) |
| dispatchLead | 157.6–189.8 | 180.0–183.9 | 174.1 → 181.9; Δ 7.9ms (4.5%) |
| fit | 0.7–0.8 | 0.6–0.7 | 0.7 → 0.7; Δ -0.1ms (-7.1%) |
| bounds | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| audioContext | 2.7–3.4 | 3.0–28.7 | 2.7 → 15.9; Δ 13.1ms (487.0%) |
| radioSynth | 17.2–22.8 | 7.0–7.1 | 21.3 → 7.0; Δ -14.3ms (-66.9%) |
| noise | 11.0–14.7 | 0.6–1.4 | 14.3 → 1.0; Δ -13.3ms (-93.0%) |

### Radio 4x: prepared suspended context with panel/fitting held out

Baselines: clock-4x-PF-6.json, clock-4x-PF-7.json, clock-4x-PF-8.json. Controls: clock-4x-PFR-1.json, clock-4x-PFR-2.json. Median across runs (even samples averaged); per-frame p95 is nearest rank.

| Metric | Baseline range | Control range | Median change |
| --- | ---: | ---: | --- |
| p95 | 52.5–70.1 | 54.4–62.0 | 60.8 → 58.2; Δ -2.6ms (-4.3%) |
| max | 172.3–191.8 | 158.7–162.9 | 186.1 → 160.8; Δ -25.3ms (-13.6%) |
| over34 | 4.0–7.0 | 6.0–6.0 | 5.0 → 6.0; Δ 1.0 (20.0%) |
| cameraDelay | 137.8–157.2 | 125.7–139.8 | 147.3 → 132.8; Δ -14.5ms (-9.9%) |
| dispatchLead | 156.1–190.1 | 137.2–150.0 | 169.4 → 143.6; Δ -25.8ms (-15.2%) |
| fit | 0.3–1.0 | 0.5–0.6 | 0.7 → 0.5; Δ -0.2ms (-21.4%) |
| bounds | 0.0–0.0 | 0.0–0.0 | 0.0 → 0.0; Δ 0.0ms (n/a) |
| audioContext | 2.4–2.9 | 0.2–0.4 | 2.7 → 0.3; Δ -2.4ms (-88.9%) |
| radioSynth | 15.3–19.2 | 15.2–16.8 | 16.9 → 16.0; Δ -0.9ms (-5.3%) |
| noise | 10.8–12.4 | 9.9–11.2 | 11.2 → 10.6; Δ -0.6ms (-5.8%) |