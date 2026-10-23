# iPhone Safari sizing: pending device access

Task identifier: /root/iphone_safari_sizing. Sole implementation worker, no delegation.
Checkout: C:\projects\neilskaria.com; branch redesign; HEAD 1aafb1102b0ceecbd179f21afeb9b270e0c246b9.
Date: 2026-10-11.
Preview: https://portfolio-npls6jebl-neil-skarias-projects.vercel.app/lab/boot

## Actual evidence
- Read AGENTS.md and .agents/models.md.
- device_list succeeds: only local Windows host; no devices, remote hosts or open devices. iOS unavailable: "iOS Simulators need macOS with Xcode." Android SDK command-line tools also unsupported.
- preview_status then preview_open both report no connected desktop preview automation host in environment e3105d80-56f1-4c15-a6bc-b91e70b157b5 and say not to retry.
- Browser fallback: in-app browser unavailable; existing Chrome MacBook T3 Settings tab reachable at http://192.168.1.106:3773/settings/integrations.
- MacBook Settings: Device hub and Agent device access enabled. No device hosts. iOS: "Xcode is installed, but no iOS Simulator is available. Install a runtime in Xcode Settings → Components."
- Add host form: "Connect from Neil’s MacBook Pro. Hosts on the same machine are skipped." Name and SSH target required; Identity file and Port optional, resolved separately on each environment. Cancelled without saving.
- Environment scope menu contains only All environments and Neil’s MacBook Pro; this instance does not expose the current Windows environment.
- Automatic approval review refused binding an existing Windows T3 draft tab because it may expose unrelated private contents. Stopped that UI path without workaround. Asked for Windows Settings URL/authorization, MacBook SSH target (username@192.168.1.106), existing identity path/port if needed, and confirmation of an available iOS runtime/device.
- No real Safari, screenshots, verified cause/fix or before/after evidence. No source changes, commit, push, deploy, installs or permission changes. Emoji fix retained. No type/lint/build run because no source change.
- rg unavailable; source inspected with PowerShell Get-Content and Select-String.
- Protected .agents folder creation failed initially, then succeeded with narrow per-command approval.

## Source inspection: unverified hypotheses
src/app.html has width=device-width, initial-scale=1 and text-scale=scale.
src/app.css imports Tailwind; no explicit root font size or text-size-adjust declaration in authored source. Imported/generated CSS must be measured too.
BootIntro.svelte uses rem dimensions, a fixed overlay, and bottom panels on narrow/portrait screens. Panel zoom 1.3 requires min-width 1200px and min-height 700px; mobile rule resets zoom to 1. Actual iPhone viewport needed to confirm matches.
Camera panel framing divides panel bounding box by innerHeight/innerWidth. Measure layout versus visual viewport, Safari page zoom, OS text settings, root font size, text autosizing and used geometry before attributing symptom.
ScreenFrame.svelte uses CRT filter/overlays; no sizing transform found there.

## Two-device capture plan
Run device_list, then device_open on two available substantially different iPhones (prefer SE 375x667 and Pro Max 430x932, or available equivalents). Record exact runtime/device IDs and actual viewport sizes. Use only returned agent-device launcher and all host/session/target flags on every CLI invocation. Read quickStart. Open real Safari, record page zoom/system text settings; capture with device_screenshot. No Chromium emulation substitute.
Establish unchanged deployed baseline. Repeat inventory below for both devices, portrait and landscape where relevant, browser bars visible/collapsed. Name captures with device/revision/state/orientation and record actions/status. Run measure-sizing.js in Safari only if supported DOM tooling exists; no bridge assumed and script not executed yet.
Only after baseline evidence, test reversible CSS hypotheses and apply targeted fix, preserving accessibility/pinch zoom. Establish a reachable local-change preview for MacBook without pushing/deploying; repeat identical Safari inventory. Run existing check/build and targeted lint for source changed. One local commit allowed.

## Screen/state inventory (all pending)
- Fresh loading percentage/corner Sound/SKIP; early skip; ready room/START; mute/unmute; room reload.
- Lantern: named colours, custom colour picker, brightness extrema, RESET/BACK.
- Cube: initial, scramble/busy, scrambled/drag, solve/busy, solved/confetti, BACK.
- Radio: off, tuning, actual playing/offair/blocked states, between-station static, presets, volume extrema, power/mute, BACK. Mark unreachable network states; do not fabricate them.
- Bonsai: initial, watered/shaggy/wild, trimmed/neat/bare, wheel drag, RESET/BACK.
- Portrait close-up and standalone BACK.
- Game Boy/SP entry, moving/boot transition, page landing and return transition.
- Page title/menu/recent/footer, full-page scrolling, footer RadioPlayer states, BACK TO THE ROOM once ready, returning visit/reload.
- Reduced-motion page path and persistence scenarios as separate runs. Record actual observed failure paths.

Existing unrelated untracked artifacts and legacy assets preserved. All native screenshots and verification remain pending.
