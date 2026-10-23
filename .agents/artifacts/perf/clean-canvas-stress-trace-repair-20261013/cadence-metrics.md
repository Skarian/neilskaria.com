# Text cadence metrics

All times are milliseconds. Each window starts at the first selected N glyph and lasts 3150 ms. Boot 2 follows an actual BACK.

Quantiles use nearest rank: sorted x[ceil(p*n)-1]. n counts intervals, not measured sessions.

| Run | Boot | Signal | n | mean | p50 | p95 | max | >=25 | >=42 | >=100 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cpu-original | 1 | rAF | 177 | 17.70 | 16.70 | 33.30 | 33.40 | 11 | 0 | 0 |
| cpu-original | 1 | N glyph | 178 | 17.68 | 16.80 | 25.50 | 31.10 | 11 | 0 | 0 |
| cpu-original | 1 | native glyph callback | 178 | 17.69 | 16.92 | 25.30 | 31.27 | 12 | 0 | 0 |
| cpu-original | 1 | headless presentation | 176 | 17.80 | 16.67 | 33.33 | 33.33 | 12 | 0 | 0 |
| cpu-original | 2 | rAF | 181 | 17.31 | 16.70 | 16.80 | 33.40 | 7 | 0 | 0 |
| cpu-original | 2 | N glyph | 182 | 17.30 | 16.70 | 23.40 | 29.10 | 6 | 0 | 0 |
| cpu-original | 2 | native glyph callback | 182 | 17.30 | 16.76 | 23.19 | 28.70 | 4 | 0 | 0 |
| cpu-original | 2 | headless presentation | 181 | 17.31 | 16.67 | 16.67 | 33.33 | 7 | 0 | 0 |
| cpu-hint | 1 | rAF | 130 | 24.10 | 16.70 | 33.40 | 50.10 | 54 | 4 | 0 |
| cpu-hint | 1 | N glyph | 130 | 24.08 | 21.50 | 37.70 | 45.30 | 33 | 2 | 0 |
| cpu-hint | 1 | native glyph callback | 130 | 24.10 | 21.73 | 37.84 | 45.29 | 33 | 2 | 0 |
| cpu-hint | 1 | headless presentation | 130 | 24.10 | 16.67 | 33.33 | 50.00 | 54 | 4 | 0 |
| cpu-hint | 2 | rAF | 137 | 22.87 | 16.70 | 33.40 | 50.00 | 50 | 1 | 0 |
| cpu-hint | 2 | N glyph | 137 | 22.88 | 20.90 | 34.20 | 40.40 | 34 | 0 | 0 |
| cpu-hint | 2 | native glyph callback | 137 | 22.88 | 20.95 | 33.95 | 40.45 | 34 | 0 | 0 |
| cpu-hint | 2 | headless presentation | 137 | 22.87 | 16.67 | 33.33 | 50.00 | 50 | 1 | 0 |
| network-hint | 1 | rAF | 188 | 16.67 | 16.70 | 16.80 | 16.80 | 0 | 0 | 0 |
| network-hint | 1 | N glyph | 189 | 16.66 | 16.60 | 17.50 | 18.10 | 0 | 0 | 0 |
| network-hint | 1 | native glyph callback | 189 | 16.67 | 16.65 | 17.45 | 18.07 | 0 | 0 | 0 |
| network-hint | 1 | headless presentation | 188 | 16.67 | 16.67 | 16.67 | 16.67 | 0 | 0 | 0 |
| network-hint | 2 | rAF | 188 | 16.67 | 16.70 | 16.70 | 16.80 | 0 | 0 | 0 |
| network-hint | 2 | N glyph | 188 | 16.67 | 16.60 | 17.60 | 18.20 | 0 | 0 | 0 |
| network-hint | 2 | native glyph callback | 188 | 16.67 | 16.58 | 17.59 | 18.29 | 0 | 0 | 0 |
| network-hint | 2 | headless presentation | 188 | 16.67 | 16.67 | 16.67 | 16.67 | 0 | 0 | 0 |
| network-original | 1 | rAF | 188 | 16.67 | 16.70 | 16.80 | 16.80 | 0 | 0 | 0 |
| network-original | 1 | N glyph | 189 | 16.66 | 16.70 | 17.40 | 18.20 | 0 | 0 | 0 |
| network-original | 1 | native glyph callback | 189 | 16.67 | 16.66 | 17.41 | 18.28 | 0 | 0 | 0 |
| network-original | 1 | headless presentation | 187 | 16.76 | 16.67 | 16.67 | 33.33 | 1 | 0 | 0 |
| network-original | 2 | rAF | 188 | 16.67 | 16.70 | 16.70 | 16.80 | 0 | 0 | 0 |
| network-original | 2 | N glyph | 189 | 16.66 | 16.60 | 17.40 | 19.00 | 0 | 0 | 0 |
| network-original | 2 | native glyph callback | 189 | 16.66 | 16.65 | 17.38 | 18.55 | 0 | 0 | 0 |
| network-original | 2 | headless presentation | 188 | 16.67 | 16.67 | 16.67 | 16.67 | 0 | 0 | 0 |
