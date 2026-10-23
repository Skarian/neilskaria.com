# Stage 1 landing trial

Worktree: `C:\projects\neilskaria.com-landing`; branch `perf/landing`; base `5a9cf09`. No push or deployment.

Commits: `30864ff` (early SKIP), `a27d1dc` (landing trial), `eb746f4` (prepare the page's filtered layer before SKIP).

Changed: `src/lib/boot/BootIntro.svelte`, `src/lib/boot/assembly-motion.ts`, `src/lib/boot/engine.ts`, `src/routes/lab/boot/+page.svelte`. Engine integration stays small.

## Motion and recordings

Use `/lab/boot?land`, or `?land=2` to include the cube. Without the flag, behavior stays unchanged. The complete room still loads together.

The drop is 7 cm / 420 ms, with a few degrees of tilt leveling out and a 200 ms rotation settle peaking around 1.7?. No bounce height. The existing shadow pales/spreads while raised and returns exactly to its original state. Cube delay: 250 ms. Constants are at the top of `assembly-motion.ts`. START snaps immediately to rest; SKIP and object clicks stop the landing. Reduced motion places objects at rest. The flag removes the existing reveal fade and START pop delay to expose the trial.

**Prototype limitation:** the cube's baked tabletop shadow shows before landing. Reflections still use the complete-room bake. No automatic landing sound.

- [Desktop, Game Boy](desktop-land.mp4)
- [Desktop, both objects](desktop-land-2.mp4)
- [Phone, Game Boy](phone-land.mp4)
- [Phone, both objects](phone-land-2.mp4)

Viewports: 1280?800 / 412?915; phone H.264 has one padding row (412?916). CDP frame timestamps preserve real timing; 60 fps encoding duplicates frames as needed. Clips capture the motion commit; the later prepainting change only affects loading.

## Escape measurements

The server renders SKIP as the same pill with a real page anchor. The head script handles pointer-down, keyboard activation and Escape, saves both existing keys, hides immediately, and hands an escape marker to hydration. Storage failure cannot prevent hiding. The room continues behind the page, and opening it clears the skipped guard.

Conditions: 4? CPU, 150 ms latency, 200,000 bytes/s download, 94,000 bytes/s upload. External scripts were held until escape to isolate pre-hydration behavior, then released.

Desktop DOM results: **2.2?3.6 ms to hide**, **7.5?14.9 ms to the next animation frame**. Tap/repeat/Escape all ran before hydration, saved the keys, produced no room flash, finished background loading and returned through BACK TO THE ROOM. See `early-skip-desktop.json` / `early-skip-phone.json`.

Pixel capture exposed a first-paint cost in the page's CRT filter. The final code paints that page behind the loader. Three alternating samples after a loading frame containing SKIP was actually painted:
- Desktop first captured page: **53.4?63.0 ms**, median **59.8 ms**
- Phone: **50.1?62.6 ms**, median **58.0 ms**

See `early-paint-visible-ssr.json`. Captures include **one or two frames** after input: a strict one-frame guarantee is **not established**. Earlier computed-style-only tests included 328?361 ms phone delays before initial painting was confirmed; retained in `early-paint.json`.

The harness scheduled a 100 ms delay after receiving a painted loading frame. Actual input arrived 218?379 ms after that frame / 1.55?1.80 s after navigation. A literal cold tap 100 ms from navigation is **unverified**; HTML/styles had not painted by then.

## Verification and limits

Against exact `5a9cf09`, default / land / land=2 each have **0 changed pixels and 0 channel difference**, at 1280?800 and 412?915. See `settled-diff.json` and `*-fixed.png`. Comparisons seed dust, fix clock/render time, reset animated grain to the same phase, and use an uncommitted CDP render hook.

Loading/ready SKIP, return, Escape, M sound toggle, mid-drop START, reduced motion during loading and reduced-motion first visit passed; no runtime errors. START restored height from 0.6989 to exactly 0 synchronously. See `actions.json`.

ESLint on all changed files and `svelte-check --threshold error` passed. A local rootDirs override was needed for the shared dependency junction. Build output completed before the expected Windows adapter-vercel EPERM symlink error.

Deployed Lighthouse comparisons, exact owner audit setup, physical-phone testing, literal 100 ms cold navigation input and a consistent single captured frame remain unverified. No loading-speed or score gain is claimed.

Cleanup: task servers stopped; junction removed before cache cleanup; local Vite/TypeScript overrides restored. Worktree and branch remain. Reproduction scripts are included.
