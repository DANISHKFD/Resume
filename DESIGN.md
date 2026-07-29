---
name: Danish Ahmed N F — Portfolio
description: "The Desk, After Hours — a real-time 3D desk scene you click around; every object on it opens a different part of the resume."
colors:
  bg: "#0A0C10"
  bg-raised: "#12151C"
  panel-bg: "#14171Fee"
  ink: "#EDEAE0"
  ink-dim: "#8B8F98"
  rail: "#262B35"
  accent: "#D9A441"
  accent-ink: "#0A0C10"
  accent-2: "#6EA8AE"
  thread-amber: "#F2A93B"
  thread-blue: "#3FA7FF"
  thread-violet: "#C05CFF"
  thread-teal: "#33D6A6"
typography:
  hero:
    fontFamily: "'Fraunces', serif"
    fontWeight: 700
    fontSize: "clamp(32px, 6vw, 64px)"
    lineHeight: 1.05
  panel-title:
    fontFamily: "'Fraunces', serif"
    fontWeight: 700
    fontSize: "clamp(30px, 5vw, 52px)"
  panel-subtitle:
    fontFamily: "'Fraunces', serif"
    fontWeight: 600
    fontSize: "22px"
  hero-cyberpunk:
    fontFamily: "'Chakra Petch', sans-serif"
    fontWeight: 700
    fontSize: "clamp(32px, 6vw, 64px)"
    lineHeight: 1.05
  eyebrow:
    fontFamily: "'IBM Plex Mono', monospace"
    fontWeight: 400
    fontSize: "12px"
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  body:
    fontFamily: "'Inter', sans-serif"
    fontWeight: 400
    fontSize: "16px"
    lineHeight: 1.7
  readout:
    fontFamily: "'IBM Plex Mono', monospace"
    fontWeight: 400
    fontSize: "11-13px"
    letterSpacing: "0.03-0.09em"
rounded:
  card: "4px"
  pill: "22px"
  circle: "50%"
components:
  theme-toggle:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "11px 16px"
  panel-close:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "44px"
  card:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: Danish Ahmed N F — Portfolio

## Overview

**Creative North Star: "The Desk, After Hours"**

The homepage is not a page you scroll — it is a desk you sit down at. A single warm desk lamp lights a real-time 3D scene (Three.js), and every object on the desk is a working part of the resume: click the laptop and it opens, lights up, and carries you to Projects; click the notebook and its cover swings open into Education; nudge the coffee mug and its steam rises on the way to Contact. Ten objects, six of them doorways, four of them purely tactile (the lamp, the plant, a rubber duck, a pen that topples if you flick it) — because a desk that only had "buttons shaped like resume sections" on it would just be a nav bar wearing a costume. The clutter is the point: a duck and a trophy and a photo frame are what make it a *desk*, not a *menu*.

The whole scene runs on one light source with a story: the desk lamp itself. Toggle it and the ambient level drops with it — turning the lamp off is not a decorative dim, it changes what the point light in the scene is actually doing. A quiet, cool directional fill from the opposite corner keeps the far side of the desk (the trophy, the photo frame, the little figurine) from disappearing into true black, but it never competes with the lamp for "what's the light source here" — it reads as moonlight through a window, not a second lamp.

This replaced "The Data Line," a transit-schematic direction (skill categories as colored subway lines, projects as interchange stations) that the user found didn't fit. Where the Data Line proved *versatility* through infrastructure metaphor, the Desk proves the same thing through *physical evidence*: a workspace with real tools on it, the way growon.kr's interactive desk scene demonstrated a real person behind a real practice, not a data diagram of one.

**Key Characteristics:**
- One warm point-light source (the desk lamp) drives the entire scene's mood; every other light is subordinate to it — a fill light lifts shadow, it never rivals the lamp as a second highlight.
- Ten physical objects, not ten buttons: each animates in character before it acts (the notebook's cover physically swings open, the trophy glints, the mug's steam rises) — the motion *is* the affordance, discovered by hovering/clicking, not labeled with a tooltip.
- A second full theme — "Cyberpunk" — recolors the same scene and the same seven pages by swapping CSS custom properties and the Three.js light/material colors together, off one `localStorage` flag; the desk doesn't change shape, only its light.
- **The typeface changes with the light.** Fraunces (a warm, slightly bookish serif) is the Desk Lamp display face; flipping to Cyberpunk swaps every heading to Chakra Petch (a hard, geometric tech face) — the theme toggle is not just a recolor, the whole page's *handwriting* changes.
- Destination pages never pretend to be the desk scene continuing — they're a distinct "panel" register (a sliding card over a blurred backdrop-gradient echo of the desk's palette), because re-rendering a full Three.js scene on every content page would cost more than it would earn.

## Colors

Near-black, warm-neutral ground that reads as "a room with one lamp on," not a generic dark-mode gray. Two full theme variants exist, switched at runtime — the frontmatter above records the default ("Desk Lamp"); the second ("Cyberpunk") is documented in full below because both are equally real, shipped, reachable states, not a draft alternate.

### Primary
- **Brass Lamp Light** (`#D9A441` / Cyberpunk: `#FCEE0A` Hazard Yellow): the one accent color per theme — link hover, focus states, the lit desk-lamp glow, the "currently on" states. Used sparingly: headline emphasis span, hover states, and the mono `strong` labels in fact rows.
- **Slate Cyan** (`#6EA8AE` / Cyberpunk: `#1FE5F0` Glitch Cyan): the secondary accent — inline links inside body copy (`a.inline-link`), so a reader can tell "this text is clickable" apart from "this is the theme's hero accent," without introducing a third hue.

### Secondary — the four skill-tag colors (inherited, repurposed)
Education & Skills tags each skill category by one of four colors, a direct carry-over from the site's previous "Data Line" concept (the four skill categories used to be literal subway lines; here they're plain heading colors on four skill cards):
- **Signal Amber** (`#F2A93B` / Cyberpunk: `#FCEE0A`): Programming.
- **Signal Blue** (`#3FA7FF` / Cyberpunk: `#1FE5F0`): Web & Backend.
- **Signal Violet** (`#C05CFF` / Cyberpunk: `#1FE5F0`): Data & ML.
- **Signal Teal** (`#33D6A6` / Cyberpunk: `#FCEE0A`): Databases & Tools.
In Cyberpunk mode these four collapse to the theme's two accents (yellow/cyan) rather than keeping four independent hues — correct, because Cyberpunk's whole point is a two-tone hazard palette; keeping four soft "Data Line" hues alive inside it would fight the theme's own logic.

### Neutral
- **Near-Black Room** (`#0A0C10` bg / `#12151C` bg-raised / Cyberpunk: `#08090A` / `#101008`): page background and any raised surface (cards, the corner-nav dropdown, the theme toggle pill).
- **Warm Parchment Ink** (`#EDEAE0` / Cyberpunk: `#F5F3E7`): primary text — warm off-white, not pure `#FFF`, so it sits comfortably against the warm-black background instead of glaring.
- **Steel Dim** (`#8B8F98` / Cyberpunk: `#B8B49A`): secondary text, dates, tag lists, unfocused nav links. Contrast-checked at 6.0:1 on `bg` (9.5:1 in Cyberpunk) — comfortably above WCAG AA for body text.
- **Rail** (`#262B35` / Cyberpunk: `#33330F`): borders on cards, the nav dropdown, the corner buttons.
- **Reserved, not yet drawn on:** `--accent-ink` (text-on-filled-accent) and `--panel-bg` (a translucent panel surface) are declared in both themes but no current component fills a surface solidly enough to need them — they exist for the next filled-accent button or true glass panel, not dead code to delete.

### Named Rules
**The One Lamp Rule.** Only one light in the 3D scene is allowed to read as "the light source": the desk lamp. A fill light may lift shadow so nothing goes pure-black-unclickable, but it is a directional, low-intensity, room-ambient light — never a second point light competing for "where is this scene lit from."

**The Theme-Is-The-Light Rule.** Desk Lamp and Cyberpunk are not two color swaps layered on one fixed scene — the Three.js point-light color, the ambient color, the desk material color, and every CSS token change together off the same stored flag. A component that only reskins in CSS but ignores the WebGL lighting has not actually implemented the theme.

## Typography

**Display Font:** Fraunces (with `serif` fallback) in Desk Lamp mode; Chakra Petch (with `sans-serif` fallback) in Cyberpunk mode — the display face itself is a theme token, swapped by `--font-display` in `theme.css`, not just its color.
**Body Font:** Inter (with `sans-serif` fallback) — unchanged by theme; body prose stays legible and quiet regardless of which mood the desk is in.
**Mono/Readout Font:** IBM Plex Mono — every non-prose token: the eyebrow labels, nav-menu, tag lists, dates, the "Menu"/theme-toggle chrome.

**Character:** Fraunces is warm, slightly literary, a touch old-fashioned — a nameplate on a wooden desk, not a display face borrowed for drama. Chakra Petch is hard and geometric — the same headline in the same position suddenly reads like a terminal prompt. Inter and IBM Plex Mono are the load-bearing, opinion-free workhorses underneath both moods.

### Hierarchy
- **Hero** (700, `clamp(32px,6vw,64px)`, line-height 1.05): `index.html`'s "Danish Ahmed N F" headline only, one instance.
- **Panel Title** (700, `clamp(30px,5vw,52px)`): each destination page's single `<h1>` (e.g. "Real, deployed, verifiable.").
- **Panel Subtitle** (600, 22px): `<h2>` inside a panel — "Experience", "Skills", "Education".
- **Eyebrow** (400, 12px, letter-spacing 0.08-0.09em, uppercase, mono): the small label above every panel title ("PROJECTS", "CONTACT") and the hero's location line.
- **Body** (400, 16px, line-height 1.7, ~70ch max): all panel prose.
- **Readout** (400, 11-13px, mono): nav links, tags, dates, the theme toggle and menu button labels.

### Named Rules
**The Theme-Bound Type Rule.** The display typeface is not a static brand choice — it is bound to `data-theme` the same way color is. Any new heading-level element must inherit `var(--font-display)` rather than hard-coding a family, or it will silently stay Fraunces after a Cyberpunk switch.

## Layout

`index.html` is a fixed, non-scrolling viewport (`html,body{ overflow:hidden }`): the desk fills the screen, the hero headline and tagline float centered near the top with `pointer-events:none` (so they never block a click meant for the canvas underneath), and a `.scene-hint` sits fixed near the bottom. There is nothing to scroll because there is nothing below the desk — everything else lives one click away on a destination page.

Destination pages are the opposite: a single centered column (`max-width:860px`), generous top padding (96px, tightening to 84px under 720px) to clear the fixed corner-nav and close button, standard document flow and scroll. `.card-grid` runs two columns (three on the Gallery page, set inline) and collapses to one column under 720px.

The corner nav (top-right, `Menu` button + dropdown) and the theme toggle (top-left on `index.html`, bottom-left on mobile) are fixed-position and present, in the same visual language, on every page including the no-WebGL fallback — the one spatial constant across all seven pages, the way the desk-lamp light is the one constant across both themes.

Responsive breakpoint: 720px. Below it, `index.html`'s hero type steps down, the theme toggle relocates to the bottom-left (out of the way of the thumb-height hero text), and the scene's WebGL pixel-ratio cap drops from 2 to 1.5 to protect frame rate on typical phone GPUs.

## Elevation & Depth

Flat, bordered surfaces — no drop shadows anywhere in the 2D chrome. A card, the nav dropdown, and the theme toggle are all distinguished from the background by a 1px `--rail` border and a step up to `--bg-raised`, never a shadow. The one true "depth" in the whole design is the desk scene's own Z-axis: real perspective, real point-light falloff, and real cast shadows from the lamp (`renderer.shadowMap.enabled = true`) doing the elevation work that CSS shadows would otherwise fake.

### Named Rules
**The Real Depth Rule.** Depth is either genuinely three-dimensional (the WebGL scene) or genuinely flat (a 1px border, a background step) — never a CSS shadow standing in for depth that isn't there. A drop-shadow on a 2D card would be decoration pretending to be the desk's real lighting.

## Shapes

Three deliberate radius steps, one per interaction weight, not a sliding scale:
- **Circle** (`border-radius:50%`): icon-only round controls — the corner-nav "Menu" button and every destination page's "back to desk" (×) close button. A circle reads as a single physical button, the way a real desk-lamp switch or a doorbell is round.
- **Pill** (`22px`, effectively full on a ~44px-tall control): the theme toggle — a labeled control (has visible text, not just an icon), so it gets the softer, friendlier pill rather than a hard circle.
- **Card** (`4px`): content containers — `.card`, in the project/gallery/accomplishments grids. Barely rounded, close to square, so cards read as index cards on the desk rather than soft app-UI tiles.

### Named Rules
**The Label Decides The Curve Rule.** An icon-only control is a circle; a labeled control is a pill; a content container is a barely-rounded card. The radius is chosen by what the element *is*, not picked once and reused everywhere.

## Components

### Desk Objects (signature component)
Ten Three.js groups on the desk, each `registerInteractive`-wired to a raycaster hit-test with `onHoverIn`/`onClick` handlers, built in `assets/js/scene.js`:
- **Doorways** (6): laptop → Projects (lid opens, screen glows), notebook → Education (cover swings open), coffee mug → Contact (steam puffs rise), trophy → Accomplishments (gold glints), photo frame → Gallery (tilts), desk figurine → About (a small nod). Each plays its full GSAP animation, then navigates after a short delay (500-650ms) so the click always reads as "this object did something," never an instant blank-white nav.
- **Decorative-only** (4): desk lamp (click toggles on/off, animating light + ambient + emissive together), potted plant (leaves sway), rubber duck (squash-and-bounce), pen (falls off the desk once, permanently — the one object whose interaction has a visible, lasting after-state).
- Every animation has an instant, GSAP-free fallback branch gated on `prefers-reduced-motion`, including the doorway navigation itself (0ms delay instead of the eased approach).

### Theme Toggle
Pill-shaped, mono-labeled ("Cyberpunk mode"), fixed top-left on `index.html` only (destination pages inherit the stored theme but don't carry their own toggle — the lamp lives on the desk, not on every page). Hover shifts border and text to the theme's accent color.

### Corner Nav
A circular "Menu" button, fixed top-right on every page, expanding a `--bg-raised` dropdown of the 6 section links + Resume PDF. Opens on click (`.is-open` class) or on keyboard focus (`#nav-list:focus-within`) — the second path means a Tab-only visitor never needs to activate the button at all; focusing the first link inside it opens the panel automatically.

### Panel Close
A circular `×` button, fixed top-left on every destination page, always returning to `index.html`. Deliberately placed opposite the corner nav (not stacked under it) so the two fixed circular controls never visually collide.

### Cards / Fact Rows
- **Card:** `--bg-raised` fill, 1px `--rail` border, 4px radius, 20px padding — projects, accomplishments, gallery entries.
- **Fact Row:** border-bottom only (no full card), a mono uppercase `--accent` label above a plain value line — About's bio facts, Education's degree list. Lighter-weight than a card for content that's a single fact, not a multi-line description.

### No-WebGL Fallback
A centered, single-column card (`#fallback`) with the same headline copy and the same 7 links as the working corner-nav, styled with the same tokens. Shown instead of the scene — never alongside it — whenever `getContext('webgl')` fails or the Three.js CDN script didn't load. The site's one true "empty state": nobody who can't render the scene loses access to any content.

## Do's and Don'ts

### Do:
- **Do** keep the desk lamp as the scene's only true light source — the One Lamp Rule.
- **Do** update the Three.js light/material colors and the CSS custom properties together on every theme switch — the Theme-Is-The-Light Rule.
- **Do** let the display typeface itself change with the theme, not just its color — the Theme-Bound Type Rule.
- **Do** give every clickable desk object its own in-character animation before it acts; the motion is the affordance.
- **Do** gate every scene animation (and the doorway navigation delay) on `prefers-reduced-motion`.
- **Do** choose radius by what the control is (icon-only → circle, labeled → pill, container → card), not by habit.

### Don't:
- **Don't** add a second light to the 3D scene that competes with the lamp for "where is this scene lit from"; a fill light stays subordinate and directional.
- **Don't** add a CSS drop-shadow anywhere in the 2D chrome — depth is either the real WebGL scene or a flat 1px border, never a faked shadow.
- **Don't** turn a desk object into a plain button; it must animate in its own physical character (open, glint, tilt, bounce) before any navigation happens.
- **Don't** re-render the full Three.js scene on destination pages — the panel backdrop is a deliberate lightweight gradient echo, not a missing feature.
- **Don't** hard-code a display font family on a new heading; inherit `var(--font-display)` so it stays theme-bound.
