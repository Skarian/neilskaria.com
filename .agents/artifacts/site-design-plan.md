# neilskaria.com design plan

Working design plan from the design discussion with Claude (Opus 5.5), 7 Oct 2026.
**Confirmed** means the user agreed to it. **Proposed** means Claude suggested it and the user hasn't confirmed it yet.

## Vision

A normal, fast, server-rendered personal site. You enter it through a nostalgic moment: the user's childhood red GBA SP floats up off a bedside table, boots up with their name, and the camera dives into its screen. From then on you're inside a site that looks like a game but reads like a book.

## Guardrails (confirmed)

- **Functional first.** Anyone sent a link can find the blog and the posts. Nobody has to play anything.
- **Pages:** Home, About, Projects, Bookmarks, Blog (index and posts), and social links in the footer.
- **Server-rendered.** The home page is real HTML underneath the intro.
- **Quirky but professional.** The 3D is a front door, not the interface.
- **Not over-engineered.** Aim for impressive (Awwwards-calibre) with a small amount of code.

## Influences

The user named these as influences. They aren't requirements:

- Game Boy / GBA / DS handhelds
- E-ink
- Wii and DS home menus (light, whimsical)
- Pixar 3D
- Japanese design
- Pastel colours, specifically Catppuccin
- 3D motion design and Three.js
- The structure of 109ichiki.com: windows, thin borders, small labels

Rejected or parked:

- The dual-monitor idea from henryheffernan.com
- Desktop-style window interfaces
- 3D scenes you have to navigate

## The intro: the GBA SP boot (confirmed unless marked)

### Preloading and Start (confirmed)

- Everything loads before the animation can start, so it never lags.
- The visitor clicks a Start button on an overlay, not on the 3D scene itself.
- The click also lets the browser play sound.
- **Proposed:**
  - A dim night-time bedroom with the closed red SP on the bedside table next to the bed.
  - The overlay shows the wordmark, a pixel progress bar, then "▶ PRESS START". Enter and Space also work.
  - Shaders and the scene are prepared in advance so the first frames don't stutter.

### Sequence

The timings are proposed. Total is about 5.5 seconds.

| Time | What happens |
| --- | --- |
| 0.0s | The visitor presses Start and the bedside lamp clicks on. The SP lies closed and flat on the table with the cartridge inserted. |
| 0.3–1.6s | The SP bounces up and spins 360° as it rises, opening as it turns. As it opens, the cartridge **pops out** of the back slot and floats below the console. |
| 1.6–2.4s | The spin eases to a stop with the console upright, screen facing the camera. The console and cartridge bob gently, slightly out of sync. |
| 2.4–2.8s | The cartridge rises and **slots back in with a click**. |
| 2.8s | The power LED and screen light up, and the boot animation plays with the **original GBA boot sound**. |
| 2.8–4.9s | The camera slowly pushes in and the bobbing settles. The boot animation ends just *before* the camera is fully zoomed in. |
| 4.9–5.5s | The screen fills the browser, and the real home page takes over with no visible seam. |

### Boot screen (confirmed)

- It's an almost exact replica of the original GBA boot: the same layout, sweep, letter-by-letter reveal, pacing and colours.
- The wordmark reads **NEIL SKARIA**.
- **neilskaria.com** (or "© 2026 Neil Skaria") replaces the Nintendo line underneath.
- No Nintendo name or logos appear anywhere, including on the console model.
- **Proposed:** draw the lettering ourselves in the same spirit, rather than tracing Nintendo's logo.
- **Sound:** must be the original GBA boot sound, or a recreation indistinguishable from it. The user knows the copyright risk and accepts it. Keep it in one swappable audio file, and check where any file came from before using it.

### Visitor rules (proposed)

- **Full intro:** only on the first visit to the home page.
- **Return visits:** "Continue" plays a dive of about 1.5 seconds.
- **Links to other pages** (for example, a blog post) never show the intro.
- **Skip:** a skip button is always available.
- **Reduced motion:** the intro is skipped for anyone with reduced motion turned on.

## Inside the site (confirmed: "middle" GBA)

The frame looks like a game, and the reading feels like a book.

- **Palette (confirmed direction):**
  - Light mode: a front-lit GBA screen look, with white menu boxes, cream paper and pastel accents.
  - Dark mode: the backlit look.
  - Tones are drawn from Catppuccin (Latte and Mocha), shifted towards GBA colours.
- **Home (confirmed direction):**
  - A short start menu at the top (About, Projects, Bookmarks, Blog) with a ▶ cursor.
  - Below it, a contents-page-style list of recent posts and projects.
- **Page changes (confirmed direction):**
  - A quick screen wipe of about 0.25s.
  - None for anyone with reduced motion turned on.
- **Game-like touches (proposed):**
  - Page headers in game-style dialogue boxes
  - Start-menu navigation
  - Dates in LCD-style digits
  - A pixel font for labels and small interface text only
- **Reading (proposed):** body text uses a proper reading font, with a calm, e-ink-like layout and Japanese editorial spacing and labels.
- **Other ideas from the research (proposed, optional):**
  - Images that turn dithered on hover
  - Halftone reveals on project and bookmark cards

### Per page (proposed)

- **About:** a photo dithered to match the palette, and a short bio.
- **Projects:** cards with dithered thumbnails that turn to full colour on hover.
- **Bookmarks:** a dense list, like a catalogue.
- **Blog:** the most e-ink-like part of the site, built for focused reading.

## 3D production (agreed approach)

- Claude builds the SP and the bedroom corner in Blender with Python scripts.
- Proportions are checked against reference photos and real dimensions (closed, about 85 × 82 × 24 mm) by rendering from matching angles. An existing licensed model can also serve as a reference.
- If the hand-built version lacks charm, use an existing licensed model as the fallback.
- Bake the lighting into the textures so the browser has little work to do.
- Split the model into separate parts: lid hinge, cartridge, and screen surface.
- Export a compressed glTF.
- The user installs Blender when this phase starts.

## Open questions

- The look of the bedroom (time of day, how much of the room is shown, style)
- The exact palette values and fonts. The font on cyze.dev that the user liked hasn't been identified yet.
- The contents of each page
- Social links

## Prototype status (8 Oct 2026)

Working prototype at `/lab/boot`. Nothing is committed yet.

**Visitor flows (confirmed and built)**
- **First visit:** a still poster of the room shows at once. The 3D engine loads separately, then START appears (a single Game Boy–style pill). The intro plays and hands off to the page, and the 3D shuts down and frees the GPU.
- **Return visits:** straight to the HTML. Nothing 3D downloads up front; it's prefetched into the browser cache once the page is idle. **↺ Replay intro** in the footer plays the full intro, ready about 0.65 s after clicking.
- **Reduced motion:** no intro and no 3D download.
- **Sound:** a corner toggle plus the M key, remembered between visits.
- **Skip:** a Skip button plus Esc.

**Scene**
- Daylight bake: sun through the window and soft sky light, with lightmaps and the console lit from a capture of the room.
- Flame red SP modelled from reference photos.
- Table: Casio F-91W showing the visitor's live time (no CASIO wordmark), Rubik's cube, the JOSEPH tumbler (modelled from the user's photo, with no Stanley branding), and a juniper bonsai (twisted deadwood trunk, cloud pads, about 40k needles).
- Boot screen replicated frame by frame from a native GBA capture, with the original chime.
- CRT finish over the whole sequence and the page.

**Sizes**
- Intro assets total about 5.8 MB, plus the Three.js bundle.
- Posters: 66 KB landscape, 23 KB portrait.

**Build**
- `assets/3d/build_scene.py` with `gba_sp.py`, `props.py` and `helpers.py`, run in Blender 3.1. The CPU bake takes about 15 minutes.
- Previews: `sp_preview.py` and `props_preview.py`.
- Assets live in `src/lib/boot/assets/`, with content-hashed names and immutable caching.

## First batch of work (proposed)

1. **Look and site shell.**
   - Colour and font settings for light and dark mode.
   - The layout frame, start-menu nav, footer and page-change wipe.
   - One real blog post page and the blog index in the middle-GBA style.
   - This proves the inside of the site reads well, and gives a working site that can be shared before the intro exists.
2. **SP model and boot screen**, in parallel with step 1.
   - Reference photos and dimensions.
   - A first Blender model of the SP with the hinge, cartridge and screen as separate parts.
   - The boot screen as a standalone 2D animation, which also becomes the texture on the SP's screen.
   - Sourcing the boot sound.
3. **Next batch:** the bedroom scene, the full intro sequence, handing off to the home page, and the visitor rules.
