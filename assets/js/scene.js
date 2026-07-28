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
