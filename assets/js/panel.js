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
