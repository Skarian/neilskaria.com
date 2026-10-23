# Atlas94 preview (Opus): local gate passed, deployment refused, nothing published

## Result

- **A. Local desktop gate: PASS.** See localgate-result.json.
- **B. Deployment: NOT DONE.** The auto-mode classifier refused the one deploy command (`[Auto-Mode Bypass]`). The task says to stop if refused, so I did not retry. No Vercel command ran. No upload happened.
- **C. Hosted smoke: NOT DONE.** There is no deployment to test.

## A. Local desktop session

- T3 `preview_status` and `preview_open` reported no host. I used the approved fallback: one fresh, owned headless Chrome over CDP.
- Server: server.mjs serves the accepted build at `clean-gpu-atlas-validation-profile-20261013/atlas/` read-only on port 4401. There was no new build.
- Session: session.mjs, desktop 1280x800, one continuous CDP connection, explicit metrics, entry /lab/boot. All 9 screenshots are 1280x800 (checked from the PNG header before any coordinate click).
- Flow: START → site → BACK TO THE ROOM (`#boot-page footer > button`, text checked) → room → lantern (840,230) open/close → radio (470,414) open/close → START → replay site. All 7 clicks were trusted, and each landed on the expected element ID.
- Final START proof: the helper gives each element a unique ID. Before the radio close, it recorded every introend and the START IDs so far (1, 3, 7). After the close click (event 11), START element **10** fired its own introend (event 12). The trusted replay click (event 13) hit element 10. Element 10 is new and appears in no earlier record.
- Radio: playing, ON AIR. Errors 0, rejections 0, CDP exceptions 0, local HTTP failures 0, external failures 0.
- Model: `.glb.br` returned HTTP 200 with `Content-Encoding: br`. Decoded SHA256 is 4d83841d…a4861bf4. No raw `.glb` was requested.
- Atlas PNG: 37,034 bytes, SHA256 e7eb731d…2fafc6e.
- No diagnostic controls, query mode, or forbidden bundle markers were found.
- **Helper fault (kept on record):** local-desktop/result.json says `pass=false`. The only cause was my global-name filter matching Chrome's native `show*Picker` functions. These are browser APIs, not app code (R2 recorded the same). localgate.mjs recomputes the gate from the stored audit. session.mjs now ignores native functions. I made no app change.
- Cleanup: Chrome closed with Browser.close (exit 0, no forced kill). Before stopping server PID 31432, I checked three things: its command line, that it owned port 4401, and that its parent shell ran my owned server.mjs. Then I stopped it. Ports 4401 and 9961 are free. No owned Chrome remains. See local-cleanup.json. Profiles are kept.

## B. Stage and deployment attempt

- upload-stage/ is a fresh copy from `clean-gpu-atlas-source-20261013/source/`: exactly 94 files, 2,585,401 bytes, digest a148564062b30b3fd51326eb023e3bbfa60bc49814323bb198051796092ed40c. It has no extra files, `.vercel`, `.git`, `.agents`, helpers, profiles, dependencies, or build output (stage-manifest.json, stage-manifest-final.json). `.npmrc` holds only `engine-strict=true`, and the baseline has it too.
- CLI check before dispatch: with `--project` and `--scope` set, the CLI does not link a folder. The checkout has no `.vercel/repo.json`, so the CLI would not move its working folder to the checkout root.
- **Metadata risk found:** the stage is inside this Git checkout. Vercel CLI 62.4.0 `createGitMeta` would attach HEAD d82230a (the rejected commit) and branch `redesign` to the deployment. It would also run `git status` against the real index. To prevent this, I set `GIT_CEILING_DIRECTORIES` to this owned folder for that one command only. I tested that `git rev-parse` then fails inside the stage. This is probably what the classifier flagged.
- The refused command was:
  `GIT_CEILING_DIRECTORIES=<this folder> node vc.js deploy <upload-stage> --project QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw --scope neil-skarias-projects --target preview --yes --logs`
  (no `--prebuilt`, so Vercel builds the source on Linux).

## Protected identity

identity-before.json, identity-after-local.json and identity-after-final.json are identical. They cover HEAD, branch, the redesign/main refs, index, tracked bytes, accepted source/manifest/build/public/delivery, R2 files, policies and research. Git reads used `--no-optional-locks`. Nothing was committed, pushed, deployed, or deleted.

## To continue

The user must decide. Options:
1. Allow this one deploy command, with the Git ceiling, then rerun B and C.
2. Allow it without the ceiling and accept that the rejected d82230a commit/dirty metadata appears on the preview.
3. Copy the stage outside the Git checkout. This needs new approval, because the task limits writes to this folder.

## Performance (unchanged, experimental only)

Recorded renderer-main task CPU during boot text: about 39–41% less at CPU1. With flagged CPU4: 49–52% less for first text, 39–42% for replay. Both strict CPU4 observer audits FAIL. Counter meaning, startup neutrality, physical GPU/VRAM, presentation and reliability are unproven. Glyph edges are softer, and the solid return differs by one channel level. Nominal texture storage is 10.67 vs 3.125 MiB. Lantern/radio stalls are a separate task. Safari and missed clicks are deferred. This smoke test makes no performance claim.
