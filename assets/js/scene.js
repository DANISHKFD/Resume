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
