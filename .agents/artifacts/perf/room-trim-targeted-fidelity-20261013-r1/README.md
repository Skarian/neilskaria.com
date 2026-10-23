# Room trim targeted fidelity check (r1), 2026-10-13

Agent: test sub-agent, Claude Opus 5.5 (user override). Scope: one bounded local check of the room trim candidate in
`../room-visibility-trim-experiment-20261013/` (E). This folder is F. This check did no deployment, source
integration, Git change, install, account change or performance timing. The deployed preview was not touched.

## Outcome

1. **The 20 removed nodes got 0 ID pixels in every sample of this check.** The ID pass is the corrected pass in
   `tools/idpass.js`. The samples are 2,556 rendered frames, 3,650 interpolated path poses and 26 static states.
   No node needs to stay. No revised candidate was made.
2. **The phone lantern-focus difference is run noise.** A second candidate capture differs from the new baseline
   control by only 899 pixels.
3. **The phone bonsai-focus difference is a framing shift, not a missing surface.** Both candidate runs show the
   same content 2 to 3 pixels higher than both baseline runs. The same baseline-model build also changes its bonsai
   framing by 3.7 pixels between bonsai openings. The exact trigger is not isolated (see "Phone noise reference").
4. These results come from finite samples. They are not a proof for all poses, devices or interactions.

**Recommendation (narrow):** keep the 20-node candidate (raw SHA-256 `2df7922e…4335`, unchanged). Before deployment,
do one check of the bonsai-focus framing on phone. Open bonsai focus in baseline and candidate in alternating order,
several times each, and compare the camera pose. Do not reject the trim on the current evidence.

## Corrected ID pass (step 1)

File: `tools/idpass.js`. It runs in the E fixture build (`E/fixture`, the baseline model with ID tags on the 31 bed and
background nodes). It is fixture-only. No source file was copied or changed. No build was made.

- **Targets (31 nodes):** flat ID colour, `DoubleSide`. This is the true side for every GLB material. For the runtime
  Sky material (`FrontSide`), `DoubleSide` is over-inclusive.
- **Bonsai parts are hidden, not black.** They do not occlude. The pass finds them by runtime identity, not by name:
  - Foliage: geometry with the `shootId`, `node` and `anchor` attributes, and the `bonsai-shoots` program key.
  - Twigs: child of the foliage turntable, `MeshStandardMaterial` colour `#4a3324`, no map, no vertex colours.
  - Clumps: vertex-coloured `MeshStandardMaterial`, `DoubleSide`, roughness 0.8, `color` attribute, no `shootId`.
- **Other opaque meshes are black occluders with their own side.** The pass keeps the side per material (per group
  for material arrays). Each layer-0 sample had 50 `DoubleSide`, 13 `FrontSide` and 8 instanced `DoubleSide`
  occluders. FrontSide: Base, HingeLeft, HingeRight, Lid, HingeLid, HingeNeck, Screen, ScreenCover, ClockRadio_5,
  ClockRadio_6, ClockDisplay, LanternPaper, PortraitPicture. Instanced: the 8 runtime cube meshes (Mesh:229–235, 239).
- **Hidden (does not occlude):** transparent, points, lines, sprites, `material.visible = false`, and
  `depthWrite`, `depthTest` or `colorWrite` set to false. Hiding can only increase ID counts.
- **Meshes hidden on layer 0 in every sample:** `BonsaiShoots` (foliage), `BonsaiTwigs`, `ClockRadio_3` (clock
  glass, transparent), `Mesh:252` (transparent contact shadow), `Points:262` (dust). No clump existed in any run
  because no run cut the tree. The `BonsaiShootsOutline` copies are not on layer 0.
- **State restore:** a `try/finally` block restores materials, visibility, render target, clear colour and alpha,
  `autoClear`, tone mapping, background, `overrideMaterial`, camera layer mask and shadow auto-update.
- **Per-frame mode:** a wrapper on `renderer.render` runs the pass after each main layer-0 canvas render. It reads the
  pixels through a pixel-pack buffer (`readRenderTargetPixelsAsync`), so it does not stall the frame. Static states
  use a synchronous read.

## START and BACK paths (step 2)

Runs `runs/path-desktop-pool` (1280×800) and `runs/path-phone` (390×844). Each run waits for the first START
`introend`, clicks START, samples every rendered room frame to the site, clicks BACK TO THE ROOM, and samples to the
second `introend` plus 1 s.

| Run | Segment | Frames | Max gap | Gaps >50 ms | Gaps >50 ms with camera movement | Max camera step | Removed-node pixels |
|---|---|---:|---:|---:|---:|---:|---:|
| desktop | boot | 215 | 75.2 ms | 35 | 31 | 0.279 m | 0 |
| desktop | back | 151 | 133.7 ms | 16 | 3 | 0.449 m | 0 |
| phone | boot | 217 | 92.4 ms | 36 | 34 | 0.253 m | 0 |
| phone | back | 154 | 121.8 ms | 23 | 4 | 0.846 m | 0 |

The pass was applied to every frame that the page rendered. The interval limit of 50 ms was **not** met. The page
itself skips frames in this headless setup. A probe with no ID pass (`runs/probe-desktop`) had a median frame interval
of 30.3 ms and a maximum of 86.7 ms in the first 4 s of boot. The largest moving gaps are in phone BACK at
792 ms and 1,007 ms after the click. The camera moved 0.83 m and 0.85 m there while the room was in view.
`results.json` lists every gap.

**Supplementary pose fill (approximate):** `tools/fill.mjs` replays the recorded path poses. It interpolates so that
consecutive poses differ by ≤1 cm and ≤0.1°, and it runs the pass at each pose. Desktop: 1,600 poses. Phone: 2,050
poses. Removed-node pixels: 0. Limits: the scene is at rest during the fill (console on the nightstand, not the boot or
BACK scene state), and linear interpolation does not follow the eased path exactly. The FOV is constant for a viewport
(`engine.ts:146`, `engine.ts:1454`), so the camera pose alone sets the view.

Earlier attempts are kept as records: `runs/path-desktop` (synchronous read, about 60 ms gaps everywhere) and
`runs/path-desktop-async` (no buffer pool). Both also had 0 removed-node pixels.

## Edge sizes (step 3)

Runs `runs/edge-360x800` and `runs/edge-1280x500`. Each has room centre, four pointer corners, five focuses (lantern,
clock radio, cube, bonsai, portrait) and room after focus. All five focuses opened at both sizes. The per-frame pass
also ran through the focus and back transitions (910 and 909 frames).

| Size | States | Transition frames | Removed-node max | Kept nodes seen (max px) |
|---|---:|---:|---:|---|
| 360×800 | 11 | 910 | 0 | WallRight 150,236, Floor 41,234, Headboard 31,901, Mattress 4,773, BedFrame 3,204, Curtain1 1,883, SheetFold 68 |
| 1280×500 | 11 | 909 | 0 | WallRight 297,364, Headboard 107,416, Pillow1 90,471, Mattress 85,422, Curtain1 83,323, WallFar 65,041, Floor 4,196, Skirting 1,188 |

Source check of turns: cube turns change `rubiks.orbit.quaternion` and `rubiks.root.rotation`
(`engine.ts:1035,1654,1802`). Bonsai turns change `bonsai.turntable.rotation.y` (`engine.ts:1858–1861`). The camera
pose is set only at start-up (`engine.ts:148,789–794`) and in `render()` (`engine.ts:1382–1394`). Turns move the
object, not the camera. No turn or resize matrix was run.

## Phone noise reference (step 4)

New captures with E's capture script (`tools/capture.mjs`, a copy), E's builds, E's seed and storage, and E's click
points:

- `captures/fid-baseline-phone-control`: baseline, the noise reference.
- `captures/fid-candidate-phone-repeat`: candidate. This one was necessary to resolve the bonsai discrepancy below.

Changed pixels (any channel >16), static states:

| State | base vs base-control | base vs cand (E) | base-control vs cand (E) | base-control vs cand-repeat | cand vs cand-repeat |
|---|---:|---:|---:|---:|---:|
| room-center | 1,388 | 775 | 1,425 | 764 | 1,639 |
| focus-lantern | 5,372 | 15,368 | 13,777 | 899 | 13,594 |
| focus-cube | 19,250 | 1,197 | 19,074 | 2,594 | 18,748 |
| focus-bonsai | 5,631 | 45,522 | 45,562 | 44,526 | 9,055 |
| focus-portrait | 4,056 | 2,403 | 2,878 | 1,318 | 2,611 |
| room-returned | 1,624 | 1,451 | 1,533 | 801 | 1,579 |

- **Lantern and cube:** the values move between pairs without a variant pattern. They are run noise.
- **Bonsai:** the two baselines agree, and the two candidates agree. Every baseline-candidate pair differs by about
  45,000 pixels. `tools/shift.mjs` finds the best match at dy = −2 (lantern area, slate area) and dy = −3 (right
  foliage area) in both cross pairs, and at 0 in both same-variant pairs. The candidate image is 2 to 3 pixels higher.
- **Visual inspection** (`sidebyside/phone-focus-bonsai-4runs.png`): the content is the same. The difference image
  shows thin edges on the tree, lantern, pot, slate and table edge. It shows no filled region. The bed and walls are
  not in this view. This is a framing shift, not a missing or added surface.
- **Same-build probe** (`runs/focusprobe-phone-fixture`, baseline model): four bonsai openings in one session. The
  panel top was 618.13 px each time. The settled camera height was 1.5379 on the first opening and 1.5132–1.5149 on
  the next three. The pot moved 3.7 px on screen. The pose at 1.8 s and 4 s was the same.
- **Source check:** the focus framing (`viewOf`, `setFree`) reads only the focused object's parts, the generated tree
  (seed 11), the panel position and the camera FOV. It reads no removed node. No code looks up a removed node by name.

Conclusion: the trim probably does not cause the bonsai shift, because the same build shows a shift of the same size.
But the cause of the systematic baseline-candidate split is not isolated. Two runs per variant is a small sample.

## Step 5

No removed node got an ID pixel. No conservative-hiding check, retained node or revised candidate was necessary.
The candidate GLB is unchanged (`identity-*.json`, `candidateGlb`).

## Addendum: corrections to earlier claims in E and the r1 review

1. "Lost visible pixels: 0" in E means 0 **sampled ID pixels**. It is not proof that the visitor sees the same
   pixels. This check also uses sampled ID pixels.
2. The desktop bonsai outlier in E is "consistent with run-to-run variance". Its cause was not isolated. This check
   also did not isolate the phone bonsai shift.
3. The E timing sessions show **neither a startup benefit nor a regression**. The words "no startup change" mean that
   no change was established. They do not mean that the startup times are equal.
4. "10 fewer warm-up draws" is an estimate from the code (10 fewer warm-up renderer steps). It is not a count of GPU
   draws. "4 fewer texture uploads" is also a code estimate.

## Unresolved limits

- Frame gaps over 50 ms remain (max 133.7 ms). The pose fill covers them only with the scene at rest.
- Not checked: pointer drags, cube and bonsai turns, resizes, sizes other than the four in this check and the four in
  E, DPR above 1, real phones, Safari, and a cut tree with clumps.
- The ID pass skips DOM panels, so the counts are an upper bound on what a visitor sees.
- The phone bonsai framing split between variants is not explained.
- All runs used headless Chrome 154 with ANGLE Vulkan on an AMD RX 590. The frame times in this folder are not
  performance data. The ID pass and the headless setup change them.

## Browser, errors and fallbacks

- T3 `preview_status` and `preview_open` both reported "No preview automation host is available". The check used
  owned headless Chrome over CDP (`tools/cdp.mjs`, a copy of E's helper). The copy never force-kills. It records
  `stillRunning` after `Browser.close`.
- Page errors: 0 in all runs. Run failures: 0. Frame errors: 0. Unresolved async reads: 0.
- The first desktop path run did not meet the gap limit because of synchronous reads. Two changes (async read, buffer
  pool) reduced the pass cost to about 0.5 ms of main-thread time. These runs stay as records.

## Protected state and cleanup

- `identity-before.json` and `identity-after.json` record HEAD, branch, refs, Git index, tracked-file hashes,
  `git status`, ignore files, the accepted source files and manifest hash, shared `node_modules` metadata, dependency
  junction targets, every E file outside `node_modules` and `profiles`, the E profile list and the candidate GLB hash.
  `verification.json` holds the comparison. Git commands used `--no-optional-locks`.
- Every Chrome closed with `Browser.close` (exit code 0, `forced: false`, `stillRunning: false`). Every server stopped
  through its own child handle (SIGTERM). A final process scan found no Chrome or Node process with F in its command
  line, and no listener on ports 4392 or 9932. No process was ended by PID.
- Profiles stay in `profiles/` (about 790 MB). Helpers stay in `tools/`.

## Files

- `results.json`: compact per-run data (per-node maxima, segments, gaps, hidden-mesh variants, diffs, probe).
- `runs/<name>/result.json`, `summary.json`, PNG files: raw data and screenshots.
- `captures/`, `diffs/`, `sidebyside/`: phone control and repeat captures, difference images, panels.
- `tools/`: `idpass.js`, `session.mjs`, `fill.mjs`, `probe.mjs`, `focusprobe.mjs`, `analyze.mjs`, `results.mjs`,
  `shift.mjs`, `panel.mjs`, `identity.mjs`, and copies of E's `server.mjs`, `cdp.mjs`, `capture.mjs`, `diff.mjs`
  and the intro hook.
