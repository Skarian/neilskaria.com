# Room non-bonsai reduction (c2s): Vercel preview + Lighthouse (r1), 2026-10-14

**https://portfolio-1byb9d6mi-neil-skarias-projects.vercel.app/lab/boot**

- **Deployment:** `dpl_Dxn4EkThRtiYLCDP66mfLgdeRysZ` is **READY**. Target: preview. Project `portfolio` (QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw), scope `neil-skarias-projects`. Inspector: https://vercel.com/neil-skarias-projects/portfolio/Dxn4EkThRtiYLCDP66mfLgdeRysZ
- **Candidate:** `c2s-lower-pot01-leaves512`, from N = `room-trim-nonbonsai-reduction-20261013-r1`. Accepted tradeoff: the wall lantern glow is slightly softer, and the result is not pixel-identical. The bonsai data is unchanged.
- **Process:** one deployment from a hosted source build (no `--prebuilt`), using CLI 62.4.0 on Node 24.21.0.
  - Spawned by `tools/deploy.mjs`, a copy of P's.
  - Child-only env: `GIT_CEILING_DIRECTORIES=D`, `GIT_OPTIONAL_LOCKS=0`.
  - Exit code 0. Vercel downloaded 94 files. The build cache was restored from GxPpz3Vf….
  - Known warnings only: the npm runed/kit peer dependency, chunk size, and "deploy subdirectory?". Logs are in `deploy/`.

## Upload stage

- `upload-stage/` holds exactly the 94 files of N's c2s stage manifest: **2,069,303 bytes**. Stage digest (path NUL sha256 lines): `6588f6b5a6f1f60a0b36f4a1e2dcd4f48c9447a56885d652cf17cf7d71085efb`.
- It was built by `tools/stage.mjs`:
  - 85 unchanged files come from P/upload-stage.
  - 7 changed files come from `N/candidates/c2s…/`.
  - wall-day and wall-lamp come from N's c2s stage source. That candidate folder has no wall maps.
  - Every file was checked by bytes and SHA-256.
- Compared with P's actual stage bytes, exactly 9 files differ: `bedroom.glb` (881,512 B, `5110090d…5ed2`) and the 8 bed/room/wall/plant day/lamp WebPs.
- props-day/lamp, `boot-atlas.png` (37,034 B, `e7eb731d…fc6e`) and all code are unchanged.
- There are no .agents/.git/.vercel/node_modules/helper files, and none of the rejected c1/c2/c3/c2r files.
- Checked before the upload (`verification/stage-copy.json`) and again after all the work (`verification/stage-final.json`, exact, same digest).

## Binary assets as served

- Raw `.glb.br` (`verification/raw-brotli.json`):
  - AFTER `bedroom.BIpYg-qk.glb.br`: 200 `br`, **688,868 B, SHA `6fc32912…452a`**, matching the expected value exactly.
  - BEFORE still serves 755,491 B.
- Hosted sessions: the decoded model is 881,512 B with SHA `5110090d…5ed2`. No raw `.glb` was requested.
- All 8 private WebPs match the hashes and bytes in N's manifest. props-day and props-lamp match their unchanged hashes. The atlas PNG is exact.

## Hosted checks

T3 `preview_status` and `preview_open` were both called and both reported **no preview automation host**. The checks therefore used owned headless Chrome over CDP: `tools/session.mjs`, copied from P, with the new GLB hash and an added WebP hash check.

- **Sessions:** desktop 1280×800 (`hosted-desktop/`) and phone **layout emulation** 390×844 (`hosted-phone/`). The phone session is desktop Chrome emulation, not a real device.
- **Result:** both passed. Covered: room, START (on its own introend), site, BACK to the room, lantern open/close, radio open/close, and replay START.
- **Health:** trusted clicks. 0 page errors, 0 rejections, 0 CDP exceptions, 0 local or external failures. No diagnostic globals, controls or bundle markers.

## Lighthouse and room readiness (user request)

Full tables, individual runs and verdicts are in `lighthouse/comparison.md`. Raw data is in `lighthouse/summary.json`. The setup:

- **BEFORE** = the trim preview (d8ciaj66d). **AFTER** = this preview.
- Lighthouse 13.5.0 (pinned and task-local in `lighthouse/tool/`). Chrome 154.0.8037.57. Fresh profile per run.
- Mobile used the default config, desktop used `--preset=desktop`.
- Order B,A,B,A,B,A per preset. Both edges got an equal warm-up first.
- **12 of 12 reports are valid.** Raw `.report.json` and `.report.html` files, plus stdout/stderr, are kept.

**Results:**

- **What Lighthouse measures:** the LCP element in every run is the H1 "NEIL SKARIA" in the blank-storage boot intro, not the room. Every run fetched the changed GLB and all 8 private maps.
- **Total transfer:** −281 KB in both presets.
  - mobile: 1,875,334 → 1,594,183
  - desktop: 1,935,586 → 1,654,354
- **Desktop:**
  - Performance improved, median 89 → 92 (89–90 vs 92–94).
  - LCP improved, median 1908 → 1704 ms, with no overlap.
  - FCP, Speed Index and CLS are unchanged. TBT is inconclusive.
- **Mobile:**
  - Performance median 49 → 57, but the ranges (45–55 vs 55–79) overlap, so this is inconclusive.
  - LCP, Speed Index and TBT are inconclusive because the simulator spread is wide.
  - Main-thread time is lower (5787 → 4621 ms, no overlap).
  - FCP and CLS are unchanged.
- **Room-first readiness:** this was a separate test.
  - State set to `boot-seen=1` and `room-place=room`. Real CDP throttle: 150 ms RTT, 1.6 Mbps, 4× CPU. Mobile 412×823 viewport. 3 B and 3 A runs, alternating.
  - START introend: **12,874 → 11,457 ms median (−1.4 s)**. Ranges: 12,760–13,019 (B) vs 11,286–11,576 (A), so they do not overlap.
  - The 8 private maps finished about 1.8 s earlier. The GLB finished about 0.23 s earlier.
  - Long tasks are unchanged (18 / about 2.7–2.8 s).
- **Conclusion:** the real gain is download time to a usable room on slow connections. There is no CPU gain.

## Preserved, protection, cleanup

- **Approved trim preview:** `dpl_GxPpz3Vf4FrFzC95aXzfosznmna8` is still READY (preview) and unchanged (`verification/inspect-trim-preview.*`).
- **Production:** unchanged. The production list is identical to P's (newest entry 1,763 days old). No domain, settings or Git-connection changes. No source changes, commits or pushes.
- **Protection check:** `identity-before.json` matches `identity-after.json` (`verification/protection.json`, no differing keys). It covers:
  - HEAD, branch, refs, Git index, tracked hashes, git status and ignore files
  - accepted source, shared node_modules metadata and junction targets
  - the N/E/F/P digests (profiles excluded), P's upload stage, and the policies
  - Git reads used `--no-optional-locks`.
- **Browsers:** every owned Chrome closed with `Browser.close`, exit code 0, nothing forced. That covers 2 hosted sessions and 6 room-readiness sessions. Lighthouse's own chrome-launcher opened and closed the 12 audit Chromes.
- **Final scan:** no process had D in its command line apart from the scan shells. Ports 9971/9972/9981–9986 had no listeners (TIME_WAIT only).
- **Profiles kept:** `hosted-*/profile`, `lighthouse/*/profiles/`, `lighthouse/roomready/*/profile`.

## Errors and fallbacks

- The first bash heredoc tool write failed on quoting. The Write tool was used instead.
- `chrome.exe --version` (run once to read the Chrome version) handed off to the user's already-running Chrome ("Opening in existing browser session"). It may have opened a blank tab there. The version was then read from the file metadata. That Chrome was not touched.
- In Lighthouse 13 the LCP element lives in `lcp-breakdown-insight`. The summarizer was corrected for this.
- No T3 preview host was available, so owned Chrome was used for the hosted checks.

## Limits

These are finite samples on one Windows machine. The phone and mobile runs are emulated. Do not compare these numbers with the older Mac reports. Radio was checked by status only.
