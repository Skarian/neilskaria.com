# Preview delivery preflight

Date: 2026-10-12. Implementation sub-agent. Read AGENTS.md and .agents/models.md.
Checkout: C:/projects/neilskaria.com. Branch: redesign.
HEAD: d82230acab7f4e2be780afd0847330a6926573d1. Tracked diff was empty.
No build, upload, deployment, source edit, commit, or ref change occurred.

Observed identity: skarian. Vercel CLI: 62.4.0.
The .cmd launcher uses Node26.8.2. The installed JS entrypoint starts under Node24.21.0.
Read-only project inspect confirmed portfolio in neil-skarias-projects.
Project ID: QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw.
Owner: Neil Skaria's projects. Root: .
Remote settings: Node22.x, Next.js, default build/install commands and output directory.
No .vercel/project.json exists. Only local .vercel/output exists.
Use the explicit project ID and scope. No link or pull is necessary.

Repository configuration: engines.node 24.x, package-lock.json, vercel.json framework sveltekit and buildCommand npm run build.
vite.config.ts contains SvelteKit configuration, adapter-vercel, mdsvex, and assets directory public.
No separate svelte.config file exists. Build runs vite build then scripts/precompress.mjs.
The .npmrc contains only engine-strict. No credential content was printed.
Vercel documentation permits package engines24 to override remote Node22.
vercel.json framework overrides the remote preset. No remote setting change is necessary.
Hosted compatibility remains unverified until the complete build succeeds.

Previous evidence: iphone-safari-sizing/README.md records https://portfolio-npls6jebl-neil-skarias-projects.vercel.app/lab/boot.
Its current deployment status could not be inspected.
lean-stutter-fix/source-status.json and final-clean-build.log confirm local client/server generation.
Adapter function symlinks fail EPERM on Windows. Full build and precompression did not pass.
Prefer hosted Linux source compilation. Do not use --prebuilt or change symlink policies.

No .vercelignore exists. Installed CLI upload rules do not merge .gitignore.
Default rules omit .vercel, Git data, node_modules, Python caches, and local environment files.
They do not omit .agents, .svelte-kit, docs, or assets/legacy/local.
The current tree is not safe to upload unchanged.

Proposed .vercelignore, for Root to assign after review:

```gitignore
/*
!/src/
!/public/
!/scripts/
!/package.json
!/package-lock.json
!/vite.config.ts
!/vercel.json
!/tsconfig.json
!/.node-version
!/.npmrc
```

Keep all files below src, public, and scripts.
This retains all 80 tracked source files, runtime boot assets, Draco files, and the compression script.
Runtime imports use src/lib/boot/assets. The bounded source/script search found no root assets imports.
Exclude root assets authoring inputs and legacy originals, .agents, docs, temporary files, environment files, and local output.
No .vercelignore edit occurred. Validate the proposed rules with a CLI dry run before upload.
Reject private research, artifacts, unrelated originals, and generated output from the manifest.

Run from the project directory. Exact later read-only validation command:

```powershell
& 'C:/Users/Neil Skaria/AppData/Local/node24/node-v24.21.0-win-x64/node.exe' "$env:APPDATA/npm/node_modules/vercel/dist/vc.js" deploy --dry --json --project QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw --scope neil-skarias-projects --target preview
```

Exact later hosted source preview command, only after Root assigns deployment:

```powershell
& 'C:/Users/Neil Skaria/AppData/Local/node24/node-v24.21.0-win-x64/node.exe' "$env:APPDATA/npm/node_modules/vercel/dist/vc.js" deploy --project QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw --scope neil-skarias-projects --target preview --yes --logs
```

Alternative launcher prefix: & "$env:APPDATA/npm/vercel.cmd".
Do not add --prod, --prebuilt, or --temporary. Do not change domains or project settings.
The installed explicit-project resolver does not require a local binding.

Unresolved: independent source review, assigned exclusion edit, successful dry manifest, complete hosted build, and /lab/boot smoke check.
JSON project inspect, prior deployment inspect, and dry validation failed with this CLI error:
The value of "err" is out of range. It must be a negative integer. Received 1.
A narrow per-command Auto-review dry retry returned exit1 without diagnostics.
No refusal was reported. No auth, global configuration, or permission changes occurred.
Do not upload until inclusion validation succeeds.
Safer alternative if the CLI remains blocked: Root can assign an isolated staging directory containing only the explicit source allowlist.
Inspect that directory manifest before deployment. No staging directory was created here.
Production/main release remains unauthorized. No new preview exists from this task.

References:
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/builds/build-features
- Installed Vercel deploy help and upload ignore implementation.
