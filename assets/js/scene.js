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
      ambientColor: 0x2a3040,
      ambientIntensity: 0.85,
      bgColor: 0x0a0c10,
      deskColor: 0x4a3626,
      fillColor: 0x8fa0bd
    },
    'cyberpunk': {
      lampColor: 0x1fe5f0,
      lampIntensity: 1.7,
      ambientColor: 0x2a2410,
      ambientIntensity: 0.7,
      bgColor: 0x08090a,
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
        if (!canAnimate) return;
        gsap.to(leaves.rotation, {
          z: leaves.rotation.z + 0.18, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut'
        });
      }
    });
    return group;
  }

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
        // Desk half-width is 4.2 on x (BoxGeometry(8.4,...)) — the fall must clear
        // that edge horizontally before dropping in y, or the pen visually sinks
        // through the solid desk slab instead of tumbling off its side.
        if (!canAnimate) {
          group.position.set(4.7, -1.6, -1.8);
          group.rotation.set(2.2, 1.1, 3.4);
          return;
        }
        gsap.timeline()
          .to(group.position, { x: 4.5, z: -1.5, duration: 0.25, ease: 'power1.out' })
          .to(group.position, { x: 4.7, y: -1.6, z: -1.8, duration: 0.45, ease: 'power2.in' });
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
    group.position.set(0, -0.15, -0.4);
    var opened = false;

    var baseMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.4, metalness: 0.5 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.0), baseMat);
    // group.position.y is -0.15 (the shared desk-surface baseline); +0.18 here
    // puts the base's bottom face flush with the desk's actual top surface (y=0)
    // instead of half-submerged in it.
    base.position.y = 0.18;
    group.add(base);

    var hinge = new THREE.Group();
    hinge.position.set(0, 0.21, -0.48); // raised to match base's new resting height
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
      if (!canAnimate) {
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

    resetters.push(function () {
      opened = false;
      hinge.rotation.x = -0.35; // idle angle set at build time
      glowMat.emissiveIntensity = 0;
    });

    return group;
  }

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
      if (!canAnimate) {
        navigateAfter('accomplishments.html', 0);
        return;
      }
      gsap.to(goldMat, { emissive: new THREE.Color(0xffe9a8), emissiveIntensity: 0.8, duration: 0.25, yoyo: true, repeat: 3 });
      navigateAfter('accomplishments.html', 550);
    }

    registerInteractive(group, group, { onClick: glintAndGo });

    resetters.push(function () {
      clicked = false;
      goldMat.emissive.set(0x000000);
      goldMat.emissiveIntensity = 1;
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
})();
