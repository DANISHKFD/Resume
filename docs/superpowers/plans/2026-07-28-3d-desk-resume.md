# 3D Desk-Scene Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "Data Line" transit-map resume site with a growon.kr-style interactive 3D desk scene, where clicking desk objects navigates to real pages covering all 6 resume sections, plus an optional toggleable Cyberpunk 2077 color theme.

**Architecture:** A Three.js scene (`assets/js/scene.js`, loaded via CDN, no build step) renders a desk with 10 objects — 6 "doorway" objects that navigate to dedicated pages on click, 4 decorative objects with idle animations only. Each destination is a real static HTML file styled as a panel over a blurred backdrop (`assets/css/panel.css` + `assets/js/panel.js`), reusing a shared `assets/css/theme.css` for both the default "Desk Lamp" palette and an opt-in "Cyberpunk" palette. A persistent, keyboard-accessible corner nav menu and a no-WebGL fallback card guarantee every section and the resume PDF are reachable regardless of 3D support.

**Tech Stack:** Vanilla HTML/CSS/JS, Three.js r128 (CDN), GSAP 3.12.5 (CDN, already used elsewhere in this repo's history) for tweening both DOM and Three.js object properties. No build step, no backend, no package manager.

## Global Constraints

- No build step, no bundler, no backend — static files only, served as-is from GitHub Pages.
- `Danish ahmed N F Resume.pdf` and `CNAME` are never modified.
- All 10 desk objects are built from primitive/custom Three.js geometry — no external 3D model files, no paid or unlicensed assets.
- `prefers-reduced-motion: reduce` must collapse every animation (object interactions, camera parallax, theme-switch glitch flicker) to an instant end-state, no tweened motion.
- Cyberpunk theme must default to `data-theme="desk-lamp"` on every fresh load — Cyberpunk is opt-in only, never the default first impression, regardless of any prior localStorage value being absent.
- A persistent corner nav menu of real `<a href>` links (About, Education & Skills, Projects, Accomplishments, Gallery, Contact, Resume PDF) must be present, keyboard-focusable, and functional on every page, independent of the 3D canvas.
- If WebGL is unavailable or Three.js fails to load, `index.html` must show a plain fallback card (name, one-line summary, the same nav links, resume PDF link) instead of a blank/broken canvas.
- No resume content, figures, or links may be altered from what's documented in `PRODUCT.md` (branch `updates`) — text is ported verbatim into new containers.
- Every commit stays on branch `3d-desk-redesign`; the live site is untouched until this branch is merged (a separate, later decision).

---

## Task 1: Directory scaffold and shared theme CSS

**Files:**
- Create: `assets/css/theme.css`
- Create: `assets/css/panel.css` (empty shell with a header comment only — filled in Task 11)
- Create: `assets/js/scene.js` (empty shell with a header comment only — filled in Task 3+)
- Create: `assets/js/panel.js` (empty shell with a header comment only — filled in Task 11)

**Interfaces:**
- Produces: CSS custom properties consumed by every later HTML file — `--bg`, `--bg-raised`, `--panel-bg`, `--ink`, `--ink-dim`, `--rail`, `--accent`, `--accent-ink`, `--accent-2`, `--thread-amber`, `--thread-blue`, `--thread-violet`, `--thread-teal`, `--font-display`, `--font-body`, `--font-mono`. Selected via `[data-theme="desk-lamp"]` (default) and `[data-theme="cyberpunk"]` on `<html>`.

- [ ] **Step 1: Create the asset directories**

```bash
mkdir -p "assets/css" "assets/js" "assets/models"
```

- [ ] **Step 2: Write `assets/css/theme.css`**

```css
/* Theme tokens for the 3D desk-scene resume.
   "Desk Lamp" is the default, always-on-load theme.
   "Cyberpunk" is an opt-in override toggled at runtime — see scene.js setTheme(). */

:root,
:root[data-theme="desk-lamp"] {
  --bg: #0A0C10;
  --bg-raised: #12151C;
  --panel-bg: #14171Fee;
  --ink: #EDEAE0;
  --ink-dim: #8B8F98;
  --rail: #262B35;
  --accent: #D9A441;      /* brass lamp light */
  --accent-ink: #0A0C10;
  --accent-2: #6EA8AE;    /* slate-cyan secondary */
  --thread-amber: #F2A93B;
  --thread-blue: #3FA7FF;
  --thread-violet: #C05CFF;
  --thread-teal: #33D6A6;
  --font-display: 'Fraunces', serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

:root[data-theme="cyberpunk"] {
  --bg: #08090A;
  --bg-raised: #101008;
  --panel-bg: #0C0C0Cee;
  --ink: #F5F3E7;
  --ink-dim: #B8B49A;
  --rail: #33330F;
  --accent: #FCEE0A;      /* hazard yellow */
  --accent-ink: #08090A;
  --accent-2: #1FE5F0;    /* glitch cyan */
  --thread-amber: #FCEE0A;
  --thread-blue: #1FE5F0;
  --thread-violet: #1FE5F0;
  --thread-teal: #FCEE0A;
  --font-display: 'Chakra Petch', sans-serif;
}

*{ margin:0; padding:0; box-sizing:border-box; }

body{
  background:var(--bg);
  color:var(--ink);
  font-family:var(--font-body);
  transition: background-color .4s ease, color .4s ease;
}

a{ color:inherit; text-decoration:none; }
a:focus-visible, button:focus-visible{ outline:2px solid var(--accent-2); outline-offset:3px; }
button{ font:inherit; color:inherit; background:none; border:none; cursor:pointer; }

.sr-only{
  position:absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
}

/* ---------- Corner nav (present + functional on every page) ---------- */
#corner-nav{
  position:fixed; top:20px; right:20px; z-index:200;
  font-family:var(--font-mono); font-size:13px;
}
#nav-toggle{
  width:44px; height:44px; border-radius:50%;
  border:1px solid var(--rail); background:var(--bg-raised); color:var(--ink);
}
#nav-list{
  list-style:none; position:absolute; top:52px; right:0;
  background:var(--bg-raised); border:1px solid var(--rail);
  min-width:220px; padding:10px;
  max-height:0; opacity:0; overflow:hidden; pointer-events:none;
  transition: max-height .3s ease, opacity .3s ease;
}
#corner-nav.is-open #nav-list,
#nav-list:focus-within{
  max-height:400px; opacity:1; pointer-events:auto;
}
#nav-list a{
  display:block; padding:10px 8px; color:var(--ink-dim); letter-spacing:.03em;
}
#nav-list a:hover, #nav-list a:focus-visible{ color:var(--accent); }

/* ---------- Theme toggle ---------- */
#theme-toggle{
  position:fixed; top:20px; left:20px; z-index:200;
  font-family:var(--font-mono); font-size:12px; letter-spacing:.05em; text-transform:uppercase;
  padding:11px 16px; border-radius:22px;
  border:1px solid var(--rail); background:var(--bg-raised); color:var(--ink-dim);
}
#theme-toggle:hover{ color:var(--accent); border-color:var(--accent); }

/* ---------- Fallback card (shown only when WebGL/Three.js unavailable) ---------- */
#fallback{
  min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:18px; text-align:center; padding:40px 24px;
}
#fallback h1{ font-family:var(--font-display); font-size:clamp(28px,5vw,48px); }
#fallback p{ color:var(--ink-dim); max-width:52ch; }
#fallback[hidden]{ display:none; }

/* ---------- Glitch flicker (Cyberpunk theme-switch acknowledgement) ---------- */
@keyframes theme-glitch{
  0%, 100% { transform:translate(0,0); opacity:1; }
  20% { transform:translate(-2px,1px); opacity:.85; }
  40% { transform:translate(2px,-1px); opacity:1; }
  60% { transform:translate(-1px,0); opacity:.9; }
  80% { transform:translate(1px,1px); opacity:1; }
}
.theme-glitching{ animation: theme-glitch .35s steps(2) 2; }

@media (prefers-reduced-motion: reduce){
  *{ animation-duration:.001ms !important; transition-duration:.001ms !important; }
}
```

- [ ] **Step 3: Write placeholder header comments in the remaining shell files**

```css
/* assets/css/panel.css — shared chrome for destination pages. Filled in Task 11. */
```

```js
// assets/js/scene.js — 3D desk scene. Filled in starting Task 3.
```

```js
// assets/js/panel.js — shared destination-page behavior. Filled in Task 11.
```

- [ ] **Step 4: Verify files exist**

Run: `ls assets/css assets/js assets/models`
Expected: `theme.css panel.css` under `css`, `scene.js panel.js` under `js`, empty `models` directory present.

- [ ] **Step 5: Commit**

```bash
git add assets
git commit -m "Scaffold asset directories and theme.css with Desk Lamp + Cyberpunk palettes"
```

---

## Task 2: index.html shell — fallback card, hero overlay, corner nav, theme toggle

**Files:**
- Create: `index.html` (overwrites the current Data Line `index.html`)

**Interfaces:**
- Consumes: `assets/css/theme.css` custom properties from Task 1.
- Produces: DOM ids consumed by `scene.js` starting Task 3 — `#scene-root`, `#scene-canvas`, `#fallback`, `#theme-toggle`, `#corner-nav`, `#nav-toggle`, `#nav-list`, `.hero-overlay h1`.

- [ ] **Step 1: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="desk-lamp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Danish Ahmed N F — Data Analytics &amp; Full-Stack Developer</title>
<meta name="description" content="Danish Ahmed N F — Data Analytics and Full-Stack Development portfolio. Click around the desk." />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/theme.css">
<style>
  html,body{ height:100%; overflow:hidden; }
  #scene-root{ position:fixed; inset:0; }
  #scene-canvas{ position:absolute; inset:0; width:100%; height:100%; display:block; }
  .hero-overlay{
    position:absolute; top:64px; left:0; right:0; z-index:10;
    text-align:center; padding:0 24px; pointer-events:none;
  }
  .eyebrow{
    font-family:var(--font-mono); font-size:12px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--ink-dim); display:block; margin-bottom:14px;
  }
  .hero-overlay h1{
    font-family:var(--font-display); font-weight:700; color:var(--ink);
    font-size:clamp(32px,6vw,64px); line-height:1.05;
  }
  .hero-overlay h1 span{ color:var(--accent); }
  .tagline{
    font-family:var(--font-body); font-size:clamp(14px,1.6vw,17px); color:var(--ink-dim);
    max-width:44ch; margin:14px auto 0;
  }
  .scene-hint{
    position:absolute; bottom:28px; left:0; right:0; z-index:10; text-align:center;
    font-family:var(--font-mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--ink-dim); pointer-events:none;
  }
  #scene-root[hidden]{ display:none; }
</style>
</head>
<body>

<div id="fallback" hidden>
  <h1>Danish Ahmed N F</h1>
  <p>Data Analytics ⇄ Full-Stack Development. Your browser can't render the interactive desk scene, but every section below still works.</p>
  <nav aria-label="Section navigation">
    <ul style="list-style:none; display:flex; flex-direction:column; gap:12px; font-family:var(--font-mono); font-size:14px;">
      <li><a href="about.html">About</a></li>
      <li><a href="education.html">Education &amp; Skills</a></li>
      <li><a href="projects.html">Projects</a></li>
      <li><a href="accomplishments.html">Accomplishments</a></li>
      <li><a href="gallery.html">Gallery</a></li>
      <li><a href="contact.html">Contact</a></li>
      <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
    </ul>
  </nav>
</div>

<div id="scene-root">
  <canvas id="scene-canvas" aria-hidden="true"></canvas>

  <header class="hero-overlay">
    <span class="eyebrow">Coimbatore, Tamil Nadu, India — open to internships</span>
    <h1>Danish Ahmed <span>N F</span></h1>
    <p class="tagline">Data Analytics ⇄ Full-Stack Development. Click around the desk — every object goes somewhere.</p>
  </header>

  <button id="theme-toggle" aria-pressed="false" type="button">Cyberpunk mode</button>

  <nav id="corner-nav" aria-label="Section navigation">
    <button id="nav-toggle" aria-expanded="false" aria-controls="nav-list" type="button">
      Menu<span class="sr-only"> (section navigation)</span>
    </button>
    <ul id="nav-list">
      <li><a href="about.html">About</a></li>
      <li><a href="education.html">Education &amp; Skills</a></li>
      <li><a href="projects.html">Projects</a></li>
      <li><a href="accomplishments.html">Accomplishments</a></li>
      <li><a href="gallery.html">Gallery</a></li>
      <li><a href="contact.html">Contact</a></li>
      <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
    </ul>
  </nav>

  <p class="scene-hint">Click anything on the desk</p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="assets/js/scene.js" defer></script>
<script>
  document.getElementById('nav-toggle').addEventListener('click', function(){
    var nav = document.getElementById('corner-nav');
    var open = nav.classList.toggle('is-open');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
</script>

</body>
</html>
```

- [ ] **Step 2: Verify the shell renders and the nav menu works without any 3D yet**

Use `mcp__claude-in-chrome` tools: navigate to `file:///D:/Projects/Danish Resume/Resume/index.html`, screenshot. Expected: dark background, "Danish Ahmed N F" headline visible, "Menu" button top-right, "Cyberpunk mode" button top-left, no console errors about `scene.js` (it's still just a header comment, so it will load and do nothing — that's expected at this step).

Click the "Menu" button; screenshot again. Expected: a list of 7 links (About, Education & Skills, Projects, Accomplishments, Gallery, Contact, Resume PDF) becomes visible.

Read the page via `mcp__claude-in-chrome__read_page` with `filter: "interactive"`. Expected: all 7 nav links plus the theme-toggle and nav-toggle buttons are present as real interactive elements (this is the accessibility fallback path — it must work even though the destination pages don't exist yet, so clicking them will 404 at this stage, which is fine for now).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add index.html shell: hero overlay, corner nav, theme toggle, fallback card"
```

---

## Task 3: Three.js bootstrap — renderer, camera, lighting, desk surface

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `#scene-canvas`, `#scene-root`, `#fallback` from Task 2.
- Produces: module-scope variables and functions reused by every later scene task — `scene`, `camera`, `renderer`, `deskGroup` (a `THREE.Group` at origin that all desk objects attach to), `lampLight` (a `THREE.PointLight`), `ambientLight`, `THEMES` (theme→light/material color map), `reduceMotion` (boolean), `render()` loop already running.

- [ ] **Step 1: Write the scene bootstrap in `assets/js/scene.js`**

```js
// assets/js/scene.js — 3D desk scene for the resume site.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var sceneRoot = document.getElementById('scene-root');
  var fallback = document.getElementById('fallback');
  var canvas = document.getElementById('scene-canvas');

  function supportsWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function showFallback() {
    if (sceneRoot) sceneRoot.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  if (!supportsWebGL() || typeof THREE === 'undefined') {
    showFallback();
    return;
  }

  var THEMES = {
    'desk-lamp': {
      lampColor: 0xffb066,
      lampIntensity: 1.35,
      ambientColor: 0x1a1f2b,
      ambientIntensity: 0.4,
      bgColor: 0x0a0c10,
      deskColor: 0x2b2f38
    },
    'cyberpunk': {
      lampColor: 0x1fe5f0,
      lampIntensity: 1.6,
      ambientColor: 0x141400,
      ambientIntensity: 0.3,
      bgColor: 0x08090a,
      deskColor: 0x14140a
    }
  };

  var currentTheme = document.documentElement.getAttribute('data-theme') || 'desk-lamp';

  var scene, camera, renderer, deskGroup, lampLight, ambientLight, lampBulbMat;
  var clock = new THREE.Clock();
  var interactives = []; // populated by later tasks: meshes with userData.interactive = true

  try {
    initScene();
    animate();
  } catch (err) {
    console.error('Scene failed to initialize', err);
    showFallback();
    return;
  }

  function initScene() {
    var theme = THEMES[currentTheme];

    scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.bgColor);

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    camera.position.set(0, 5.6, 9.2);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    ambientLight = new THREE.AmbientLight(theme.ambientColor, theme.ambientIntensity);
    scene.add(ambientLight);

    lampLight = new THREE.PointLight(theme.lampColor, theme.lampIntensity, 14, 2);
    lampLight.position.set(2.1, 3.6, 1.2);
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    scene.add(lampLight);

    deskGroup = new THREE.Group();
    scene.add(deskGroup);

    var deskGeo = new THREE.BoxGeometry(8.4, 0.3, 4.6);
    var deskMat = new THREE.MeshStandardMaterial({ color: theme.deskColor, roughness: 0.75, metalness: 0.1 });
    var desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, -0.15, 0);
    desk.receiveShadow = true;
    deskGroup.add(desk);

    window.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  // Exposed for later tasks in this file (object factories, raycasting, theme toggle)
  // via closure — subsequent tasks append to this same IIFE rather than creating new globals.
  window.__resumeScene = {
    get scene() { return scene; },
    get camera() { return camera; },
    get renderer() { return renderer; },
    get deskGroup() { return deskGroup; },
    get lampLight() { return lampLight; },
    get ambientLight() { return ambientLight; },
    THEMES: THEMES,
    reduceMotion: reduceMotion,
    interactives: interactives
  };
})();
```

- [ ] **Step 2: Verify a lit desk slab renders with no console errors**

Use `mcp__claude-in-chrome`: navigate to `file:///D:/Projects/Danish Resume/Resume/index.html`, wait 2s, screenshot. Expected: a dark scene with a lit rectangular slab (the desk) visible roughly center-lower, warm light falling on it from the upper right.

Run `mcp__claude-in-chrome__read_console_messages` with `pattern: "error|Error"`. Expected: no matches.

Run `mcp__claude-in-chrome__javascript_tool`: `window.__resumeScene.deskGroup.children.length` — Expected: `1` (just the desk mesh so far).

- [ ] **Step 3: Commit**

```bash
git add assets/js/scene.js
git commit -m "Bootstrap Three.js scene: renderer, camera, lamp light, desk surface"
```

---

## Task 4: Interactive-object registry and raycaster click/hover handling

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `scene`, `camera`, `renderer`, `interactives` array from Task 3.
- Produces: `registerInteractive(rootGroup, hitMesh, handlers)` function — `handlers` is `{ onClick(), onHoverIn(), onHoverOut() }`, all optional — used by every object factory from Task 5 onward. Also produces `document.body.style.cursor` hover-affordance behavior.

- [ ] **Step 1: Append raycasting infrastructure to `assets/js/scene.js`**

Add this block right before the closing `window.__resumeScene = {...}` assignment (so it can reference `scene`, `camera`, `renderer`, `interactives` from the enclosing closure):

```js
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var hoveredRoot = null;

  function registerInteractive(rootGroup, hitMesh, handlers) {
    rootGroup.userData.interactive = true;
    rootGroup.userData.handlers = handlers || {};
    interactives.push(hitMesh);
  }

  function findInteractiveAncestor(obj) {
    var o = obj;
    while (o) {
      if (o.userData && o.userData.interactive) return o;
      o = o.parent;
    }
    return null;
  }

  function updatePointer(evt) {
    var rect = renderer.domElement.getBoundingClientRect();
    var clientX = evt.clientX;
    var clientY = evt.clientY;
    if (evt.changedTouches && evt.changedTouches.length) {
      clientX = evt.changedTouches[0].clientX;
      clientY = evt.changedTouches[0].clientY;
    }
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerMove(evt) {
    updatePointer(evt);
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(interactives, true);
    var root = hits.length ? findInteractiveAncestor(hits[0].object) : null;

    if (root !== hoveredRoot) {
      if (hoveredRoot && hoveredRoot.userData.handlers.onHoverOut) {
        hoveredRoot.userData.handlers.onHoverOut();
      }
      if (root && root.userData.handlers.onHoverIn) {
        root.userData.handlers.onHoverIn();
      }
      hoveredRoot = root;
      document.body.style.cursor = root ? 'pointer' : 'default';
    }
  }

  function onPointerClick(evt) {
    updatePointer(evt);
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(interactives, true);
    if (!hits.length) return;
    var root = findInteractiveAncestor(hits[0].object);
    if (root && root.userData.handlers.onClick) {
      root.userData.handlers.onClick();
    }
  }

  renderer.domElement.addEventListener('mousemove', onPointerMove);
  renderer.domElement.addEventListener('click', onPointerClick);
  renderer.domElement.addEventListener('touchend', onPointerClick);
```

Also move the `window.__resumeScene = {...}` object's contents to include two more entries so later tasks can call these from the same closure (they already can, since later tasks' code is appended inside this same IIFE — no export needed). No change to the exported object is required for this task.

- [ ] **Step 2: Add a temporary probe object to verify raycasting works, then remove it**

Temporarily add right after `deskGroup.add(desk);` in `initScene()`:

```js
    var probeGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var probeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var probe = new THREE.Mesh(probeGeo, probeMat);
    probe.position.set(0, 0.3, 0);
    deskGroup.add(probe);
    registerInteractive(probe, probe, {
      onClick: function () { console.log('PROBE_CLICKED'); },
      onHoverIn: function () { probe.material.color.set(0x00ff00); },
      onHoverOut: function () { probe.material.color.set(0xff0000); }
    });
```

Use `mcp__claude-in-chrome`: navigate/reload `index.html`, screenshot — expect a small red cube on the desk. Move mouse over its screen position (use `computer` action `hover` at the cube's approximate coordinates from the screenshot) and screenshot again — expect it turned green. Click it, then check console via `read_console_messages` with `pattern: "PROBE_CLICKED"` — expect one match.

- [ ] **Step 3: Remove the probe block** (delete the code added in Step 2) now that raycasting is confirmed working.

- [ ] **Step 4: Re-verify after removal**

Reload `index.html`, screenshot. Expected: no red/green cube, just the desk, no console errors.

- [ ] **Step 5: Commit**

```bash
git add assets/js/scene.js
git commit -m "Add raycaster-based interactive-object registry (click + hover)"
```

---

## Task 5: Desk lamp object with light-toggle interaction

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `registerInteractive`, `deskGroup`, `lampLight`, `ambientLight`, `THEMES`, `currentTheme`, `reduceMotion`, `gsap` (global from CDN) — all in scope from Tasks 3–4.
- Produces: `lampOn` boolean (module scope), reused by Task 10's theme toggle to keep the lamp's on/off state consistent across a theme switch.

- [ ] **Step 1: Append the lamp factory to `assets/js/scene.js`** (inside the same IIFE, after the raycasting block)

```js
  var lampOn = true;

  function buildLamp() {
    var group = new THREE.Group();
    group.position.set(2.1, -0.15, 1.2);

    var baseMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.5, metalness: 0.6 });
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.1, 24), baseMat);
    group.add(base);

    var poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 12), poleMat);
    pole.position.set(0, 1.75, 0);
    group.add(pole);

    var armPivot = new THREE.Group();
    armPivot.position.set(0, 3.4, 0);
    group.add(armPivot);
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 12), poleMat);
    arm.rotation.z = Math.PI / 2.6;
    arm.position.set(0.55, 0.28, 0);
    armPivot.add(arm);

    lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0x111111, emissive: THEMES[currentTheme].lampColor, emissiveIntensity: lampOn ? 1.4 : 0
    });
    var head = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.5, 20, 1, true), lampBulbMat);
    head.rotation.x = Math.PI;
    head.position.set(1.05, 0.5, 0);
    armPivot.add(head);

    deskGroup.add(group);
    lampLight.position.copy(head.getWorldPosition(new THREE.Vector3()));

    registerInteractive(group, group, {
      onClick: function () { toggleLamp(); },
      onHoverIn: function () { document.body.style.cursor = 'pointer'; },
      onHoverOut: function () { }
    });

    return group;
  }

  function toggleLamp() {
    lampOn = !lampOn;
    var theme = THEMES[currentTheme];
    var targetLightIntensity = lampOn ? theme.lampIntensity : 0;
    var targetAmbient = lampOn ? theme.ambientIntensity : theme.ambientIntensity * 0.35;
    var targetEmissive = lampOn ? 1.4 : 0;

    if (reduceMotion) {
      lampLight.intensity = targetLightIntensity;
      ambientLight.intensity = targetAmbient;
      lampBulbMat.emissiveIntensity = targetEmissive;
      return;
    }
    gsap.to(lampLight, { intensity: targetLightIntensity, duration: 0.5, ease: 'power2.out' });
    gsap.to(ambientLight, { intensity: targetAmbient, duration: 0.5, ease: 'power2.out' });
    gsap.to(lampBulbMat, { emissiveIntensity: targetEmissive, duration: 0.5, ease: 'power2.out' });
  }

  buildLamp();
```

- [ ] **Step 2: Verify the lamp renders and toggling works**

Reload `index.html` via `mcp__claude-in-chrome`, screenshot. Expected: a small lamp (base, pole, angled arm, glowing head) visible on the desk near the light source position.

Click the lamp head's screen position, wait 1s, screenshot again. Expected: the scene visibly dims (ambient + point light both reduced). Click again — expected: scene brightens back to the original look.

Run `javascript_tool`: `window.__resumeScene` should be unaffected structurally (no new exports required this task, sanity-check no thrown errors instead) — run `document.title` as a trivial no-op call to confirm the JS context is alive with no console errors; then `read_console_messages` with `pattern: "error|Error"` — expect no matches.

- [ ] **Step 3: Commit**

```bash
git add assets/js/scene.js
git commit -m "Add desk lamp object with light on/off toggle interaction"
```

---

## Task 6: Decorative objects — plant, rubber duck, pen

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `registerInteractive`, `deskGroup`, `reduceMotion`, `gsap` from Tasks 3–5.
- Produces: `buildPlant()`, `buildDuck()`, `buildPen()` factory calls (no external interfaces needed by later tasks — purely decorative, self-contained).

- [ ] **Step 1: Append the plant factory**

```js
  function buildPlant() {
    var group = new THREE.Group();
    group.position.set(-3.4, -0.15, 0.6);

    var potMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8 });
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 16), potMat);
    pot.position.y = 0.25;
    group.add(pot);

    var leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 0.6, side: THREE.DoubleSide });
    var leaves = new THREE.Group();
    leaves.position.y = 0.55;
    for (var i = 0; i < 6; i++) {
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 6), leafMat);
      var angle = (i / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * 0.12, 0.45, Math.sin(angle) * 0.12);
      leaf.rotation.z = Math.cos(angle) * 0.35;
      leaf.rotation.x = Math.sin(angle) * 0.35;
      leaves.add(leaf);
    }
    group.add(leaves);
    deskGroup.add(group);

    registerInteractive(group, group, {
      onClick: function () {
        if (reduceMotion) return;
        gsap.to(leaves.rotation, {
          z: leaves.rotation.z + 0.18, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut'
        });
      }
    });
    return group;
  }
```

- [ ] **Step 2: Append the rubber duck factory**

```js
  function buildDuck() {
    var group = new THREE.Group();
    group.position.set(-1.6, -0.15, 1.6);

    var duckMat = new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.5 });
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), duckMat);
    body.scale.set(1, 0.85, 1.1);
    body.position.y = 0.26;
    group.add(body);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), duckMat);
    head.position.set(0.2, 0.48, 0);
    group.add(head);

    var beakMat = new THREE.MeshStandardMaterial({ color: 0xe08a1e, roughness: 0.5 });
    var beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 8), beakMat);
    beak.rotation.z = Math.PI / 2;
    beak.position.set(0.34, 0.46, 0);
    group.add(beak);

    var eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    [1, -1].forEach(function (s) {
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeMat);
      eye.position.set(0.27, 0.52, 0.09 * s);
      group.add(eye);
    });

    deskGroup.add(group);

    registerInteractive(group, body, {
      onClick: function () {
        if (reduceMotion) return;
        gsap.timeline()
          .to(group.scale, { y: 0.6, duration: 0.1, ease: 'power1.in' })
          .to(group.scale, { y: 1, duration: 0.35, ease: 'bounce.out' });
      }
    });
    return group;
  }
```

- [ ] **Step 3: Append the pen factory (physics-style fall, one-shot like growon's pencil)**

```js
  function buildPen() {
    var group = new THREE.Group();
    group.position.set(3.2, -0.0, -1.2);
    var fallen = false;

    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2255cc, roughness: 0.35, metalness: 0.2 });
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 12), bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    var tipMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 0.8 });
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 12), tipMat);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 0.62;
    group.add(tip);

    deskGroup.add(group);

    registerInteractive(group, group, {
      onClick: function () {
        if (fallen) return;
        fallen = true;
        if (reduceMotion) {
          group.position.set(3.6, -1.6, -1.6);
          group.rotation.set(0.4, 0, 1.4);
          return;
        }
        gsap.to(group.position, { x: 3.6, y: -1.6, z: -1.6, duration: 0.7, ease: 'power2.in' });
        gsap.to(group.rotation, { x: 2.2, y: 1.1, z: 3.4, duration: 0.7, ease: 'power1.in' });
      }
    });
    return group;
  }

  buildPlant();
  buildDuck();
  buildPen();
```

- [ ] **Step 4: Verify all three decorative objects**

Reload `index.html`, screenshot. Expected: a small potted plant (left of desk), a yellow duck, and a blue pen visible on the desk alongside the lamp.

Click the plant — screenshot mid-animation (or immediately after): leaves should look rotated/swayed. Click the duck — screenshot: body should look squashed or already bounced back. Click the pen — wait 1s, screenshot: pen should now be positioned off/below the desk edge, tumbled. Click the pen again — confirm (via a second screenshot) nothing further happens (it's already fallen, matching growon's one-shot behavior).

`read_console_messages` with `pattern: "error|Error"` — expect no matches.

- [ ] **Step 5: Commit**

```bash
git add assets/js/scene.js
git commit -m "Add decorative objects: plant sway, duck squash-bounce, pen physics fall"
```

---

## Task 7: Laptop object — first doorway, establishes navigate-after-animate pattern

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `registerInteractive`, `deskGroup`, `reduceMotion`, `gsap` from Tasks 3–5.
- Produces: `navigateAfter(href, delayMs)` helper function, reused by all 5 remaining doorway objects in Task 8.

- [ ] **Step 1: Append the shared navigation helper**

```js
  function navigateAfter(href, delayMs) {
    if (reduceMotion) {
      window.location.href = href;
      return;
    }
    window.setTimeout(function () {
      window.location.href = href;
    }, delayMs);
  }
```

- [ ] **Step 2: Append the laptop factory**

```js
  function buildLaptop() {
    var group = new THREE.Group();
    group.position.set(0, -0.15, -0.4);
    var opened = false;

    var baseMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.4, metalness: 0.5 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.0), baseMat);
    base.position.y = 0.03;
    group.add(base);

    var hinge = new THREE.Group();
    hinge.position.set(0, 0.06, -0.48);
    group.add(hinge);

    var screenMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.4, metalness: 0.5 });
    var screen = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.05), screenMat);
    screen.position.set(0, 0.48, -0.025);
    hinge.add(screen);

    var glowMat = new THREE.MeshStandardMaterial({
      color: 0x0a1622, emissive: 0x3fa7ff, emissiveIntensity: 0.0
    });
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.78), glowMat);
    glow.position.set(0, 0.48, 0.005);
    hinge.add(glow);

    hinge.rotation.x = -0.35; // mostly-closed idle state

    deskGroup.add(group);

    function openAndGo() {
      if (opened) return;
      opened = true;
      if (reduceMotion) {
        hinge.rotation.x = -1.75;
        glowMat.emissiveIntensity = 1;
        navigateAfter('projects.html', 0);
        return;
      }
      gsap.to(hinge.rotation, { x: -1.75, duration: 0.55, ease: 'power2.out' });
      gsap.to(glowMat, { emissiveIntensity: 1, duration: 0.4, delay: 0.15 });
      navigateAfter('projects.html', 650);
    }

    registerInteractive(group, group, { onClick: openAndGo });
    return group;
  }

  buildLaptop();
```

- [ ] **Step 3: Verify the laptop opens and navigates**

Reload `index.html`, screenshot. Expected: a closed/tilted laptop shape visible near desk center.

Click it, wait 200ms, screenshot. Expected: screen visibly lifted more open with a faint blue glow on it. Wait 500ms more, then check the tab's URL via `mcp__claude-in-chrome__tabs_context_mcp`. Expected: URL now ends in `projects.html` (this will 404/blank since the file doesn't exist yet — that's fine, we're only verifying the navigation *fires*; note the 404 in the report but don't treat it as a task failure since `projects.html` is created in Task 14).

- [ ] **Step 4: Commit**

```bash
git add assets/js/scene.js
git commit -m "Add laptop object: opens and navigates to projects.html"
```

---

## Task 8: Remaining 5 doorway objects — notebook, mug, trophy, picture frame, figurine

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `registerInteractive`, `deskGroup`, `reduceMotion`, `gsap`, `navigateAfter` from Tasks 3–7.
- Produces: nothing new consumed later — this completes the full object roster (10/10 objects in the scene).

- [ ] **Step 1: Append the notebook factory**

```js
  function buildNotebook() {
    var group = new THREE.Group();
    group.position.set(1.1, -0.15, 1.4);
    var opened = false;

    var coverMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.7 });
    var coverPivot = new THREE.Group();
    var cover = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 1.0), coverMat);
    cover.position.set(0.375, 0, 0);
    coverPivot.add(cover);
    group.add(coverPivot);

    var pageMat = new THREE.MeshStandardMaterial({ color: 0xEFEAE0, roughness: 0.9 });
    var pages = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 1.0), pageMat);
    pages.position.set(0, 0.005, 0);
    group.add(pages);

    deskGroup.add(group);

    function openAndGo() {
      if (opened) return;
      opened = true;
      if (reduceMotion) {
        coverPivot.rotation.z = Math.PI * 0.85;
        navigateAfter('education.html', 0);
        return;
      }
      gsap.to(coverPivot.rotation, { z: Math.PI * 0.85, duration: 0.5, ease: 'power2.out' });
      navigateAfter('education.html', 600);
    }

    registerInteractive(group, group, { onClick: openAndGo });
    return group;
  }
```

- [ ] **Step 2: Append the mug factory**

```js
  function buildMug() {
    var group = new THREE.Group();
    group.position.set(-0.9, -0.15, 1.5);
    var clicked = false;

    var mugMat = new THREE.MeshStandardMaterial({ color: 0xe7e2d8, roughness: 0.5 });
    var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.4, 20), mugMat);
    cup.position.y = 0.2;
    group.add(cup);

    var handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20, Math.PI), mugMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.24, 0.2, 0);
    group.add(handle);

    var steamGroup = new THREE.Group();
    steamGroup.position.set(0, 0.42, 0);
    group.add(steamGroup);
    var steamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    var steamPuffs = [];
    for (var i = 0; i < 3; i++) {
      var puff = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), steamMat.clone());
      puff.position.set((i - 1) * 0.05, 0, 0);
      steamGroup.add(puff);
      steamPuffs.push(puff);
    }

    deskGroup.add(group);

    function rippleAndGo() {
      if (clicked) return;
      clicked = true;
      if (reduceMotion) {
        navigateAfter('contact.html', 0);
        return;
      }
      steamPuffs.forEach(function (puff, i) {
        gsap.to(puff.position, { y: 0.5, duration: 0.8, delay: i * 0.08, ease: 'power1.out' });
        gsap.to(puff.material, { opacity: 0.5, duration: 0.2, delay: i * 0.08 })
          .then(function () { gsap.to(puff.material, { opacity: 0, duration: 0.5 }); });
      });
      navigateAfter('contact.html', 550);
    }

    registerInteractive(group, group, { onClick: rippleAndGo });
    return group;
  }
```

- [ ] **Step 3: Append the trophy factory**

```js
  function buildTrophy() {
    var group = new THREE.Group();
    group.position.set(-2.6, -0.15, -1.1);
    var clicked = false;

    var goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 0.85 });
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 16), goldMat);
    base.position.y = 0.06;
    group.add(base);

    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 12), goldMat);
    stem.position.y = 0.27;
    group.add(stem);

    var cup = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), goldMat);
    cup.position.y = 0.55;
    group.add(cup);

    [1, -1].forEach(function (s) {
      var handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16, Math.PI), goldMat);
      handle.rotation.y = Math.PI / 2;
      handle.rotation.z = Math.PI / 2 * s;
      handle.position.set(0.22 * s, 0.55, 0);
      group.add(handle);
    });

    deskGroup.add(group);

    function glintAndGo() {
      if (clicked) return;
      clicked = true;
      if (reduceMotion) {
        navigateAfter('accomplishments.html', 0);
        return;
      }
      gsap.to(goldMat, { emissive: new THREE.Color(0xffe9a8), emissiveIntensity: 0.8, duration: 0.25, yoyo: true, repeat: 3 });
      navigateAfter('accomplishments.html', 550);
    }

    registerInteractive(group, group, { onClick: glintAndGo });
    return group;
  }
```

- [ ] **Step 4: Append the picture frame factory**

```js
  function buildFrame() {
    var group = new THREE.Group();
    group.position.set(-3.6, 0.75, -1.9);
    group.rotation.x = -0.08;
    var clicked = false;

    var frameMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.6 });
    var frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.06), frameMat);
    group.add(frame);

    var photoMat = new THREE.MeshStandardMaterial({ color: 0x6ea8ae, roughness: 0.5 });
    var photo = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.54), photoMat);
    photo.position.z = 0.035;
    group.add(photo);

    deskGroup.add(group);

    var idleRotX = group.rotation.x;

    function tiltAndGo() {
      if (clicked) return;
      clicked = true;
      if (reduceMotion) {
        group.rotation.x = idleRotX + 0.3;
        navigateAfter('gallery.html', 0);
        return;
      }
      gsap.to(group.rotation, { x: idleRotX + 0.3, duration: 0.4, ease: 'power2.out' });
      navigateAfter('gallery.html', 500);
    }

    registerInteractive(group, group, { onClick: tiltAndGo });
    return group;
  }
```

- [ ] **Step 5: Append the figurine factory**

```js
  function buildFigurine() {
    var group = new THREE.Group();
    group.position.set(2.6, -0.15, -1.6);
    var clicked = false;

    var mat = new THREE.MeshStandardMaterial({ color: 0x6ea8ae, roughness: 0.6 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mat);
    head.position.y = 0.42;
    group.add(head);

    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.28, 10), mat);
    body.position.y = 0.24;
    group.add(body);

    [[-1, 0.08], [1, 0.08]].forEach(function (pair) {
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), mat);
      arm.position.set(pair[0] * pair[1] * 1.4, 0.28, 0);
      arm.rotation.z = pair[0] * 0.5;
      group.add(arm);
    });
    [[-1], [1]].forEach(function (pair) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), mat);
      leg.position.set(pair[0] * 0.04, 0.05, 0);
      group.add(leg);
    });

    deskGroup.add(group);

    function nodAndGo() {
      if (clicked) return;
      clicked = true;
      if (reduceMotion) {
        navigateAfter('about.html', 0);
        return;
      }
      gsap.to(group.rotation, { z: 0.25, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' });
      navigateAfter('about.html', 550);
    }

    registerInteractive(group, group, { onClick: nodAndGo });
    return group;
  }

  buildNotebook();
  buildMug();
  buildTrophy();
  buildFrame();
  buildFigurine();
```

- [ ] **Step 6: Verify all 5 remaining doorways**

Reload `index.html`, screenshot the full desk — expect 10 objects total now visible (lamp, plant, duck, pen, laptop, notebook, mug, trophy, frame, figurine).

For each of notebook, mug, trophy, frame, figurine: click it, wait ~700ms, check `mcp__claude-in-chrome__tabs_context_mcp` for the resulting URL, then navigate back to `file:///D:/Projects/Danish Resume/Resume/index.html` before testing the next one. Expected destinations respectively: `education.html`, `contact.html`, `accomplishments.html`, `gallery.html`, `about.html` (all will currently 404/blank — that's expected until Tasks 12–17 create them).

`read_console_messages` with `pattern: "error|Error"` after each — expect no matches.

- [ ] **Step 7: Commit**

```bash
git add assets/js/scene.js
git commit -m "Add remaining doorway objects: notebook, mug, trophy, frame, figurine"
```

---

## Task 9: Subtle camera parallax (polish pass, reduced-motion safe)

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `camera`, `reduceMotion` from Task 3.
- Produces: nothing consumed by later tasks — self-contained polish.

- [ ] **Step 1: Append mouse-driven parallax to `assets/js/scene.js`**

```js
  var basecameraPos = camera.position.clone();
  var targetParallax = { x: 0, y: 0 };
  var currentParallax = { x: 0, y: 0 };

  if (!reduceMotion) {
    window.addEventListener('mousemove', function (evt) {
      targetParallax.x = (evt.clientX / window.innerWidth - 0.5) * 0.6;
      targetParallax.y = (evt.clientY / window.innerHeight - 0.5) * 0.3;
    });
  }

  function updateParallax() {
    if (reduceMotion) return;
    currentParallax.x += (targetParallax.x - currentParallax.x) * 0.04;
    currentParallax.y += (targetParallax.y - currentParallax.y) * 0.04;
    camera.position.x = basecameraPos.x + currentParallax.x;
    camera.position.y = basecameraPos.y - currentParallax.y;
    camera.lookAt(0, 1, 0);
  }
```

- [ ] **Step 2: Call `updateParallax()` from the render loop**

Modify the existing `animate()` function from Task 3:

```js
  function animate() {
    requestAnimationFrame(animate);
    updateParallax();
    renderer.render(scene, camera);
  }
```

- [ ] **Step 3: Verify parallax moves the camera and respects reduced motion**

Reload `index.html`, take a screenshot at default mouse position, then use `computer` `hover` to move the mouse to a screen corner, wait 500ms, screenshot again. Expected: the desk framing shifts very slightly between the two screenshots (subtle, not dramatic).

Verify the reduced-motion gate statically: `Grep` for `if (reduceMotion) return;` inside `updateParallax` — confirm the guard exists (already written in Step 1) so a `prefers-reduced-motion: reduce` visitor gets a fully static camera.

- [ ] **Step 4: Commit**

```bash
git add assets/js/scene.js
git commit -m "Add subtle mouse-driven camera parallax, gated by prefers-reduced-motion"
```

---

## Task 10: Cyberpunk theme toggle — JS state, material/light recolor, persistence, glitch flicker

**Files:**
- Modify: `assets/js/scene.js`
- Modify: `index.html:` (small inline script addition for the toggle button's click handler)

**Interfaces:**
- Consumes: `THEMES`, `lampLight`, `ambientLight`, `scene`, `deskGroup`, `lampOn`, `lampBulbMat`, `currentTheme`, `reduceMotion` from Tasks 3–5.
- Produces: `window.__resumeScene.setTheme(name)` — consumed by `panel.js` in Task 11 so destination pages can read/apply the same persisted theme choice without re-creating a Three.js scene.

- [ ] **Step 1: Append the theme-switching function to `assets/js/scene.js`**

```js
  function applyThemeToScene(name) {
    var theme = THEMES[name];
    currentTheme = name;
    scene.background.set(theme.bgColor);
    deskGroup.children[0].material.color.set(theme.deskColor); // desk slab is always child 0
    lampLight.color.set(theme.lampColor);
    lampLight.intensity = lampOn ? theme.lampIntensity : 0;
    ambientLight.color.set(theme.ambientColor);
    ambientLight.intensity = lampOn ? theme.ambientIntensity : theme.ambientIntensity * 0.35;
    if (lampBulbMat) lampBulbMat.emissive.set(theme.lampColor);
  }

  function setTheme(name) {
    if (!THEMES[name]) name = 'desk-lamp';
    document.documentElement.setAttribute('data-theme', name);
    window.localStorage.setItem('resumeTheme', name);
    applyThemeToScene(name);

    var toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', name === 'cyberpunk' ? 'true' : 'false');

    var headline = document.querySelector('.hero-overlay h1');
    if (headline && !reduceMotion) {
      headline.classList.remove('theme-glitching');
      void headline.offsetWidth; // restart animation
      headline.classList.add('theme-glitching');
    }
  }

  window.__resumeScene.setTheme = setTheme;
```

- [ ] **Step 2: Wire the toggle button in `index.html`**

Modify the existing inline `<script>` block at the bottom of `index.html` (added in Task 2) to also handle the theme button:

```html
<script>
  document.getElementById('nav-toggle').addEventListener('click', function(){
    var nav = document.getElementById('corner-nav');
    var open = nav.classList.toggle('is-open');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.getElementById('theme-toggle').addEventListener('click', function(){
    var current = document.documentElement.getAttribute('data-theme') || 'desk-lamp';
    var next = current === 'cyberpunk' ? 'desk-lamp' : 'cyberpunk';
    if (window.__resumeScene && window.__resumeScene.setTheme) {
      window.__resumeScene.setTheme(next);
    } else {
      document.documentElement.setAttribute('data-theme', next);
      window.localStorage.setItem('resumeTheme', next);
    }
  });
</script>
```

- [ ] **Step 3: Verify the toggle switches the whole scene and persists, but never auto-loads Cyberpunk**

Reload `index.html` fresh (clear localStorage first via `javascript_tool`: `window.localStorage.clear()`, then reload). Screenshot. Expected: `data-theme="desk-lamp"` on `<html>` (check via `javascript_tool`: `document.documentElement.getAttribute('data-theme')` → `"desk-lamp"`), confirming the Global Constraint that Cyberpunk never loads by default.

Click the "Cyberpunk mode" button, screenshot. Expected: background/desk/lamp colors visibly shift to black/yellow/cyan, headline briefly glitches.

Reload the page (without clearing localStorage this time). Expected via `javascript_tool`: `document.documentElement.getAttribute('data-theme')` → `"cyberpunk"` (persisted choice honored on reload — but note this is the user's own explicit prior choice, not a default).

Click the toggle again to switch back to Desk Lamp; confirm scene colors revert.

- [ ] **Step 4: Commit**

```bash
git add assets/js/scene.js index.html
git commit -m "Add Cyberpunk theme toggle: scene recolor, persistence, glitch flicker"
```

---

## Task 11: Shared panel-page chrome — panel.css, panel.js

**Files:**
- Modify: `assets/css/panel.css`
- Modify: `assets/js/panel.js`

**Interfaces:**
- Consumes: `assets/css/theme.css` custom properties (Task 1).
- Produces: the `.panel-page` / `.panel-backdrop` / `.panel` / `.panel-close` CSS classes and `initPanelChrome()` JS function — consumed by every destination page created in Tasks 12–17.

- [ ] **Step 1: Write `assets/css/panel.css`**

```css
/* Shared chrome for destination pages (about/education/projects/accomplishments/gallery/contact).
   Approximates growon.kr's "blurred, still-visible desk behind a sliding panel" without
   re-rendering the full Three.js scene on every page (kept lightweight via a CSS gradient). */

.panel-page{ min-height:100vh; position:relative; overflow-x:hidden; }

.panel-backdrop{
  position:fixed; inset:0; z-index:0;
  background:
    radial-gradient(ellipse 900px 600px at 75% 10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
    var(--bg);
  filter: blur(0px); /* backdrop is a flat gradient approximation, not a literal blurred photo */
}

.panel-close{
  position:fixed; top:20px; left:20px; z-index:210;
  width:44px; height:44px; border-radius:50%;
  border:1px solid var(--rail); background:var(--bg-raised); color:var(--ink);
  font-size:18px; line-height:1;
}
.panel-close:hover{ color:var(--accent); border-color:var(--accent); }

.panel{
  position:relative; z-index:5; max-width:860px; margin:0 auto;
  padding:96px 28px 80px;
  animation: panel-in .5s ease both;
}
@keyframes panel-in{
  from{ opacity:0; transform:translateY(18px); }
  to{ opacity:1; transform:translateY(0); }
}

.panel-eyebrow{
  font-family:var(--font-mono); font-size:12px; letter-spacing:.09em; text-transform:uppercase;
  color:var(--ink-dim); display:block; margin-bottom:10px;
}
.panel h1{
  font-family:var(--font-display); font-weight:700; font-size:clamp(30px,5vw,52px); color:var(--ink);
  margin-bottom:28px;
}
.panel h2{
  font-family:var(--font-display); font-weight:600; font-size:22px; color:var(--ink);
  margin:36px 0 12px;
}
.panel p{ color:var(--ink-dim); font-size:16px; line-height:1.7; max-width:70ch; }
.panel a.inline-link{ color:var(--accent-2); font-weight:500; }
.panel a.inline-link:hover{ text-decoration:underline; }

.card-grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
.card{
  border:1px solid var(--rail); background:var(--bg-raised); padding:20px;
  border-radius:4px;
}
.card h3{ font-family:var(--font-display); font-size:18px; margin-bottom:8px; color:var(--ink); }
.card .tags{ font-family:var(--font-mono); font-size:12px; color:var(--ink-dim); margin-top:10px; display:block; }

.fact-row{ display:flex; flex-direction:column; gap:6px; padding:16px 0; border-bottom:1px solid var(--rail); }
.fact-row strong{ font-family:var(--font-mono); font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--accent); }

@media (max-width:720px){
  .card-grid{ grid-template-columns:1fr; }
  .panel{ padding-top:84px; }
}
```

- [ ] **Step 2: Write `assets/js/panel.js`**

```js
// assets/js/panel.js — shared behavior for destination pages.
(function () {
  'use strict';

  function initPanelChrome() {
    var savedTheme = window.localStorage.getItem('resumeTheme');
    if (savedTheme === 'cyberpunk' || savedTheme === 'desk-lamp') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    var navToggle = document.getElementById('nav-toggle');
    var cornerNav = document.getElementById('corner-nav');
    if (navToggle && cornerNav) {
      navToggle.addEventListener('click', function () {
        var open = cornerNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    var closeBtn = document.getElementById('panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        window.location.href = 'index.html';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initPanelChrome);
})();
```

- [ ] **Step 3: Verify with a throwaway test page, then delete it**

Create a temporary `assets/__panel-test.html`:

```html
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="css/theme.css"><link rel="stylesheet" href="css/panel.css"></head>
<body class="panel-page">
<div class="panel-backdrop"></div>
<button id="panel-close" class="panel-close" type="button">×</button>
<nav id="corner-nav"><button id="nav-toggle" type="button">Menu</button><ul id="nav-list"><li><a href="#">Test</a></li></ul></nav>
<main class="panel"><span class="panel-eyebrow">Test</span><h1>Panel Chrome Test</h1><p>If this is styled and the × button + menu work, panel.css/panel.js are correct.</p></main>
<script src="js/panel.js"></script>
</body></html>
```

Navigate to it via `mcp__claude-in-chrome`, screenshot — expect dark-themed styled panel with heading/paragraph and a working × button (click it; since there's no `index.html` two levels up from this path, expect a 404 — that's fine, we're only confirming the click handler fires and redirects).

- [ ] **Step 4: Delete the throwaway test file**

```bash
rm "assets/__panel-test.html"
```

- [ ] **Step 5: Commit**

```bash
git add assets/css/panel.css assets/js/panel.js
git commit -m "Add shared panel-page chrome: backdrop, close button, nav sync, theme persistence"
```

---

## Task 12: about.html — About + Experience content

**Files:**
- Create: `about.html`

**Interfaces:**
- Consumes: `assets/css/theme.css`, `assets/css/panel.css`, `assets/js/panel.js` from Tasks 1 and 11.

- [ ] **Step 1: Write `about.html`**, porting the About paragraph/facts and the one Experience entry verbatim from the content documented in `PRODUCT.md` (branch `updates`):

```html
<!DOCTYPE html>
<html lang="en" data-theme="desk-lamp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>About — Danish Ahmed N F</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/panel.css">
</head>
<body class="panel-page">
<div class="panel-backdrop"></div>
<button id="panel-close" class="panel-close" type="button" aria-label="Back to desk">×</button>

<nav id="corner-nav" aria-label="Section navigation">
  <button id="nav-toggle" aria-expanded="false" aria-controls="nav-list" type="button">Menu<span class="sr-only"> (section navigation)</span></button>
  <ul id="nav-list">
    <li><a href="about.html">About</a></li>
    <li><a href="education.html">Education &amp; Skills</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="accomplishments.html">Accomplishments</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
  </ul>
</nav>

<main class="panel">
  <span class="panel-eyebrow">About</span>
  <h1>The person behind the desk.</h1>

  <p>Computer Science student with a data analytics focus, skilled in Python, SQL, and
  full-stack development. I've built and deployed production-style analytics platforms
  processing real government and financial datasets, looking for an internship or
  entry-level role applying these skills in IT or banking.</p>

  <div class="fact-row">
    <strong>Currently</strong>
    <span>MSc Information Technology, Sri Ramakrishna College of Arts &amp; Science (2025–27)</span>
  </div>
  <div class="fact-row">
    <strong>Focus areas</strong>
    <span>Data pipelines, full-stack dashboards, applied ML (RAG, segmentation, embeddings)</span>
  </div>
  <div class="fact-row">
    <strong>Languages known</strong>
    <span>English, Tamil, Hindi, Urdu</span>
  </div>

  <h2>Experience</h2>
  <div class="fact-row">
    <strong>2022 — Present</strong>
    <span><strong style="color:var(--ink); font-family:var(--font-display); font-weight:600;">Sales Associate (Part-time)</strong> — Codak Pharmaceuticals OPC Private Limited</span>
  </div>
  <p>Handled company accounts and boosted sales across my assigned region. Built a well-run
  work environment that promoted critical thinking among co-workers, and pushed on-time
  performance that improved overall sales figures.</p>

  <p style="margin-top:36px;">
    <a class="inline-link" href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Download full resume (PDF) ↗<span class="sr-only"> (opens in new tab)</span></a>
  </p>
</main>

<script src="assets/js/panel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify content and navigation**

Navigate to `file:///D:/Projects/Danish Resume/Resume/about.html`, screenshot. Expected: styled panel with About text, Experience entry, and a resume PDF link, matching the source content in `PRODUCT.md` exactly (spot-check the MSc dates, the employer name, and the languages list against `PRODUCT.md`'s "Evidence on Hand" / "Education" section).

Click the × close button — expect navigation to `index.html`. Navigate back to `about.html`, click the resume PDF link — expect the PDF to open (verify via `tabs_context_mcp` that a new tab opened, or check no console error if it 404s due to filename casing — if so, fix the href to match the exact on-disk filename).

- [ ] **Step 3: Commit**

```bash
git add about.html
git commit -m "Add about.html: About + Experience content"
```

---

## Task 13: education.html — Education + Skills content

**Files:**
- Create: `education.html`

**Interfaces:**
- Consumes: same shared chrome as Task 12.

- [ ] **Step 1: Write `education.html`**, porting all 4 education entries and all 4 skill-line legends verbatim from `PRODUCT.md` / the current site's Skills section:

```html
<!DOCTYPE html>
<html lang="en" data-theme="desk-lamp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Education &amp; Skills — Danish Ahmed N F</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/panel.css">
</head>
<body class="panel-page">
<div class="panel-backdrop"></div>
<button id="panel-close" class="panel-close" type="button" aria-label="Back to desk">×</button>

<nav id="corner-nav" aria-label="Section navigation">
  <button id="nav-toggle" aria-expanded="false" aria-controls="nav-list" type="button">Menu<span class="sr-only"> (section navigation)</span></button>
  <ul id="nav-list">
    <li><a href="about.html">About</a></li>
    <li><a href="education.html">Education &amp; Skills</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="accomplishments.html">Accomplishments</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
  </ul>
</nav>

<main class="panel">
  <span class="panel-eyebrow">Education &amp; Skills</span>
  <h1>What I studied, what I use.</h1>

  <h2>Education</h2>
  <div class="fact-row">
    <strong>2025 — 2027</strong>
    <span>Master of Science in Information Technology — Sri Ramakrishna College of Arts &amp; Science</span>
  </div>
  <div class="fact-row">
    <strong>2025 — 2026</strong>
    <span>Post Graduate Diploma in Advanced Computing — Sri Ramakrishna College of Arts &amp; Science</span>
  </div>
  <div class="fact-row">
    <strong>2022 — 2025</strong>
    <span>B.Sc Computer Science with Data Analytics — Sri Ramakrishna College of Arts &amp; Science</span>
  </div>
  <div class="fact-row">
    <strong>2021 — 2022 · HSC &nbsp;|&nbsp; 2019 — 2020 · SSC</strong>
    <span>Perks Matriculation Higher Secondary School</span>
  </div>

  <h2>Skills</h2>
  <div class="card-grid">
    <div class="card">
      <h3 style="color:var(--thread-amber)">Programming</h3>
      <span class="tags">Python · JavaScript · C / C++ · HTML</span>
    </div>
    <div class="card">
      <h3 style="color:var(--thread-blue)">Web &amp; Backend</h3>
      <span class="tags">Flask · REST APIs · React · Vite / Tailwind</span>
    </div>
    <div class="card">
      <h3 style="color:var(--thread-violet)">Data &amp; ML</h3>
      <span class="tags">PyTorch · Sentence Transformers · FAISS · Pandas / NumPy</span>
    </div>
    <div class="card">
      <h3 style="color:var(--thread-teal)">Databases &amp; Tools</h3>
      <span class="tags">PostgreSQL · MySQL · Git / Linux · Docker</span>
    </div>
  </div>
</main>

<script src="assets/js/panel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify content**

Navigate to `education.html`, screenshot. Expected: all 4 education entries and all 4 skill cards visible, colors matching the amber/blue/violet/teal thread colors. Cross-check every date and item against `PRODUCT.md`.

- [ ] **Step 3: Commit**

```bash
git add education.html
git commit -m "Add education.html: Education + Skills content"
```

---

## Task 14: projects.html — all 7 projects

**Files:**
- Create: `projects.html`

**Interfaces:**
- Consumes: same shared chrome as Task 12.

- [ ] **Step 1: Write `projects.html`**, porting all 7 project entries (title, full description, tags, live links where present) verbatim from `PRODUCT.md` / the current site's Projects section:

```html
<!DOCTYPE html>
<html lang="en" data-theme="desk-lamp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Projects — Danish Ahmed N F</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/panel.css">
<style>
  .proj{ padding:22px 0; border-bottom:1px solid var(--rail); }
  .proj h3{ font-family:var(--font-display); font-size:20px; color:var(--ink); margin-bottom:8px; }
  .proj p{ margin-bottom:10px; }
  .proj .tags{ font-family:var(--font-mono); font-size:12px; color:var(--ink-dim); display:block; margin-bottom:8px; }
</style>
</head>
<body class="panel-page">
<div class="panel-backdrop"></div>
<button id="panel-close" class="panel-close" type="button" aria-label="Back to desk">×</button>

<nav id="corner-nav" aria-label="Section navigation">
  <button id="nav-toggle" aria-expanded="false" aria-controls="nav-list" type="button">Menu<span class="sr-only"> (section navigation)</span></button>
  <ul id="nav-list">
    <li><a href="about.html">About</a></li>
    <li><a href="education.html">Education &amp; Skills</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="accomplishments.html">Accomplishments</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
  </ul>
</nav>

<main class="panel" style="max-width:920px;">
  <span class="panel-eyebrow">Projects</span>
  <h1>Real, deployed, verifiable.</h1>

  <div class="proj">
    <h3>RBI Banking Infrastructure &amp; Digital Payments Analytics Platform</h3>
    <p>Full-stack analytics platform ingesting RBI's monthly banking statistics (ATM, PoS,
    card, digital payments) through a structural ETL pipeline into PostgreSQL, served via a
    Flask API to a React dashboard. The parser validates every import against RBI's own
    published totals with no code changes needed for future months. Includes JWT auth with
    role-based access, bank comparison/ranking tools, and market-concentration analytics.
    Validated against RBI's April 2026 data: 63 banks, all 26 metrics reconciled exactly.</p>
    <span class="tags">React · Flask · PostgreSQL · Docker · JWT — Web &amp; Backend / Databases &amp; Tools</span>
    <a class="inline-link" href="https://rbi-card-usage-analytics.vercel.app" target="_blank" rel="noopener">View live →<span class="sr-only"> (opens in new tab)</span></a>
  </div>

  <div class="proj">
    <h3>Unified Dashboard — Election Data Hub</h3>
    <p>Static web dashboard visualizing self-declared financial data (bank accounts, assets,
    loans) of State Legislative Assembly candidates across India, sourced from Election
    Commission affidavit filings via MyNeta. Covers 15 states/UTs live with 15,000+ candidate
    records indexed across 28+ states, with an interactive state-wise map, constituency
    drill-downs, and party/bank-level views.</p>
    <span class="tags">HTML · CSS · JavaScript — Programming</span>
    <a class="inline-link" href="https://danishkfd.github.io/Unified-Dashboard/hub.html" target="_blank" rel="noopener">View live →<span class="sr-only"> (opens in new tab)</span></a>
  </div>

  <div class="proj">
    <h3>GemTutor</h3>
    <p>Full-stack RAG-powered chatbot answering Maths, Science, and Social Science questions
    using Samacheer Kalvi textbook content. A retrieval pipeline built on Sentence
    Transformers embeddings and a FAISS vector index fetches relevant textbook chunks, then
    generates grounded answers via the Google Gemini API through subject-aware prompts, with
    simple/detailed explanation modes and a one-click "simplify" feature for re-explaining
    answers in easier language.</p>
    <span class="tags">Python · Flask · FAISS · Sentence Transformers · Gemini API — Programming / Web &amp; Backend / Data &amp; ML</span>
  </div>

  <div class="proj">
    <h3>Satellite Map Classification &amp; Image Captioning</h3>
    <p>Two-stage deep learning pipeline on the DeepGlobe land-cover dataset: a DeepLabV3+
    segmentation model (ResNet-50 encoder, ImageNet-pretrained) trained in PyTorch to
    classify satellite imagery into six land-cover classes, integrated with a BLIP captioning
    model to auto-generate natural-language descriptions of the segmented land composition.
    Trained with a combined Dice + BCE loss and mixed-precision for stability and speed.</p>
    <span class="tags">PyTorch · segmentation-models-pytorch · Hugging Face (BLIP) · OpenCV — Data &amp; ML</span>
  </div>

  <div class="proj">
    <h3>EDA in a Pharma Company</h3>
    <p>Exploratory data analytics for a pharmaceutical company, surfacing key insights used
    to boost sales figures, along with growth trajectories and possible vulnerabilities in
    the business.</p>
    <span class="tags">Python · Pandas · NumPy — Programming / Data &amp; ML</span>
  </div>

  <div class="proj">
    <h3>Re-store</h3>
    <p>A small e-commerce platform built to form a local community around the re-use and
    sale of surplus goods.</p>
    <span class="tags">React · Vite · Tailwind — Web &amp; Backend</span>
  </div>

  <div class="proj" style="border-bottom:none;">
    <h3>Repo Reviewer</h3>
    <p>Node.js/Express web app that analyzes any public GitHub repository using Google's
    Gemini API, generating an AI summary, tech-stack breakdown, and actionable code
    improvement suggestions with full file diffs. Integrates with the GitHub Contents API to
    auto-create branches and open pull requests for selected changes.</p>
    <span class="tags">Node.js · Express · Gemini API · GitHub API — Web &amp; Backend / Data &amp; ML / Databases &amp; Tools</span>
  </div>
</main>

<script src="assets/js/panel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify all 7 projects and both live links**

Navigate to `projects.html`, screenshot, scroll down and screenshot again to see all 7. Cross-check every project title, description, tag list, and the two "View live" URLs (`rbi-card-usage-analytics.vercel.app`, `danishkfd.github.io/Unified-Dashboard/hub.html`) against `PRODUCT.md` for exact accuracy — these are the verifiable-claims links that PRODUCT.md flags as core credibility signals, so they must be byte-exact.

- [ ] **Step 3: Commit**

```bash
git add projects.html
git commit -m "Add projects.html: all 7 projects with live links"
```

---

## Task 15: accomplishments.html — Certifications content

**Files:**
- Create: `accomplishments.html`

**Interfaces:**
- Consumes: same shared chrome as Task 12.

- [ ] **Step 1: Write `accomplishments.html`**, porting the 3 certifications verbatim:

```html
<!DOCTYPE html>
<html lang="en" data-theme="desk-lamp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Accomplishments — Danish Ahmed N F</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/panel.css">
</head>
<body class="panel-page">
<div class="panel-backdrop"></div>
<button id="panel-close" class="panel-close" type="button" aria-label="Back to desk">×</button>

<nav id="corner-nav" aria-label="Section navigation">
  <button id="nav-toggle" aria-expanded="false" aria-controls="nav-list" type="button">Menu<span class="sr-only"> (section navigation)</span></button>
  <ul id="nav-list">
    <li><a href="about.html">About</a></li>
    <li><a href="education.html">Education &amp; Skills</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="accomplishments.html">Accomplishments</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
  </ul>
</nav>

<main class="panel">
  <span class="panel-eyebrow">Accomplishments</span>
  <h1>Certifications on the shelf.</h1>

  <div class="card-grid" style="grid-template-columns:1fr;">
    <div class="card">
      <h3>TCS ION Industry Honor Course — Data Mining and Warehousing</h3>
    </div>
    <div class="card">
      <h3>TCS ION Industry Honor Course — Data Modeling and Visualization</h3>
    </div>
    <div class="card">
      <h3>Introduction to MongoDB</h3>
      <span class="tags">MongoDB</span>
    </div>
  </div>
</main>

<script src="assets/js/panel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify content**

Navigate to `accomplishments.html`, screenshot. Expected: all 3 certifications visible, matching `PRODUCT.md`'s Certifications list exactly.

- [ ] **Step 3: Commit**

```bash
git add accomplishments.html
git commit -m "Add accomplishments.html: certifications content"
```

---

## Task 16: gallery.html — Extracurriculars content

**Files:**
- Create: `gallery.html`

**Interfaces:**
- Consumes: same shared chrome as Task 12.

- [ ] **Step 1: Write `gallery.html`**, porting the 3 extracurricular memberships verbatim, presented as a small card gallery:

```html
<!DOCTYPE html>
<html lang="en" data-theme="desk-lamp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Gallery — Danish Ahmed N F</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/panel.css">
</head>
<body class="panel-page">
<div class="panel-backdrop"></div>
<button id="panel-close" class="panel-close" type="button" aria-label="Back to desk">×</button>

<nav id="corner-nav" aria-label="Section navigation">
  <button id="nav-toggle" aria-expanded="false" aria-controls="nav-list" type="button">Menu<span class="sr-only"> (section navigation)</span></button>
  <ul id="nav-list">
    <li><a href="about.html">About</a></li>
    <li><a href="education.html">Education &amp; Skills</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="accomplishments.html">Accomplishments</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
  </ul>
</nav>

<main class="panel">
  <span class="panel-eyebrow">Gallery</span>
  <h1>Where I show up outside class.</h1>
  <p>A short list of the communities and clubs I'm part of.</p>

  <div class="card-grid" style="grid-template-columns:1fr 1fr 1fr; margin-top:24px;">
    <div class="card"><h3>Coimbatore Quiz Club</h3><span class="tags">Member</span></div>
    <div class="card"><h3>Omni Book Club</h3><span class="tags">Member</span></div>
    <div class="card"><h3>Programming Club</h3><span class="tags">Member</span></div>
  </div>
</main>

<script src="assets/js/panel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify content**

Navigate to `gallery.html`, screenshot. Expected: 3 cards for the 3 clubs, matching `PRODUCT.md`'s Extracurriculars list exactly.

- [ ] **Step 3: Commit**

```bash
git add gallery.html
git commit -m "Add gallery.html: extracurriculars content"
```

---

## Task 17: contact.html — Contact links + resume PDF

**Files:**
- Create: `contact.html`

**Interfaces:**
- Consumes: same shared chrome as Task 12.

- [ ] **Step 1: Write `contact.html`**, porting the contact links verbatim. This is link-based (email/phone/LinkedIn/resume), not a fillable form — there is no backend to receive form submissions, so a growon-style contact form would be non-functional UI; this matches the current site's existing, working terminus-section approach:

```html
<!DOCTYPE html>
<html lang="en" data-theme="desk-lamp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Contact — Danish Ahmed N F</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/panel.css">
<style>
  .contact-link{
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 4px; border-bottom:1px solid var(--rail);
    font-family:var(--font-mono); font-size:15px; color:var(--ink);
  }
  .contact-link:hover{ color:var(--accent); }
</style>
</head>
<body class="panel-page">
<div class="panel-backdrop"></div>
<button id="panel-close" class="panel-close" type="button" aria-label="Back to desk">×</button>

<nav id="corner-nav" aria-label="Section navigation">
  <button id="nav-toggle" aria-expanded="false" aria-controls="nav-list" type="button">Menu<span class="sr-only"> (section navigation)</span></button>
  <ul id="nav-list">
    <li><a href="about.html">About</a></li>
    <li><a href="education.html">Education &amp; Skills</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="accomplishments.html">Accomplishments</a></li>
    <li><a href="gallery.html">Gallery</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Resume PDF ↗<span class="sr-only"> (opens in new tab)</span></a></li>
  </ul>
</nav>

<main class="panel">
  <span class="panel-eyebrow">Contact</span>
  <h1>Open to internships<br>and entry-level roles.</h1>

  <a class="contact-link" href="mailto:ndanishahmed@gmail.com">ndanishahmed@gmail.com →</a>
  <a class="contact-link" href="tel:+917558133301">+91 75581 33301 →</a>
  <a class="contact-link" href="https://www.linkedin.com/in/danish-ahmed-nf-b39649249/" target="_blank" rel="noopener">LinkedIn →<span class="sr-only"> (opens in new tab)</span></a>
  <a class="contact-link" href="Danish%20ahmed%20N%20F%20Resume.pdf" target="_blank" rel="noopener">Full Resume (PDF) →<span class="sr-only"> (opens in new tab)</span></a>
</main>

<script src="assets/js/panel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify content and links**

Navigate to `contact.html`, screenshot. Expected: 4 contact links visible. Verify `mailto:`, `tel:`, LinkedIn URL, and the resume PDF link exactly match `PRODUCT.md`'s Brand Commitments section (email, phone, LinkedIn URL).

- [ ] **Step 3: Commit**

```bash
git add contact.html
git commit -m "Add contact.html: contact links + resume PDF"
```

---

## Task 18: Mobile responsiveness pass

**Files:**
- Modify: `assets/css/theme.css`
- Modify: `assets/css/panel.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: everything from Tasks 1–17.

- [ ] **Step 1: Add a mobile breakpoint to `assets/css/theme.css`**, appended at the end:

```css
@media (max-width:720px){
  .hero-overlay{ top:36px; }
  .hero-overlay h1{ font-size:clamp(26px,8vw,40px); }
  .tagline{ font-size:13px; padding:0 8px; }
  #theme-toggle{ top:auto; bottom:20px; left:20px; font-size:11px; padding:9px 12px; }
  #corner-nav{ top:16px; right:16px; }
  .scene-hint{ bottom:84px; }
}
```

- [ ] **Step 2: Cap the Three.js render resolution more aggressively on narrow viewports**

Modify `assets/js/scene.js`'s `initScene()` from Task 3 — replace the `renderer.setPixelRatio(...)` line with:

```js
    var pixelRatioCap = window.innerWidth < 720 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
```

- [ ] **Step 3: Verify mobile layout**

Use `mcp__claude-in-chrome__resize_window` (or equivalent) to set the viewport to 390×844 (a common mobile size). Navigate to `index.html`, screenshot. Expected: headline/tagline readable and not overflowing, theme toggle relocated to bottom-left so it doesn't collide with the corner nav, desk scene still visible and objects still tappable (spot-check by tapping the laptop's approximate screen position and confirming navigation still fires).

Resize back to a desktop width (e.g. 1440×900) and confirm the desktop layout from earlier tasks is unaffected.

- [ ] **Step 4: Commit**

```bash
git add assets/css/theme.css assets/js/scene.js
git commit -m "Add mobile breakpoint and lower pixel-ratio cap for narrow viewports"
```

---

## Task 19: Full verification pass, impeccable polish + doc rewrite, final commit

**Files:**
- Modify: `DESIGN.md`, `PRODUCT.md`, `.impeccable/design.json` (rewritten to document the new design)
- No other files expected to change unless the verification pass in Step 1 surfaces a real bug

**Interfaces:**
- Consumes: the complete site from Tasks 1–18.

- [ ] **Step 1: Full click-through verification across the whole site**

Using `mcp__claude-in-chrome`, starting from a fresh `index.html` load with `localStorage.clear()`:
1. Click every one of the 10 desk objects in turn (lamp, plant, duck, pen, laptop, notebook, mug, trophy, frame, figurine), returning to `index.html` between doorway clicks, confirming each of the 6 doorways lands on its correct, now-existing destination page with real content (no more 404s, since Tasks 12–17 created every target).
2. On each destination page, click the × close button and confirm it returns to `index.html`.
3. Click the corner "Menu" button on `index.html` and on at least 2 destination pages; confirm all 7 links (6 sections + resume PDF) are present and correct.
4. Toggle Cyberpunk mode on `index.html`, then navigate to a destination page via a doorway click; confirm the destination page picked up the Cyberpunk theme via the `localStorage` sync from Task 11. Toggle back to Desk Lamp.
5. Check `read_console_messages` with `pattern: "error|Error"` on at least 3 different pages — expect no matches anywhere.

Fix and commit separately (`fix: <description>`) anything broken before continuing — do not proceed to Step 2 with known bugs.

- [ ] **Step 2: Reduced-motion pass**

Use `javascript_tool` to force `prefers-reduced-motion` where the test harness allows, or reason from the code: grep every animation-triggering function in `scene.js` (`toggleLamp`, plant/duck/pen click handlers, all 6 doorway `*AndGo` functions, `updateParallax`, `setTheme`'s glitch class) for an `if (reduceMotion)` guard. Expected: every one has it (this was built in at each task, not retrofitted — confirm none were missed).

- [ ] **Step 3: No-WebGL fallback check**

Use `javascript_tool` to monkey-patch `HTMLCanvasElement.prototype.getContext` to return `null` before `scene.js` runs (or simulate by temporarily renaming the Three.js `<script>` src in a scratch copy of `index.html` opened separately), reload, screenshot. Expected: `#fallback` card visible with working nav links and resume PDF link, `#scene-root` hidden, no thrown/uncaught errors in console.

- [ ] **Step 4: Keyboard-only pass**

Use `computer` `key` action to `Tab` through `index.html` from the top of the page. Expected order roughly: theme toggle → nav-toggle button → (once expanded or via focus-within) the 7 nav links. Confirm every link is reachable and that `Enter` activates them, without ever needing to interact with the canvas.

- [ ] **Step 5: Invoke the `impeccable` skill for a polish/critique pass**

Run the `impeccable` skill against the completed site to get a rigorous design critique (per the spec's stated intent to avoid generic AI-slop styling) and to regenerate `DESIGN.md`, `PRODUCT.md`, and `.impeccable/design.json` documenting this new design, superseding the Data Line docs that exist on this branch. Apply any polish fixes it surfaces, then re-run the relevant parts of Steps 1–4 for anything it touched.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Complete 3D desk-scene resume redesign

Full click-through, reduced-motion, no-WebGL fallback, and keyboard
navigation verified across all 7 pages. Design docs regenerated via
the impeccable skill to document the new desk-scene design.
EOF
)"
```

- [ ] **Step 7: Report status to the user**

Summarize: branch name (`3d-desk-redesign`), what was built, that the live site at `danishkfd.in` is untouched, and that merging/deploying is a separate decision for the user to make explicitly (per the "confirm before pushing/publishing shared state" rule) — do not push or open a PR without being asked.
