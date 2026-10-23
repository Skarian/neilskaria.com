# Independent replacement review

HEAD d82230acab7f4e2be780afd0847330a6926573d1, branch redesign.
Reviewed 53718d63778e9bc84a348eb1d054ffe26d442afb and d82230a against a796e9a.
The failed prior round supplied no review findings or approval.

Decision: READY FOR A PREVIEW. No blocking source defect found.
This decision does not approve production release or certify uniformly smoother motion.

Defect: lean-stutter-fix/README.md does not exist. The implementation handoff links that missing file.
Opening the link fails to provide the evidence summary. report.mjs is a generator, not an existing README.
Smallest correction: link report.html, or save the generated README at the promised path.
Check that the target exists. Preserve the negative measurements and packaging limitation.
This documentation defect does not block a code preview.

Source: engine.ts:856 prepares glyphs after font readiness. Preparation yields between glyphs.
The maximum arrival scale is 4.83. Masks use scale 5 and hinting padding.
Advances, slots, italic overhang, colours, alpha, glint, and fade retain their original formulas.
All ten measured surfaces have zero border ink. Disposal clears their dimensions at engine.ts:2297.
Memory is 7,438,536 declared RGBA bytes. Additional browser/GPU storage is unmeasured.
App preparation takes 10.2 ms normal and 51.9 ms at 4x, including yields.
Glyph preparation adds awaited startup work. It does not establish a zero-cost startup claim.

BootIntro.svelte:70 prepares panels without awaiting them in room readiness.
BootIntro.svelte:314 retains early-selection mounting through the same markup and action.
Inactive panels use visibility, inert, and aria-hidden. Preparation does not call audio or persistence handlers.
BootIntro.svelte:117 preserves 350 ms delay, 520 ms entry, and 220 ms exit.
Interrupted progress, cancellation, child replay, and stale completion guards are present.
The resize effect rejects stale tick callbacks. Hidden child animations are disabled.
Engine.ts:1247 guards duplicate fits with effective fractions, projection, and viewport dimensions.
Each focus computes a fresh view. Resize invalidates the guard.
Lifted cube bounds and deliberately neat bonsai bounds remain.
Camera correction 042dc805 and emoji correction 1aafb11 remain ancestors of HEAD.
Early SKIP, site-to-room, and gesture-based radio activation retain their existing logic.

Optional cleanup: boot-screen.ts retains an unused direct-text rendering branch when prepared data is absent.
The shipping engine uses prepared rendering exclusively. No other application caller uses the direct branch.
Remove that branch later if desired. Keep the diagnostic baseline in the evidence folder.
This cleanup is not required for a preview. No broad architecture is needed.

Evidence: I read the committed diff, surrounding source, three attribution reports, and implementation evidence.
I checked capture, analysis, appearance, behavior, extra-check, and final-reselection scripts.
I inspected direct-contact.png and room-contact.png with view_image.
I inspected baseline/candidate steady lantern and radio images with view_image.
Text placement and card layout remain consistent. Text edge antialiasing differs.
Radio screenshots show different live status phases. They are not pixel-identical comparisons.
The seven image samples end at 3.5 seconds. Later fade correctness rests on unchanged source logic.

I independently recalculated the final raw 4x capture gaps with the analysis interval rules.
Glyph p95 baseline endpoints are 20.5/21.2 ms. Candidate p95 is 17.8 ms.
Glyph maxima are 24.0/34.1 ms baseline and 18.2 ms candidate.
Lantern first maxima are 206.6/200.9 ms baseline and 115.3 ms candidate.
Radio first maxima are 227.9/216.8 ms baseline and 159.3 ms candidate.
Lantern first p95 worsens from 18.3 to 23.0 ms.
Radio first p95 worsens from baseline median 28.05 to 43.5 ms.
Radio readiness increases 469.75 ms against baseline median. Its loading-task maximum changes 162.5 to 164.0 ms.
These data support smaller first stalls. They do not support uniform improvement.
The final panel candidate has one sample per CPU/object condition. Host load, network, and driver caches limit attribution.
These are submission callbacks, not physical display presentation. Outline omission gains are diagnostic only.
The bounded memory and local changes meet the lean goal sufficiently for a preview comparison.
Physical-device, Safari, and audible-output behavior remain unverified.

Both behavior JSON files contain 51 passing checks. The final rapid JSON contains 16 reselections without camera retreat.
The assertions cover hidden focus, accessibility, keyboard input, gesture audio, persistence, resize, fallback, and return behavior.
The reduced-motion startup check skips room creation. Dynamic reduced-motion assertions cover child CSS animations only.
The fallback uses a diagnostic preparation bypass. It is not a shipping setting.
All five source hashes match source-status.json. Tracked source remains clean.
Existing format, source lint, and type logs report success. I reran the committed whitespace check successfully.
The final build log confirms client/server compilation and Vercel symlink EPERM.
Full packaging and precompression did not pass. Deployment preparation must address packaging separately.
T3 preview status and open reported explicit unavailability. No new profiling campaign was needed.
I made no source edit, commit, push, build, upload, or deployment. I started no server or browser.
