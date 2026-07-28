# 3D Desk-Scene Resume Redesign

<!-- superpowers:brainstorming spec -->

## Context

The current site (`index.html`, branch `updates`) is "The Data Line" — a transit-map-themed
single-page resume, built via the `impeccable` skill (see `DESIGN.md`, `PRODUCT.md`,
`.impeccable/design.json` on that branch). It's a scroll-to-read design: a recruiter scans
sections in order.

This redesign replaces that thesis entirely, inspired by growon.kr (a Korean design agency's
site built around one interactive 3D desk scene — click an object, it opens a full page). The
new site is click-to-explore rather than scroll-to-read: a 3D desk scene *is* the navigation.

All resume content (About, Experience, Projects ×7, Skills, Education, Contact) is unchanged in
substance — see `PRODUCT.md` on the `updates` branch for the full verified content inventory
(names, dates, links, reconciled figures). This spec only changes presentation, not facts.

## Goals

- Replicate growon.kr's *mechanism* (click a 3D object → real page slides in over a blurred,
  still-visible scene) and *craft level*, not its literal desk or palette.
- Every one of the 6 current resume sections must be reachable, with no content lost or
  watered down versus the current site.
- Stay within the current hosting model: static files on GitHub Pages, no build step, no
  backend, custom domain (`danishkfd.in` via `CNAME`) unchanged.
- Ship something the user can genuinely evaluate and keep or reject the optional Cyberpunk
  theme independently of everything else.

## Non-goals

- Not attempting photoreal asset fidelity matching growon.kr exactly (see Fidelity Approach).
- Not rewriting resume content/copy tone — text is ported as-is into new containers.
- Not adding a backend, CMS, or build pipeline.
- Not preserving the Data Line design as a fallback/alternate route — this is a full replace.

## Concept & Visual Direction

**"The Analyst's Desk, After Hours."** A single warm brass desk-lamp is the only light source in
an otherwise near-black graphite room — half ledger-book, half laptop terminal. This is chosen
deliberately over a generic dev-portfolio blue/purple gradient (the AI-slop trap): it ties the
scene to what actually differentiates this candidate — real banking and government data work
(RBI banking statistics, Election Commission affidavit filings) — through paper/brass/graphite
materials rather than glossy sci-fi UI chrome.

The current site's four skill-line accent colors (amber `#F2A93B`, blue `#3FA7FF`, violet
`#C05CFF`, teal `#33D6A6`) carry over as *material accents* — a stitched thread color, a worn
sticker, a status LED — not as literal UI chips. No literal reuse of growon's blue-twilight
palette.

An **optional Cyberpunk 2077 theme**, toggleable at runtime, is scoped as a fully additive,
independently removable layer (details below). Default on load is always "Desk Lamp" mode.

## Scene Objects

| Object | Interaction | Destination | Content |
|---|---|---|---|
| Laptop | Screen lifts open, backlight comes on | `projects.html` | 7 projects |
| Notebook/ledger | Falls open | `education.html` | Education + Skills |
| Coffee mug | Steam puff / ripple | `contact.html` | Contact info |
| Trophy | Catches lamp light, glints | `accomplishments.html` | Certifications |
| Picture frame | Tilts toward viewer | `gallery.html` | Extracurriculars (clubs) |
| Desk figurine (stickman/bobblehead) | Wobble/nod | `about.html` | About + Experience |
| Desk lamp | Toggles the scene's only light on/off | — decorative | matches growon's light-toggle |
| Rubber duck | Squeak-bounce | — decorative | dev-humor nod |
| Pen | Falls off the desk edge (physics-style) | — decorative | direct port of growon's pencil |
| Plant (small desk succulent) | Leaf sway | — decorative | — |

6 doorways + 4 decorative objects, comparable density to growon's scene (3 doorways + 4
decorative in the reference).

## Fidelity Approach (hybrid)

Most objects (mug, notebook, trophy, lamp, plant, duck, pen) are built from primitive Three.js
geometry (boxes, cylinders, lathes, extrusions) with careful PBR materials, lighting, and
shadows — fast, zero licensing risk, still genuinely 3D and interactive. For 1–2 hero pieces —
laptop is the primary candidate, picture frame secondary — a clean CC0/free-license model will
be used *if* one is found that fits the aesthetic; otherwise it falls back to custom geometry
too rather than forcing in a mismatched asset. No paid or unlicensed assets under any
circumstance.

## Architecture

```
Resume/
  index.html              3D desk scene (landing page)
  about.html               panel page: About + Experience
  education.html           panel page: Education + Skills
  projects.html             panel page: 7 projects
  accomplishments.html     panel page: Certifications
  gallery.html              panel page: Extracurriculars
  contact.html               panel page: Contact + resume PDF link
  assets/
    js/scene.js             Three.js scene setup, object interactions, theme toggle
    js/panel.js              shared panel-page behavior (close button, blurred-desk backdrop)
    css/panel.css            shared panel-page chrome/typography
    css/theme.css             CSS custom properties for Desk Lamp + Cyberpunk themes
    models/                  any sourced CC0 model files, if used, + LICENSE notes
  Danish ahmed N F Resume.pdf   UNCHANGED — never modified
  CNAME                    UNCHANGED
  DESIGN.md, PRODUCT.md, .impeccable/   rewritten post-build to document this design
```

Each panel page is a **real, separate HTML file** (own URL, shareable, works with browser
back/forward), styled as a panel sliding in over the blurred desk scene — matching growon's
actual routing model, not a single-page overlay.

Three.js and any other libraries load via CDN (as the current site already does for GSAP),
preserving the no-build-step constraint.

## Interaction & Accessibility Fallback

growon.kr provides a "…" menu with real anchor links as an accessible/keyboard-operable parallel
path to the 3D objects. This site replicates that: a persistent corner menu lists About /
Education / Projects / Accomplishments / Gallery / Contact as real `<a href>` links, always
present, keyboard-focusable, screen-reader visible — independent of whether the 3D canvas loads
or WebGL is supported at all.

**No-WebGL / load-failure fallback:** if WebGL is unavailable or Three.js fails to load, the
page shows a plain centered card (name, one-line summary, the same corner nav links, resume PDF
link) instead of a blank or broken canvas. A recruiter on a locked-down corporate machine must
always be able to reach every section and the PDF.

`prefers-reduced-motion` is respected throughout (matching the current site's existing
commitment): pencil-fall physics, plant sway, lamp-toggle transition, chair/duck bounce, and the
Cyberpunk glitch-flicker all collapse to instant/no-op states when set.

Objects are click/tap-primary (mouse and touch); full site navigation remains 100%
keyboard-operable via the corner menu, matching growon's own approach rather than requiring
keyboard-driven 3D raycasting.

## Mobile / Performance

- Canvas render resolution capped by `devicePixelRatio` on mobile to protect frame rate.
- Touch tap is equivalent to click for all object interactions.
- Below a width breakpoint, the desk scene is presented smaller and the corner nav menu takes
  visual priority, so mobile visitors aren't forced into fiddly small-target 3D taps to reach
  content — the menu is always the fast path.

## Cyberpunk Theme Toggle (optional, additive)

Reference: `d:\cyberpunk.webp` (Cyberpunk 2077 branding — near-black base, hazard yellow
`~#FCEE0A`, cyan accent `~#1FE5F0`, jagged glitch-text treatment on the logo).

- A small toggle button (corner of the scene, alongside the nav menu) switches `data-theme`
  between `desk-lamp` (default) and `cyberpunk`.
- Cyberpunk mode: background → near-black, lamp light color → cyan, key surface accents →
  hazard yellow, headline gets a brief glitch/chromatic-aberration flicker on toggle, material
  highlights go neon instead of matte brass.
- Implemented as an isolated layer: CSS custom-property swap (`theme.css`) + one small Three.js
  material/light re-color function. No other file or feature depends on it existing.
- **Explicitly built to be cleanly removable**: deleting the toggle button markup and its
  associated CSS/JS block fully removes the feature with no knock-on changes, since the user is
  undecided on keeping it.
- Defaults to `desk-lamp` on every fresh load regardless of environment — Cyberpunk is always
  opt-in, never the first impression.

## Content Migration

All text content currently in `index.html` (About paragraph + facts, Experience entry, all 7
project descriptions with tags/links, 4 skill-line legends, education entries, certifications,
extracurriculars, contact links) is carried over verbatim into the corresponding new panel page.
No claims, figures, or links are altered. `PRODUCT.md`'s content-accuracy commitments (verified
figures, no boastful language, breadth framed honestly) continue to apply to the new pages.

## Rollout

- All work happens on branch `3d-desk-redesign` (created off `updates`, which already has the
  Data Line design safely committed at `d0a7f94`). The currently-deployed site at
  `danishkfd.in` is untouched until this branch is merged.
- `DESIGN.md`, `PRODUCT.md`, and `.impeccable/design.json` are rewritten at the end of the build
  (via the `impeccable` skill) to document the new design, superseding the Data Line docs on
  this branch.
- Resume PDF (`Danish ahmed N F Resume.pdf`) and `CNAME` are never modified.

## Testing Plan

- Visual/functional check of every object's interaction and every panel page, via browser
  automation (`claude-in-chrome`), matching the verification approach already used to explore
  growon.kr in this conversation.
- Responsive check at a mobile width and a desktop width.
- `prefers-reduced-motion` check: verify animations collapse correctly.
- No-WebGL fallback check (simulate by disabling WebGL / forcing failure) confirms the plain
  fallback card renders with working nav + PDF link.
- Keyboard-only pass: Tab through the corner nav menu, confirm every section and the resume PDF
  is reachable without touching the canvas.
- Cyberpunk toggle: confirm it defaults off, toggles cleanly, and that removing its block (dry
  check, not actually removed) would leave no orphaned references.
