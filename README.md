# neilskaria.com

SvelteKit foundation for the site's redesign. It uses Svelte 5, TypeScript,
mdsvex, Tailwind CSS 4, shadcn-svelte with Bits UI, GSAP, the official Vercel
adapter, and Three.js with Threlte core and extras.

Use Node **24.x**; **24.21.0** is recorded in `.node-version`. npm **11.19.0** was
used for setup. Select Node 24 with a version manager or a portable runtime before
running these commands:

```sh
npm ci
npm run dev
```

The development server normally opens at `http://localhost:5173`.

To preview on another device connected to the same local network:

```sh
npm run dev:lan
```

Open the **Network** URL Vite prints for your Ethernet or Wi-Fi connection.
This command listens on all network interfaces at port **5174** and fails if that
port is already in use, so the port doesn't silently change. The IP address may
change when you switch networks.
Keep the command running while previewing; press **Ctrl+C** to stop it.

```sh
npm run check
npm run lint
npm run build
npm run preview
```

`npm run format` formats the starter files; retained policy, assets, and old local
content are excluded. The homepage is a prerendered Svelte page at
`src/routes/+page.svelte`. mdsvex is configured for future `.md` and `.svx` content.

`src/` contains the app. `public/` contains files served directly by the site,
currently just the favicon. `assets/legacy/` preserves the old images and resume
in Git, outside the served directory. Its ignored `local/` folder preserves old
banner/blog assets, Markdown, playground code, and research files only in this
checkout. These archived files are not used by the starter or web served.

For later 3D scenes, import `Canvas` and `T` from `@threlte/core`, and helpers from
`@threlte/extras`. Give each canvas container an explicit size. No scene assets or
design are included in this starter.

The Vercel adapter is configured locally. Publishing requires a separate release.

## Components and themes

The initial shadcn-svelte setup uses the neutral **Vega** preset, Lucide icons,
and locally served Inter Variable. These are editable defaults for the upcoming
design. `src/app.css` contains the Tailwind imports and shared theme tokens;
`.dark` on the document root selects the dark tokens. A persistent site theme
switcher can be added when the site design is defined.

Button, Badge, Card, Dialog, and Sheet live in `src/lib/components/ui/`. These are
owned source files: edit them when variants or behavior need to change. Compose
these controls first, and use `bits-ui` directly for custom interactive controls
that need keyboard and focus behavior.

Add more components with the locally installed, lockfile-managed CLI:

```sh
npm run ui:add -- separator
```

This command runs `svelte-kit sync` before the generator. npm installs can remove
Kit 3's generated `$app/tsconfig` files; syncing restores them without changing
the project's TypeScript configuration. Review generated files before accepting
updates to customized components.

`components.json` uses the repo's `#lib` package imports. Include file extensions
and index files in imports, for example:

```svelte
<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
</script>
```

## Motion

Use Svelte transitions for small interactions, GSAP for coordinated DOM motion,
and Threlte for 3D scene components. Add animation code where a feature needs it;
initialize browser-only animation after mounting, respect `prefers-reduced-motion`,
and clean up animations on unmount. Shared controls disable decorative CSS
animation and transitions under reduced motion.

## Project-local shadcn-svelte skill

Install the official agent skill from the repo root after a fresh clone:

```sh
npx skills add huntabyte/shadcn-svelte --skill shadcn-svelte --agent codex
```

On Windows PowerShell, use `npx.cmd` if script execution policy blocks `npx`.
The skill lives in `.agents/skills/shadcn-svelte/`, which is Gitignored and excluded
from formatting. `skills-lock.json` records the source and installed content hash;
it belongs in Git. Skill files are separate from npm dependencies and are not
restored by `npm ci`. Newly installed skills become available on the next agent
turn. The skill reads `components.json` for project-specific aliases and settings.
