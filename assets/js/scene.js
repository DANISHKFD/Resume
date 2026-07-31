// assets/js/scene.js — 3D desk scene for the resume site.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // canAnimate gates every gsap.* call in the object factories below. It is false
  // whenever reduceMotion is set (so reduced-motion still collapses to instant
  // end-states) and also false if the GSAP CDN script failed to load — in that case
  // every click handler falls back to the same instant end-state path instead of
  // throwing a ReferenceError mid-handler (which used to leave the object's
  // opened/clicked latch stuck true with no navigation ever happening).
  var canAnimate = !reduceMotion && typeof gsap !== 'undefined';

  // Same graceful-degrade pattern as canAnimate above: if the GLTFLoader CDN script
  // failed, gltfLoader stays null and loadModel() below just logs and skips — the
  // mug/plant/laptop/trophy groups stay registered as interactive but empty, which
  // only matters if this specific CDN is unreachable (the corner nav still reaches
  // every section regardless).
  var gltfLoader = (typeof THREE !== 'undefined' && THREE.GLTFLoader) ? new THREE.GLTFLoader() : null;

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
      lampIntensity: 1.5,
      ambientColor: 0x362a1e,
      ambientIntensity: 0.85,
      bgColor: 0x201812,
      deskColor: 0x4a3626,
      fillColor: 0x8fa0bd
    },
    'cyberpunk': {
      lampColor: 0x1fe5f0,
      lampIntensity: 1.7,
      ambientColor: 0x342c10,
      ambientIntensity: 0.7,
      bgColor: 0x1c1a08,
      deskColor: 0x14140a,
      fillColor: 0x9a6fd0
    }
  };

  var storedTheme = null;
  try { storedTheme = window.localStorage.getItem('resumeTheme'); } catch (e) { storedTheme = null; }
  var currentTheme = (storedTheme === 'cyberpunk' || storedTheme === 'desk-lamp')
    ? storedTheme
    : (document.documentElement.getAttribute('data-theme') || 'desk-lamp');
  document.documentElement.setAttribute('data-theme', currentTheme);

  // The theme-toggle button's aria-pressed ships hard-coded "false" in the markup;
  // sync it to a stored Cyberpunk preference here so assistive tech doesn't announce
  // "not pressed" on a page that already loaded in Cyberpunk mode.
  var initialThemeToggle = document.getElementById('theme-toggle');
  if (initialThemeToggle) initialThemeToggle.setAttribute('aria-pressed', currentTheme === 'cyberpunk' ? 'true' : 'false');

  var scene, camera, renderer, deskGroup, lampLight, ambientLight, fillLight, lampBulbMat;
  var basecameraPos, targetParallax, currentParallax; // initialized in initScene() to ensure defined before animate()
  var clock = new THREE.Clock();
  var interactives = []; // populated by later tasks: meshes with userData.interactive = true
  var resetters = []; // one-shot doorway/decorative objects push a closure here that restores
                       // their opened/clicked flag + idle visual pose; run on bfcache restore

  try {
    initScene();
    animate();
    // Only scope the body's overflow:hidden (see index.html's inline <style>) to a
    // confirmed-successful render — never add this before a possible throw, otherwise
    // a failed init could leave scroll suppressed on top of the fallback card.
    document.body.classList.add('scene-active');
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
    var pixelRatioCap = window.innerWidth < 720 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    ambientLight = new THREE.AmbientLight(theme.ambientColor, theme.ambientIntensity);
    scene.add(ambientLight);

    lampLight = new THREE.PointLight(theme.lampColor, theme.lampIntensity, 20, 1.5);
    lampLight.position.set(2.1, 3.6, 1.2);
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    scene.add(lampLight);

    // Neutral fill from the opposite corner — keeps the desk lamp as the visual
    // focal point while lifting the far side of the desk (trophy, frame, figurine)
    // to a legible brightness, so every clickable object stays findable at a glance.
    // Independent of the lamp toggle: it reads as ambient room light, not the lamp.
    fillLight = new THREE.DirectionalLight(theme.fillColor, 1.1);
    fillLight.position.set(-5, 6, -4);
    scene.add(fillLight);

    deskGroup = new THREE.Group();
    scene.add(deskGroup);

    var deskGeo = new THREE.BoxGeometry(8.4, 0.3, 4.6);
    var deskMat = new THREE.MeshStandardMaterial({ color: theme.deskColor, roughness: 0.75, metalness: 0.1 });
    var desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, -0.15, 0);
    desk.receiveShadow = true;
    deskGroup.add(desk);

    window.addEventListener('resize', onResize);

    // Initialize parallax state — must be here, before animate() is first called.
    basecameraPos = camera.position.clone();
    targetParallax = { x: 0, y: 0 };
    currentParallax = { x: 0, y: 0 };

    if (!reduceMotion) {
      window.addEventListener('mousemove', function (evt) {
        targetParallax.x = (evt.clientX / window.innerWidth - 0.5) * 0.6;
        targetParallax.y = (evt.clientY / window.innerHeight - 0.5) * 0.3;
      });
    }
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function updateParallax() {
    if (reduceMotion) return;
    currentParallax.x += (targetParallax.x - currentParallax.x) * 0.04;
    currentParallax.y += (targetParallax.y - currentParallax.y) * 0.04;
    camera.position.x = basecameraPos.x + currentParallax.x;
    camera.position.y = basecameraPos.y - currentParallax.y;
    camera.lookAt(0, 1, 0);
  }

  function animate() {
    requestAnimationFrame(animate);
    updateParallax();
    renderer.render(scene, camera);
  }

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
    // Browsers synthesize a 'click' event ~300ms after 'touchend'. Without
    // suppressing it, every tap would run the raycaster click handler twice — one-shot
    // doorway objects absorb that harmlessly via their latch, but the lamp's toggle
    // has no latch, so it would switch on then immediately back off on every tap,
    // making the lamp a no-op on touch devices. touchend below calls preventDefault()
    // to stop the synthesized click from ever firing.
    if (evt.type === 'touchend') evt.preventDefault();
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
  // { passive: false } is required for preventDefault() (above) to actually suppress
  // the browser's synthesized click event that follows touchend.
  renderer.domElement.addEventListener('touchend', onPointerClick, { passive: false });

  function navigateAfter(href, delayMs) {
    if (reduceMotion) {
      window.location.href = href;
      return;
    }
    window.setTimeout(function () {
      window.location.href = href;
    }, delayMs);
  }

  // Browsers restore this page from bfcache on back-navigation with JS state fully
  // intact, so one-shot doorway objects (laptop, notebook, mug, trophy, frame,
  // figurine, ...) would otherwise stay permanently "opened" — both their latch flag
  // and their end-state visual pose — and never respond to a second click.
  window.addEventListener('pageshow', function (evt) {
    if (evt.persisted) resetters.forEach(function (reset) { reset(); });
  });

  // ---------- Interaction sound ----------
  // Synthesized via Web Audio (oscillators + a noise buffer) rather than sound
  // files — same "built from primitives, nothing external" spirit as the desk
  // objects themselves. Every sound is a direct result of a click, so it never
  // runs into autoplay restrictions and never surprises a visitor on page load.
  var soundMuted = false;
  try { soundMuted = window.localStorage.getItem('resumeSoundMuted') === 'true'; } catch (e) { soundMuted = false; }
  var audioCtx = null;

  function ensureAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, opts) {
    if (soundMuted) return;
    var ctx = ensureAudioCtx();
    if (!ctx) return;
    opts = opts || {};
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), ctx.currentTime + duration);
    var peak = opts.gain != null ? opts.gain : 0.1;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  function playNoiseSwell(duration, freq) {
    if (soundMuted) return;
    var ctx = ensureAudioCtx();
    if (!ctx) return;
    var length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / length); }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 2200;
    filter.Q.value = 0.7;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
  }

  function playClick() { playTone(720, 0.06, { type: 'square', gain: 0.05, freqEnd: 420 }); }
  function playTap() { playTone(520, 0.12, { type: 'sine', gain: 0.07, freqEnd: 340 }); }
  function playChime() { playTone(1046, 0.35, { type: 'sine', gain: 0.09 }); playTone(1568, 0.3, { type: 'sine', gain: 0.045 }); }
  function playPop(up) { playTone(up ? 300 : 220, 0.12, { type: 'sine', gain: 0.08, freqEnd: up ? 520 : 140 }); }
  function playPaper() { playNoiseSwell(0.22, 2200); }
  function playThud() { playTone(90, 0.18, { type: 'sine', gain: 0.12, freqEnd: 50 }); }

  function setSoundMuted(muted) {
    soundMuted = muted;
    try { window.localStorage.setItem('resumeSoundMuted', muted ? 'true' : 'false'); } catch (e) { /* storage unavailable */ }
  }

  // ---------- Imported models (mug, plant, laptop, trophy) ----------
  // These four objects use downloaded .glb models instead of hand-built primitive
  // geometry (contrast the lamp/duck/pen/notebook/frame/figurine below, which stay
  // procedural). Each source file arrives at its own arbitrary scale and pivot —
  // fitModelToDesk() normalizes both so every model can be dropped onto the desk's
  // y=0 surface (see buildLamp's own y=0 note) the same way a procedural group is.

  function loadModel(url, onLoad) {
    if (!gltfLoader) {
      console.error('GLTFLoader unavailable — skipping model load for', url);
      return;
    }
    gltfLoader.load(url, function (gltf) { onLoad(gltf.scene); }, undefined, function (err) {
      console.error('Failed to load model', url, err);
    });
  }

  // Rescales `model` uniformly so its size along the reference axis equals
  // `opts.target`, then recenters it on x/z and drops it so its lowest point sits
  // at local y=0 — the desk-surface baseline every procedural object is hand-placed
  // against. opts.axis: 'y' (default, for height-defined objects) or 'maxXZ' (for
  // footprint-defined objects like the laptop, whichever of x/z is wider).
  function fitModelToDesk(model, opts) {
    opts = opts || {};
    model.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    var reference = opts.axis === 'maxXZ' ? Math.max(size.x, size.z) : size.y;
    var scale = reference > 0 ? (opts.target || 1) / reference : 1;
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);
    box.setFromObject(model);
    var center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    return model;
  }

  // Turns on shadows for an imported model (procedural objects don't cast/receive —
  // see the shadowMap setup in initScene — but these four are the closest objects to
  // the lamp and worth the cost) and returns its unique materials, so callers like
  // the trophy's glint can animate every material a multi-material model actually has
  // instead of just the one goldMat a hand-built mesh used to expose.
  function prepareModel(model) {
    var materials = [];
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material && materials.indexOf(child.material) === -1) materials.push(child.material);
      }
    });
    return materials;
  }

  // A network-loaded model can pop in well after the rest of the desk has rendered;
  // fading it in (skipped entirely under reduced motion) reads as arriving on
  // purpose rather than a layout glitch.
  function fadeModelIn(materials) {
    if (!canAnimate) return;
    materials.forEach(function (mat) {
      var target = mat.opacity;
      mat.transparent = true;
      mat.opacity = 0;
      gsap.to(mat, {
        opacity: target, duration: 0.35, ease: 'power1.out',
        onComplete: function () { mat.transparent = false; }
      });
    });
  }

  var lampOn = true;

  function buildLamp() {
    var group = new THREE.Group();
    // y=0 matches the desk's actual top surface (BoxGeometry height 0.3 centered
    // at y=-0.15 puts the top face at y=0) — not the desk mesh's own center y,
    // which several objects here mistakenly copied, sinking them into the desk.
    group.position.set(2.1, 0, 1.2);

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

    // The arm used to be positioned with a fixed offset (0.55, 0.28, 0) after a
    // fixed rotation, which doesn't correspond to "start at the pivot and reach
    // the head" for any single position/rotation pair — the arm rendered as a
    // stick floating away from the pole's top, not connected to it. Deriving the
    // arm's transform from the actual pivot->head direction guarantees the near
    // end sits at the pivot regardless of where the head is placed.
    var headLocalPos = new THREE.Vector3(1.05, 0.5, 0); // relative to armPivot
    var armDir = headLocalPos.clone().normalize();
    var armLength = 1.4;
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, armLength, 12), poleMat);
    arm.position.copy(armDir.clone().multiplyScalar(armLength / 2));
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir);
    armPivot.add(arm);

    lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0x111111, emissive: THEMES[currentTheme].lampColor, emissiveIntensity: lampOn ? 1.4 : 0
    });
    var head = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.5, 20, 1, true), lampBulbMat);
    head.rotation.x = Math.PI;
    head.position.copy(headLocalPos);
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
    playClick();
    lampOn = !lampOn;
    var theme = THEMES[currentTheme];
    var targetLightIntensity = lampOn ? theme.lampIntensity : 0;
    var targetAmbient = lampOn ? theme.ambientIntensity : theme.ambientIntensity * 0.35;
    var targetEmissive = lampOn ? 1.4 : 0;

    if (!canAnimate) {
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

  function buildPlant() {
    var group = new THREE.Group();
    group.position.set(-3.4, 0, 0.6); // y=0 is the desk's top surface, see buildLamp
    var plantModel = null; // set once assets/models/house-plant.glb finishes loading

    deskGroup.add(group);

    loadModel('assets/models/house-plant.glb', function (model) {
      fitModelToDesk(model, { axis: 'y', target: 1.3 });
      var materials = prepareModel(model);
      group.add(model);
      fadeModelIn(materials);
      plantModel = model;
    });

    registerInteractive(group, group, {
      onClick: function () {
        playPaper();
        if (!canAnimate || !plantModel) return;
        gsap.to(plantModel.rotation, {
          z: plantModel.rotation.z + 0.18, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut'
        });
      }
    });
    return group;
  }

  function buildDuck() {
    var group = new THREE.Group();
    group.position.set(-1.6, 0, 1.6); // y=0 is the desk's top surface, see buildLamp

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
        playPop(true);
        if (!canAnimate) return;
        gsap.timeline()
          .to(group.scale, { y: 0.6, duration: 0.1, ease: 'power1.in' })
          .to(group.scale, { y: 1, duration: 0.35, ease: 'bounce.out' });
      }
    });
    return group;
  }

  function buildPen() {
    var group = new THREE.Group();
    var idlePos = { x: 3.2, y: -0.0, z: -1.2 };
    var idleRot = { x: 0, y: 0, z: 0 };
    group.position.set(idlePos.x, idlePos.y, idlePos.z);
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
        playTap();
        // Desk half-width is 4.2 on x (BoxGeometry(8.4,...)) — the fall must clear
        // that edge horizontally before dropping in y, or the pen visually sinks
        // through the solid desk slab instead of tumbling off its side.
        if (!canAnimate) {
          group.position.set(4.7, -1.6, -1.8);
          group.rotation.set(2.2, 1.1, 3.4);
          playThud();
          return;
        }
        gsap.timeline()
          .to(group.position, { x: 4.5, z: -1.5, duration: 0.25, ease: 'power1.out' })
          .to(group.position, { x: 4.7, y: -1.6, z: -1.8, duration: 0.45, ease: 'power2.in', onComplete: playThud });
        gsap.to(group.rotation, { x: 2.2, y: 1.1, z: 3.4, duration: 0.7, ease: 'power1.in' });
      }
    });

    resetters.push(function () {
      fallen = false;
      group.position.set(idlePos.x, idlePos.y, idlePos.z);
      group.rotation.set(idleRot.x, idleRot.y, idleRot.z);
    });

    return group;
  }

  function buildLaptop() {
    var group = new THREE.Group();
    group.position.set(0, 0, -0.4); // y=0 is the desk's top surface, see buildLamp
    var opened = false;
    var laptopModel = null;
    var restY = 0; // set once the model loads and fitModelToDesk settles its resting height

    deskGroup.add(group);

    group.rotation.y = 106 * Math.PI / 180;

    loadModel('assets/models/laptop.glb', function (model) {
      fitModelToDesk(model, { axis: 'maxXZ', target: 1.5 });
      restY = model.position.y;
      var materials = prepareModel(model);
      group.add(model);
      fadeModelIn(materials);
      laptopModel = model;
    });

    // The model is a single static pose (no hinge rig to animate open, unlike the
    // procedural lid this replaced), so the click feedback is a quick lift-and-settle
    // rather than the lid actually opening.
    function openAndGo() {
      if (opened) return;
      opened = true;
      playClick();
      if (!canAnimate || !laptopModel) {
        navigateAfter('projects.html', 0);
        return;
      }
      gsap.timeline()
        .to(laptopModel.position, { y: restY + 0.15, duration: 0.12, ease: 'power1.out' })
        .to(laptopModel.position, { y: restY, duration: 0.28, ease: 'bounce.out' });
      navigateAfter('projects.html', 450);
    }

    registerInteractive(group, group, { onClick: openAndGo });

    resetters.push(function () {
      opened = false;
      if (laptopModel) laptopModel.position.y = restY;
    });

    return group;
  }

  function buildNotebook() {
    var group = new THREE.Group();
    // x=0.6, not 1.1: the notebook's cover swings from its pivot at the group's
    // local x=0 out to local x=0.75 (world 1.85 at the old x=1.1), which overlapped
    // the lamp's base footprint (world x 1.74-2.46, z 0.84-1.56) — the two meshes
    // intersected and z-fought. Moved left to clear it with margin.
    group.position.set(0.6, 0, 1.4); // y=0 is the desk's top surface, see buildLamp
    var opened = false;

    // pages bottom used to sit at y=-0.01 — just below the desk's actual top
    // surface (y=0, see buildLamp) — so the two meshes overlapped and z-fought
    // right where the notebook touches the desk. Raised so pages/cover/desk each
    // have a clean, non-overlapping seam: pages rest just above the desk, and the
    // cover's pivot sits exactly on the pages' top face rather than through it.
    var pageMat = new THREE.MeshStandardMaterial({ color: 0xEFEAE0, roughness: 0.9 });
    var pages = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 1.0), pageMat);
    pages.position.set(0, 0.02, 0);
    group.add(pages);

    var coverMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.7 });
    var coverPivot = new THREE.Group();
    coverPivot.position.set(0, 0.035, 0); // pages' top face (0.02 + half-height 0.015)
    var cover = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 1.0), coverMat);
    cover.position.set(0.375, 0.02, 0); // half of cover's own height, resting on the pivot line
    coverPivot.add(cover);
    group.add(coverPivot);

    deskGroup.add(group);

    function openAndGo() {
      if (opened) return;
      opened = true;
      playPaper();
      if (!canAnimate) {
        coverPivot.rotation.z = Math.PI * 0.85;
        navigateAfter('education.html', 0);
        return;
      }
      gsap.to(coverPivot.rotation, { z: Math.PI * 0.85, duration: 0.5, ease: 'power2.out' });
      navigateAfter('education.html', 600);
    }

    registerInteractive(group, group, { onClick: openAndGo });

    resetters.push(function () {
      opened = false;
      coverPivot.rotation.z = 0; // idle angle set at build time (never explicitly set, defaults to 0)
    });

    return group;
  }

  function buildMug() {
    var group = new THREE.Group();
    group.position.set(-0.4, 0, 1.5); // y=0 is the desk's top surface, see buildLamp
    var clicked = false;

    loadModel('assets/models/coffee-cup.glb', function (model) {
      fitModelToDesk(model, { axis: 'y', target: 0.65 });
      var materials = prepareModel(model);
      group.add(model);
      fadeModelIn(materials);
    });

    var steamGroup = new THREE.Group();
    steamGroup.position.set(0, 0.65, 0);
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
      playTap();
      if (!canAnimate) {
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

    resetters.push(function () {
      clicked = false;
      steamPuffs.forEach(function (puff, i) {
        puff.position.set((i - 1) * 0.05, 0, 0);
        puff.material.opacity = 0;
      });
    });

    return group;
  }

  function buildTrophy() {
    var group = new THREE.Group();
    group.position.set(-2.6, 0, -1.1); // y=0 is the desk's top surface, see buildLamp
    var clicked = false;
    var trophyMaterials = []; // populated once assets/models/trophy.glb loads (gold cup + dark base, unlike the single goldMat this replaced)

    group.rotation.y = -Math.PI / 2;

    loadModel('assets/models/trophy.glb', function (model) {
      fitModelToDesk(model, { axis: 'y', target: 0.75 });
      var materials = prepareModel(model);
      group.add(model);
      fadeModelIn(materials);
      trophyMaterials = materials;
    });

    deskGroup.add(group);

    function glintAndGo() {
      if (clicked) return;
      clicked = true;
      playChime();
      if (!canAnimate) {
        trophyMaterials.forEach(function (mat) { mat.emissiveIntensity = 1; });
        navigateAfter('accomplishments.html', 0);
        return;
      }
      trophyMaterials.forEach(function (mat) {
        // Tween the Color's own channels, not the `emissive` property itself —
        // gsap only interpolates plain numeric properties.
        gsap.to(mat.emissive, { r: 1, g: 0.91, b: 0.66, duration: 0.25, yoyo: true, repeat: 3 });
        gsap.to(mat, { emissiveIntensity: 0.8, duration: 0.25, yoyo: true, repeat: 3 });
      });
      navigateAfter('accomplishments.html', 550);
    }

    registerInteractive(group, group, { onClick: glintAndGo });

    resetters.push(function () {
      clicked = false;
      trophyMaterials.forEach(function (mat) {
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 1;
      });
    });

    return group;
  }

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
      playTap();
      if (!canAnimate) {
        group.rotation.x = idleRotX + 0.3;
        navigateAfter('gallery.html', 0);
        return;
      }
      gsap.to(group.rotation, { x: idleRotX + 0.3, duration: 0.4, ease: 'power2.out' });
      navigateAfter('gallery.html', 500);
    }

    registerInteractive(group, group, { onClick: tiltAndGo });

    resetters.push(function () {
      clicked = false;
      group.rotation.x = idleRotX;
    });

    return group;
  }

  function buildFigurine() {
    var group = new THREE.Group();
    group.position.set(2.6, 0, -1.6); // y=0 is the desk's top surface, see buildLamp
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
      playClick();
      if (!canAnimate) {
        navigateAfter('about.html', 0);
        return;
      }
      gsap.to(group.rotation, { z: 0.25, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' });
      navigateAfter('about.html', 550);
    }

    registerInteractive(group, group, { onClick: nodAndGo });

    resetters.push(function () {
      clicked = false;
      group.rotation.z = 0;
    });

    return group;
  }

  buildPlant();
  buildDuck();
  buildPen();
  buildLaptop();
  buildNotebook();
  buildMug();
  buildTrophy();
  buildFrame();
  buildFigurine();

  // Exposed for later tasks in this file (object factories, raycasting, theme toggle)
  // via closure — subsequent tasks append to this same IIFE rather than creating new globals.
  window.__resumeScene = {
    get scene() { return scene; },
    get camera() { return camera; },
    get renderer() { return renderer; },
    get deskGroup() { return deskGroup; },
    get lampLight() { return lampLight; },
    get ambientLight() { return ambientLight; },
    get fillLight() { return fillLight; },
    THEMES: THEMES,
    reduceMotion: reduceMotion,
    interactives: interactives
  };

  function applyThemeToScene(name) {
    var theme = THEMES[name];
    currentTheme = name;
    scene.background.set(theme.bgColor);
    deskGroup.children[0].material.color.set(theme.deskColor); // desk slab is always child 0
    lampLight.color.set(theme.lampColor);
    lampLight.intensity = lampOn ? theme.lampIntensity : 0;
    ambientLight.color.set(theme.ambientColor);
    ambientLight.intensity = lampOn ? theme.ambientIntensity : theme.ambientIntensity * 0.35;
    fillLight.color.set(theme.fillColor);
    if (lampBulbMat) lampBulbMat.emissive.set(theme.lampColor);
  }

  function setTheme(name) {
    if (!THEMES[name]) name = 'desk-lamp';
    document.documentElement.setAttribute('data-theme', name);
    try { window.localStorage.setItem('resumeTheme', name); } catch (e) { /* storage unavailable — theme still applies below */ }
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

  function toggleSound() {
    setSoundMuted(!soundMuted);
    var soundBtn = document.getElementById('sound-toggle');
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', soundMuted ? 'false' : 'true');
      soundBtn.textContent = soundMuted ? 'Sound: off' : 'Sound: on';
    }
    if (!soundMuted) playClick(); // audible confirmation that sound just turned back on
  }

  window.__resumeScene.toggleSound = toggleSound;
  window.__resumeScene.isSoundMuted = function () { return soundMuted; };
})();
