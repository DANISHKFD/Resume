---
name: Danish Ahmed N F — Portfolio
description: "The Data Line — a transit/circuit schematic portfolio where skill domains are colored lines and projects are interchange stations."
colors:
  bg: "#0B0E14"
  bg-raised: "#10141C"
  ink: "#E7ECF3"
  ink-dim: "#7C8798"
  spine: "#232B3A"
  line-programming: "#F2A93B"
  line-web: "#3FA7FF"
  line-data: "#C05CFF"
  line-tools: "#33D6A6"
typography:
  hero:
    fontFamily: "'Overpass', sans-serif"
    fontWeight: 800
    fontSize: "clamp(40px, 7vw, 92px)"
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  section-title:
    fontFamily: "'Overpass', sans-serif"
    fontWeight: 700
    fontSize: "clamp(26px, 3.2vw, 40px)"
    letterSpacing: "-0.005em"
  station-title:
    fontFamily: "'Overpass', sans-serif"
    fontWeight: 700
    fontSize: "clamp(19px, 2vw, 24px)"
  body:
    fontFamily: "'Overpass', sans-serif"
    fontWeight: 400
    fontSize: "15px"
    lineHeight: 1.7
  readout:
    fontFamily: "'Overpass Mono', monospace"
    fontWeight: 400
    fontSize: "11.5-13px"
    letterSpacing: "0.06-0.1em"
rounded:
  none: "0px"
  station: "50%"
spacing:
  spine-gutter: "clamp(64px,9vw,104px)"
  page-pad-x: "clamp(24px,5vw,64px)"
  page-pad-y: "112px"
components:
  station-node:
    background: "{colors.bg}"
    border: "2px solid {colors.spine}"
    rounded: "{rounded.station}"
  station-node-active:
    border: "2px solid {colors.line-web}"
  interchange-ring:
    background: "conic-gradient(from 0deg, var(--seg-colors))"
    rounded: "{rounded.station}"
---

# Design System: Danish Ahmed N F — Portfolio

## Overview

**Creative North Star: "The Data Line"**

The site is staged as a transit/circuit schematic: a signal-lit spine runs the length of the page, and every section is a station on it. Each of the four real skill categories (Programming, Web & Backend, Data & ML, Databases & Tools) is a named, colored line; projects are **interchange stations** — their station ring is a conic-gradient wedge of every line whose tech actually appears in that project's real tag list, so "breadth across full-stack and data/ML" (the product's core positioning claim) is drawn as literal infrastructure instead of asserted in a sentence. The hero is a route console the visitor operates — pick a destination, the signal travels the spine to it as the page scrolls. Nothing here is decorative cartography: every line a project touches, every interchange size, is derived from that project's real stack.

This replaced the "Passbook" ledger direction, which the user found didn't fit. Where the Passbook proved *verified data*, the Data Line proves *versatility* — the other half of the product's positioning — through a different, equally-grounded artifact: dev/data-culture's own diagram language (DAGs, schematics) fused with transit-map convention, not a generic "modern portfolio" template.

**Key Characteristics:**
- One continuous schematic spine (a vertical rail in the left gutter) carries a station marker per section; simple sections get a plain ring, project sections get a multi-color interchange ring sized to how many lines actually converge there.
- A single traveling signal dot rides the spine, position bound to scroll progress — the one authored through-line motion, not a decoration repeated per element.
- One typeface family (Overpass) does every display and body job, the way a transit system's signage face never changes between a station name and a safety notice; Overpass Mono is reserved for readouts only (stats, tags, coordinates).
- Circles are reserved exclusively for stations — nothing else on the page is ever round.
- Glow is reserved for things that are lit in the source material (the traveling signal, the active line, live-status indicators) — never a decorative halo on resting content.

## Colors

Near-black schematic ground with four named signal-line colors carrying real information, not decoration — a Full Palette strategy earned by the source material (transit lines are color-coded by definition).

### Primary — the four skill lines
- **Programming Line — Signal Amber** (`#F2A93B`): Python, JavaScript, C/C++, HTML.
- **Web & Backend Line — Signal Blue** (`#3FA7FF`): Flask, REST APIs, React, Vite/Tailwind. Also the default "active/selected" highlight color for interactive spine elements (nav current-section, focus rings).
- **Data & ML Line — Signal Violet** (`#C05CFF`): PyTorch, Sentence Transformers, FAISS, Pandas/NumPy.
- **Databases & Tools Line — Signal Teal** (`#33D6A6`): PostgreSQL, MySQL, Git/Linux, Docker.

### Neutral
- **Schematic Graphite** (`#0B0E14`): page background throughout — one surface, no cover/page split like the prior system.
- **Panel Graphite** (`#10141C`): the hero console and any raised instrument-panel surface.
- **Signal White** (`#E7ECF3`): primary text.
- **Steel Dim** (`#7C8798`): secondary text, inactive labels, unselected spine segments.
- **Rail** (`#232B3A`): the spine itself at rest, station-ring borders before activation.

### Named Rules
**The Truth-Mapped Line Rule.** A line color may only appear next to a piece of content that genuinely belongs to that skill category (a tag, a section). Interchange-ring segments at each project are generated from that project's real `work-tags`, never hand-picked for balance or color variety. If a project only touches one line, its ring is one color, not four — an honest single-line stop, not an interchange.

**The Glow-Is-Lit Rule.** A glow effect (soft blur halo, not a hard shadow) is reserved for things that are actually lit in the schematic world: the traveling signal dot, the currently-active line, live/status indicators. It never appears on cards, text, or resting UI as generic polish.

## Typography

**Display & Body Font:** Overpass (400/600/700/800) — one signage typeface for hero, section titles, station titles, nav, and body prose alike. Overpass is drawn from Highway Gothic, the US highway/transit signage face; using one family everywhere is a deliberate echo of how a real transit system's signage never changes typeface between a station name and a safety notice.
**Readout Font:** Overpass Mono — reserved for anything that is data rather than prose: tech-stack tags, dates, stat readouts, the console's route input, nav micro-labels.

**Character:** Confident, geometric, built for legibility at a glance and at a distance — a working signage face, not a display face borrowed for mood.

### Hierarchy
- **Hero** (800, `clamp(40px,7vw,92px)`, line-height 1.02): the console headline only.
- **Section Title** (700, `clamp(26px,3.2vw,40px)`): one per station/section, set beside its station node.
- **Station Title** (700, `clamp(19px,2vw,24px)`): individual entries within a section (a project, a role, a degree).
- **Body** (400, 15px, line-height 1.7, ~72ch max): all prose. A 14px caption step exists for secondary detail lines (edu-school, cert entries) — never used for primary description text.
- **Readout** (400, letter-spacing 0.04–0.1em, uppercase where used): a deliberate three-step mono micro-scale — **11px** (footer, scroll-hint, nav-links — quietest chrome), **12px** (the default: tags, dates, section labels, console controls, legend labels), **13px** (nav-mark, hero-sub — identity/thesis emphasis). A single **15px** step is reserved for the terminus contact-link CTA, the largest readout step on the page.
- **Fixed smaller instances:** `exp-role h3` (20px) and `edu-item h3` (18px) are the Station Title role at smaller fixed sizes rather than the fluid clamp — same role, denser context.
- **About Lead** (400, `clamp(18px,2vw,23px)`, line-height 1.6): the About station's opening statement — a one-off larger-body variant for the page's single lead paragraph, not a reusable role.
- **Terminus** (800, `clamp(32px,5.4vw,68px)`, line-height 1.08): the closing station's headline — Hero's register reused at a smaller scale for the page's one deliberate closing statement, matching how Terminus reuses Hero's weight rather than Section Title's.

### Named Rules
**One Signage Face Rule.** Overpass carries every heading and every prose sentence; Overpass Mono carries every non-prose data token. No third typeface is introduced for "personality" — the signage system is the personality.

## Layout

A single continuous **spine** runs down the page inside a fixed-width left gutter (`clamp(64px,9vw,104px)`), present on every section — not a per-page-type device, the one spatial constant of the whole site. Content sits to the right of the spine, padded clear of it. Each section opens with a **station node** sitting on the spine at content-top: a circle, `--rail`-bordered at rest, that becomes a conic-gradient **interchange ring** for any entry (a project) whose tags touch more than one skill line.

The hero is the **route console**: a headline, an "in service" status line, and a bank of four line-chips plus destination buttons a visitor actually operates to jump to a section — real navigation wearing the console's vocabulary, not a decorative fake input.

A single **signal dot** rides the spine at a vertical position bound to overall scroll progress (GSAP ScrollTrigger, scrubbed) — the page's one authored through-line motion. Section entrances are a restrained translateX-from-the-spine-side fade, distinct from (not competing with) the signal dot's motion.

Collapses to a single-column, narrower-gutter spine at 800px — the natural behavior of a transit line diagram on a small screen, not a special-cased mobile layout.

## Elevation & Depth

Flat schematic linework by default — no shadows on resting content. The one form of depth is **glow**, reserved per the Glow-Is-Lit Rule: a soft blur-radius halo (never a hard zero-offset colored border) on the traveling signal dot, the active/selected line and station, and the console's "in service" indicator.

### Named Rules
**Line-Not-Shadow Rule.** Depth and hierarchy come from line weight, color, and glow-when-lit — never from a drop shadow. A schematic doesn't cast shadows; it lights up.

## Shapes

Rectilinear everywhere except stations. Every station node, every interchange ring, every signal dot is a circle; nothing else on the page is ever round — no rounded corners on panels, chips, or buttons.

### Named Rules
**The Circle-Is-A-Station Rule.** A circle means "this is a stop on the line." If a circle appears anywhere that isn't a station node or the signal dot, the shape language has broken.

## Components

### Route Console (signature component)
The hero's operable panel: an Overpass Mono route-input styled like a journey planner, four line-chips (Programming/Web & Backend/Data & ML/Databases & Tools, each in its line color), and destination buttons for each section. Selecting a destination smooth-scrolls there; the signal dot's position (bound to scroll) does the rest — no separate animation to fake.

### Station Nodes
- **Simple station:** a circle, 2px `--rail` border, `bg` fill, at rest; the currently-in-view section's node gets a Signal Blue glow border (active state).
- **Interchange station (projects):** the ring fill is a `conic-gradient` built from the project's real tag-to-line mapping — one wedge per line touched, equal-sized. A single-line project renders as a solid-color ring, not a gradient.

### Links / Actions
No `<button>` chrome beyond the console's own controls. In-content links are Overpass Mono, Steel Dim at rest, moving to their nearest line-color (or Signal Blue by default) on hover, arrow-suffixed with the established widening-gap hover motion.

### Navigation
Fixed top bar, Panel Graphite background, Overpass Mono uppercase links. The link matching the section currently nearest the signal dot carries a small line-color underline — the nav itself reads the spine's current position.

## Do's and Don'ts

### Do:
- **Do** derive every interchange ring from the entry's real tags — the Truth-Mapped Line Rule.
- **Do** keep glow reserved for genuinely "lit" elements — the Glow-Is-Lit Rule.
- **Do** keep circles exclusive to stations — the Circle-Is-A-Station Rule.
- **Do** run Overpass across every heading and body role, Overpass Mono across every data token — One Signage Face Rule.
- **Do** keep the spine present and structurally identical on every section; it is the one constant, not a hero-only flourish.

### Don't:
- **Don't** hand-pick interchange-ring colors for visual balance — they are computed from real tags only.
- **Don't** add a drop shadow anywhere; depth is line weight and glow only.
- **Don't** round a corner on anything that isn't a station or the signal dot.
- **Don't** introduce a third typeface.
- **Don't** let the console's destination buttons be decorative — every one must actually navigate.
