# How the user structures code: lessons from the legacy site

The user says they find their own code structure much more readable than what agents usually produce. This note studies the old site's source to pull out that structure as working defaults for future agents. It is about code organization only. It is not a site audit or a stack history.

**Basis.** Source review only; no old code was run. The snapshot is `archive/live-site-2021` → `0ce5f55b1a91d34d68a24f92d5d6daa90efd349b` (2021-12-15). Its components/pages/utils/styles match `527b202`, the commit before the 2026 reset. Refs written as `path:lines` are at `0ce5f55` and no longer exist in the current checkout; read one with e.g. `git show 0ce5f55:components/layout.js`. `archive/starter-2024` is excluded. Some comments read like sample code (`components/convertKitForm.js:1,8`), so line-by-line authorship is uncertain; the lessons come from the structure, not from individual lines.

## What the structure looks like

**Few files, named after the site's concepts.** The main application code uses three shallow folders: `pages/`, `components/`, `utils/`. Components are named for what they are on the site: Hero, BlogPostCard, ResourceCard, ConvertKitForm, Nav, Footer, Layout.

**Composition you can read top to bottom.** `components/layout.js:1–16` is the entire layout: Nav, a container holding children, Footer. `pages/index.js` reads in a predictable order:

1. Imports (`1–10`).
2. A named `Home` component whose sections appear in the same order as on the page (`12–87`): Hero, recent posts with a heading and a card per post, saved resources with a heading and a card per resource.
3. `export default` (`89`).
4. `getStaticProps` last (`91–159`).

The page's JSX is the outline of the page.

**The route fetches and shapes data; components render props.** `getStaticProps` queries Contentful, formats dates, fetches link previews, and maps raw CMS fields into a small `heroData` object (`pages/index.js:146–153`). `Hero` just destructures `heroData` and renders it (`components/hero.js:5–6`). It hands the signup form off to `ConvertKitForm` (`25`) because the form is a separate concern.

**Sibling components instead of one configurable component.** `BlogPostCard` (67 lines) and `ResourceCard` (57 lines) are separate components with similar styling. One is an internal link with reading time (`components/blogPostCard.js:6–55`). The other is an external link with a hostname (`components/resourceCard.js:5–41`). There is no universal `Card` with variant props. What they really share, image handling, is pulled out into one thin wrapper. `components/image.js:3–19` hides the Cloudinary/NextImage routing behind an ordinary image component.

**Helpers stay next to their only caller.** `getLinkPreviews` and `getLinks` are defined inside `getStaticProps` and read top-down before they are used (`pages/index.js:123–145`). `getHostName` lives inside ResourceCard (`components/resourceCard.js:6–13`). Service access is extracted to `utils/`: `fetchContent` (`utils/contentful.js:5–24`) and `getResources` (`utils/notion.js:7–20`).

**State and styling stay where they are used.** `ConvertKitForm` keeps its endpoint, its two `useState` values, its submit and change handlers, and its markup in one 81-line file (`components/convertKitForm.js:4–33`). There is no store, context, or separate hooks file. Tailwind classes sit directly on the elements they lay out (`components/hero.js:8–23`).

## Teaching sketch

How the legacy home page is divided:

```
pages/index.js           route: fetch → shape → compose sections in page order
  getStaticProps           query CMS, format dates, local preview helpers, return { heroData, blogPosts, resources }
components/hero.js       renders heroData; delegates <ConvertKitForm/>
components/blogPostCard  owns its markup, link, reading time
components/resourceCard  owns its markup, external link, hostname
components/image.js      one shared mechanism: image optimization routing
utils/contentful.js      one function: authenticated CMS query
```

A *hypothetical* over-engineered version of the same page (an illustration of the habits to avoid, not an audit of past agent output):

```
config/homeSections.ts     schema listing section types and props
lib/sectionRegistry.ts     maps type → component
components/SectionRenderer generic loop over config
components/UniversalCard   one card, behavior picked by variant config
hooks/useHeroData.ts, hooks/useSubscribe.ts, stores/subscribe.ts
lib/formatDate.ts, lib/hostname.ts, lib/readingTime.ts   (one function each, one caller, no boundary gained)
```

The user's structure avoids indirection that buys no useful boundary:

- Config schemas, registries, and factories that hide what the page renders. (Centralized settings such as `next-seo.config.js` are fine.)
- Generic renderers and universal components that are mostly configuration.
- Single-function files that only relocate a one-caller helper. (`utils/contentful.js` is one function too, but it isolates CMS access.)
- Hooks or stores for state that belongs to one component.

The opposite failure is a single giant page component, and it should be avoided too. Legacy pages extract Hero and the cards because they are meaningful UI units, while short, one-off section headings stay inline.

## What not to copy

The lessons are about structure, not mechanics. Some details are worth fixing:

- `calcReadingTime` is duplicated across `components/blogPostCard.js:7–19` and `pages/blog/[slug].js:16–28`.
- `getLinkPreviews` is duplicated across `pages/index.js:124–135` and `pages/resources.js:52–63`. Its empty `catch` leads to null-handling that differs between the two pages (`pages/resources.js:29` vs `pages/index.js:66`).
- `fetchContent` ignores HTTP and GraphQL errors.

The takeaway is not "never abstract." Logic that is truly shared belongs in one place, and service boundaries need real validation. React/Next APIs, the filenames, and the visual style don't need to carry over. The current stack is SvelteKit, Svelte 5, and TypeScript.

## How agents should apply this

Working defaults drawn from the user's preference, not hard rules; actual requirements win:

- Keep directories shallow. Name files and components after site concepts.
- Write route and page code so the markup reads as the page outline: sections visible and in order, composition explicit.
- Follow SvelteKit's boundaries: fetch and shape data in a load function (`+page.server.ts` when fetching must stay server-side), compose in `+page.svelte`, and pass components simple, typed props. Don't port `getStaticProps` patterns into browser code.
- Extract a component only when it is a meaningful UI unit, is actually reused, or contains real complexity. Keep short one-off markup inline.
- Prefer sibling domain components over one configuration-heavy generic component. Share the mechanism (images, data access), not the whole component. Building `BlogPostCard` and `ResourceCard` from the chosen library's Button/Card primitives fits this.
- Default to keeping a helper next to its caller. Move it to shared code when there is real reuse or a clear boundary, testability, or complexity benefit.
- Keep state local and styling next to markup. Add stores, adapters, or factories only for a concrete need.
- Put error handling and validation at service boundaries, where the old code was weakest.

*Provenance:* parent agent reviewed history and source with `git show`/`git log`. The original writer re-read every cited range at `0ce5f55` on 2026-10-06; the `resourceCard.js:5–41` range was corrected from the parent's review.
