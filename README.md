# neilskaria.com

Minimal SvelteKit starter for the site's redesign. It uses Svelte 5, TypeScript,
mdsvex, the official Vercel adapter, and Three.js with Threlte core and extras.

Use Node **24.x**; **24.21.0** is recorded in `.node-version`. npm **11.19.0** was
used for setup. Select Node 24 with a version manager or a portable runtime before
running these commands:

```sh
npm ci
npm run dev
```

The development server normally opens at `http://localhost:5173`.

```sh
npm run check
npm run lint
npm run build
npm run preview
```

`npm run format` formats the starter files; retained policy, assets, and old local
content are excluded. Markdown and Svelte embeds can use `.md` or `.svx`; the
minimal homepage demonstrates mdsvex and is prerendered. Existing assets are
served from `public/`.

For later 3D scenes, import `Canvas` and `T` from `@threlte/core`, and helpers from
`@threlte/extras`. Give each canvas container an explicit size. No scene assets or
design are included in this starter.

The Vercel adapter is configured locally. Publishing requires a separate release.
