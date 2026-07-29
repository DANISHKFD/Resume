// assets/js/panel.js — shared behavior for destination pages.
(function () {
  'use strict';

  function initPanelChrome() {
    // Storage access can throw (privacy modes, blocked site data, some embedded
    // webviews). Guarded to match assets/js/scene.js's read — a failure here must
    // not abort the function before the nav-toggle/panel-close listeners below get
    // wired up.
    var savedTheme = null;
    try { savedTheme = window.localStorage.getItem('resumeTheme'); } catch (e) { savedTheme = null; }
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
