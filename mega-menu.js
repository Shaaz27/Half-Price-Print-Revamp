/**
 * Mega Menu — 3-level hierarchical navigation
 */
(function () {
  'use strict';

  var OPEN_DELAY = 70;
  var CLOSE_DELAY = 220;
  var navData = window.HPP_NAV || [];
  var megaNavEl = document.getElementById('megaNav');
  var mobileNavEl = document.getElementById('mobileNavAccordion');
  var mobileRailEl = document.getElementById('mobileRail');
  var menuToggle = document.getElementById('menuToggle');
  var mobileNav = document.getElementById('mobileNav');
  var mobileNavClose = document.getElementById('mobileNavClose');
  var mobileNavSearchBtn = document.getElementById('mobileNavSearchBtn');
  var mobileSearchBtn = document.getElementById('mobileSearchBtn');

  if (!megaNavEl || !navData.length) return;

  var activeL1 = null;
  var closeTimer = null;
  var openTimer = null;
  var isTouch = false;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── SVG chevrons ── */
  var chevronDown = '<svg class="mega-nav__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var chevronRight = '<svg class="mega-menu__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  /* ── Build desktop mega nav ── */
  function buildDesktopNav() {
    var html = '<ul class="mega-nav__list" role="menubar">';

    navData.forEach(function (l1) {
      html += '<li class="mega-nav__item" role="none" data-l1="' + l1.id + '">';
      html += '<button class="mega-nav__trigger" role="menuitem" aria-haspopup="true" aria-expanded="false" data-l1="' + l1.id + '">';
      html += esc(l1.label) + chevronDown;
      html += '</button>';

      if (l1.children && l1.children.length) {
        html += buildMegaDropdown(l1);
      }
      html += '</li>';
    });

    html += '<li class="mega-nav__item mega-nav__item--link" role="none">';
    html += '<a href="#" class="mega-nav__link" role="menuitem">Catalogue</a>';
    html += '</li>';
    html += '</ul>';

    megaNavEl.innerHTML = html;
  }

  function getFirstActiveIdx(children) {
    for (var i = 0; i < children.length; i++) {
      if (children[i].children && children[i].children.length > 0) return i;
    }
    return 0;
  }

  function buildMegaDropdown(l1) {
    var firstActiveIdx = getFirstActiveIdx(l1.children);

    var html = '<div class="mega-menu" role="menu" aria-label="' + esc(l1.label) + '" hidden>';
    html += '<div class="mega-menu__inner">';
    html += '<div class="mega-menu__layout">';

    /* L2 sidebar */
    html += '<div class="mega-menu__sidebar">';
    html += '<ul class="mega-menu__l2" role="menu">';

    l1.children.forEach(function (l2, i) {
      var hasChildren = l2.children && l2.children.length > 0;
      html += '<li role="none">';
      html += '<button class="mega-menu__l2-btn' + (i === firstActiveIdx ? ' mega-menu__l2-btn--active' : '') + '"';
      html += ' role="menuitem" data-l1="' + l1.id + '" data-l2="' + l2.id + '"';
      html += hasChildren ? '' : ' data-no-children="true"';
      html += '>';
      html += '<span>' + esc(l2.label) + '</span>';
      if (hasChildren) html += chevronRight;
      html += '</button></li>';
    });

    html += '</ul>';

    if (l1.viewAll) {
      html += '<a href="' + l1.viewAll.href + '" class="mega-menu__view-all btn btn--primary btn--sm">' + esc(l1.viewAll.label) + '</a>';
    }
    html += '</div>';

    /* L3 content panels */
    html += '<div class="mega-menu__content">';

    l1.children.forEach(function (l2, i) {
      var hasChildren = l2.children && l2.children.length > 0;
      html += '<div class="mega-menu__panel' + (i === firstActiveIdx ? ' mega-menu__panel--active' : '') + '"';
      html += ' data-l1="' + l1.id + '" data-l2="' + l2.id + '" role="none">';

      if (hasChildren) {
        html += '<div class="mega-menu__l3-grid">';
        l2.children.forEach(function (l3) {
          html += '<a href="' + l3.href + '" class="mega-menu__card" role="menuitem">';
          html += '<div class="mega-menu__card-img"><img src="' + l3.image + '" alt="" loading="lazy" width="200" height="160"></div>';
          html += '<span class="mega-menu__card-label">' + esc(l3.label) + '</span>';
          html += '</a>';
        });
        html += '</div>';
      } else {
        html += '<div class="mega-menu__empty"><p>No subcategories available.</p>';
        if (l1.viewAll) {
          html += '<a href="' + l1.viewAll.href + '" class="btn btn--outline btn--sm">Browse ' + esc(l1.label) + '</a>';
        }
        html += '</div>';
      }
      html += '</div>';
    });

    html += '</div></div></div></div>';
    return html;
  }

  function getPreviewImage(item) {
    if (!item || !item.children) return 'assets/Logo.png';

    for (var i = 0; i < item.children.length; i++) {
      var l2 = item.children[i];
      if (l2.children && l2.children.length && l2.children[0].image) {
        return l2.children[0].image;
      }
    }

    return 'assets/Logo.png';
  }

  function getSectionLink(item, fallbackHref) {
    if (item && item.href) return item.href;
    return fallbackHref || '#';
  }

  /* ── Build premium mobile nav ── */
  function buildMobileNav() {
    if (!mobileNavEl || !mobileRailEl) return;
    var railHtml = '';
    var panelHtml = '';

    navData.forEach(function (l1, index) {
      railHtml += '<button type="button" class="mobile-rail__item' + (index === 0 ? ' mobile-rail__item--active' : '') + '" data-mobile-l1="' + l1.id + '">';
      railHtml += '<span class="mobile-rail__thumb"><img src="' + esc(getPreviewImage(l1)) + '" alt="" loading="lazy" width="44" height="44"></span>';
      railHtml += '<span>' + esc(l1.label) + '</span>';
      railHtml += '</button>';

      panelHtml += '<section class="mobile-showcase__panel' + (index === 0 ? ' mobile-showcase__panel--active' : '') + '" data-mobile-panel="' + l1.id + '">';
      panelHtml += '<div class="mobile-showcase__intro">';
      panelHtml += '<h2 class="mobile-showcase__title">' + esc(l1.label) + '</h2>';
      panelHtml += '</div>';

      if (l1.children && l1.children.length) {
        l1.children.forEach(function (l2) {
          var hasChildren = l2.children && l2.children.length > 0;
          panelHtml += '<div class="mobile-showcase__section">';
          panelHtml += '<div class="mobile-showcase__section-head">';
          panelHtml += '<h3>' + esc(l2.label) + '</h3>';
          panelHtml += '<a href="' + getSectionLink(l1.viewAll, l1.href) + '" class="mobile-showcase__section-link" aria-label="Explore ' + esc(l2.label) + '">' + chevronRight + '</a>';
          panelHtml += '</div>';

          if (hasChildren) {
            panelHtml += '<div class="mobile-showcase__grid">';
            l2.children.slice(0, 8).forEach(function (l3) {
              panelHtml += '<a href="' + l3.href + '" class="mobile-showcase__card">';
              panelHtml += '<div class="mobile-showcase__card-img"><img src="' + l3.image + '" alt="" loading="lazy" width="160" height="160"></div>';
              panelHtml += '<span class="mobile-showcase__card-label">' + esc(l3.label) + '</span>';
              panelHtml += '</a>';
            });
            panelHtml += '</div>';
          } else {
            panelHtml += '<a href="' + getSectionLink(l1.viewAll, l1.href) + '" class="mobile-showcase__empty">';
            panelHtml += 'Browse ' + esc(l2.label);
            panelHtml += '</a>';
          }

          panelHtml += '</div>';
        });
      } else {
        panelHtml += '<a href="' + getSectionLink(l1.viewAll, l1.href) + '" class="mobile-showcase__empty">Explore this category</a>';
      }

      if (l1.viewAll) {
        panelHtml += '<div class="mobile-showcase__footer">';
        panelHtml += '<a href="' + l1.viewAll.href + '" class="mobile-showcase__view-all">' + esc(l1.viewAll.label) + chevronRight + '</a>';
        panelHtml += '</div>';
      }

      panelHtml += '</section>';
    });

    mobileRailEl.innerHTML = railHtml;
    mobileNavEl.innerHTML = panelHtml;
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Open / close L1 ── */
  function openL1(id) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    var items = megaNavEl.querySelectorAll('.mega-nav__item');
    items.forEach(function (item) {
      var isTarget = item.dataset.l1 === id;
      var trigger = item.querySelector('.mega-nav__trigger');
      var menu = item.querySelector('.mega-menu');

      if (isTarget && menu) {
        item.classList.add('mega-nav__item--open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
        requestAnimationFrame(function () {
          menu.classList.add('mega-menu--visible');
        });
        activeL1 = id;
      } else {
        closeL1Item(item);
      }
    });
  }

  function closeL1Item(item) {
    var trigger = item.querySelector('.mega-nav__trigger');
    var menu = item.querySelector('.mega-menu');
    item.classList.remove('mega-nav__item--open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (menu) {
      menu.classList.remove('mega-menu--visible');
      setTimeout(function () {
        if (!item.classList.contains('mega-nav__item--open')) {
          menu.hidden = true;
        }
      }, 250);
    }
  }

  function closeAllL1() {
    megaNavEl.querySelectorAll('.mega-nav__item').forEach(closeL1Item);
    activeL1 = null;
  }

  function scheduleClose() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeAllL1, CLOSE_DELAY);
  }

  function scheduleOpen(id) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    openTimer = setTimeout(function () {
      openL1(id);
    }, OPEN_DELAY);
  }

  /* ── L2 hover / focus ── */
  function activateL2(l1Id, l2Id) {
    var item = megaNavEl.querySelector('.mega-nav__item[data-l1="' + l1Id + '"]');
    if (!item) return;

    item.querySelectorAll('.mega-menu__l2-btn').forEach(function (btn) {
      btn.classList.toggle('mega-menu__l2-btn--active', btn.dataset.l2 === l2Id);
    });

    item.querySelectorAll('.mega-menu__panel').forEach(function (panel) {
      var isActive = panel.dataset.l2 === l2Id;
      panel.classList.toggle('mega-menu__panel--active', isActive);
      if (isActive) {
        panel.classList.remove('mega-menu__panel--enter');
        requestAnimationFrame(function () {
          panel.classList.add('mega-menu__panel--enter');
        });
      }
    });
  }

  /* ── Event bindings (desktop) ── */
  function bindDesktopEvents() {
    megaNavEl.querySelectorAll('.mega-nav__item').forEach(function (item) {
      var l1Id = item.dataset.l1;
      var menu = item.querySelector('.mega-menu');
      if (!menu) return;

      item.addEventListener('mouseenter', function () {
        if (canHover) scheduleOpen(l1Id);
      });

      item.addEventListener('mouseleave', function () {
        if (canHover) scheduleClose();
      });

      menu.addEventListener('mouseenter', function () {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
      });

      menu.addEventListener('mouseleave', function () {
        if (canHover) scheduleClose();
      });
    });

    megaNavEl.addEventListener('mouseover', function (e) {
      var l2Btn = e.target.closest('.mega-menu__l2-btn');
      if (l2Btn) {
        activateL2(l2Btn.dataset.l1, l2Btn.dataset.l2);
      }
    });

    megaNavEl.addEventListener('focusin', function (e) {
      var trigger = e.target.closest('.mega-nav__trigger');
      if (trigger) openL1(trigger.dataset.l1);

      var l2Btn = e.target.closest('.mega-menu__l2-btn');
      if (l2Btn) activateL2(l2Btn.dataset.l1, l2Btn.dataset.l2);
    });

    megaNavEl.addEventListener('focusout', function (e) {
      if (!megaNavEl.contains(e.relatedTarget)) {
        scheduleClose();
      }
    });

    /* Keyboard navigation */
    megaNavEl.addEventListener('keydown', function (e) {
      var trigger = e.target.closest('.mega-nav__trigger');
      var l2Btn = e.target.closest('.mega-menu__l2-btn');

      if (e.key === 'Escape') {
        closeAllL1();
        if (trigger) trigger.focus();
        return;
      }

      if (trigger && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openL1(trigger.dataset.l1);
        var firstL2 = megaNavEl.querySelector('.mega-nav__item[data-l1="' + trigger.dataset.l1 + '"] .mega-menu__l2-btn');
        if (firstL2) firstL2.focus();
      }

      if (l2Btn) {
        var l2Btns = Array.from(megaNavEl.querySelectorAll('.mega-nav__item--open .mega-menu__l2-btn'));
        var idx = l2Btns.indexOf(l2Btn);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (idx < l2Btns.length - 1) l2Btns[idx + 1].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (idx > 0) l2Btns[idx - 1].focus();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          var card = megaNavEl.querySelector('.mega-menu__panel--active .mega-menu__card');
          if (card) card.focus();
        }
      }
    });

    window.addEventListener('touchstart', function () {
      isTouch = true;
      canHover = false;
    }, { passive: true });
    window.addEventListener('mousemove', function () {
      canHover = true;
      isTouch = false;
    }, { passive: true });

    megaNavEl.querySelectorAll('.mega-nav__trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        if (!canHover || isTouch) {
          e.preventDefault();
          var id = trigger.dataset.l1;
          if (activeL1 === id) {
            closeAllL1();
          } else {
            openL1(id);
          }
        }
      });
    });
  }

  function activateMobilePanel(id) {
    if (!mobileRailEl || !mobileNavEl) return;

    mobileRailEl.querySelectorAll('.mobile-rail__item').forEach(function (btn) {
      btn.classList.toggle('mobile-rail__item--active', btn.dataset.mobileL1 === id);
    });

    mobileNavEl.querySelectorAll('.mobile-showcase__panel').forEach(function (panel) {
      var isActive = panel.dataset.mobilePanel === id;
      panel.classList.toggle('mobile-showcase__panel--active', isActive);
      if (isActive) panel.scrollTop = 0;
    });
  }

  /* ── Mobile nav interactions ── */
  function bindMobileEvents() {
    if (!mobileNavEl || !mobileRailEl) return;

    mobileRailEl.querySelectorAll('.mobile-rail__item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateMobilePanel(btn.dataset.mobileL1);
      });
    });
  }

  /* ── Mobile nav open/close ── */
  function openMobileNav() {
    mobileNav.classList.add('mobile-nav--open');
    mobileNav.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (navData.length) activateMobilePanel(navData[0].id);
  }

  function closeMobileNav() {
    mobileNav.classList.remove('mobile-nav--open');
    mobileNav.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle) menuToggle.addEventListener('click', openMobileNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  if (mobileNavSearchBtn && mobileSearchBtn) {
    mobileNavSearchBtn.addEventListener('click', function () {
      closeMobileNav();
      mobileSearchBtn.click();
    });
  }
  if (mobileNav) {
    mobileNav.addEventListener('click', function (e) {
      if (e.target === mobileNav) closeMobileNav();
      if (e.target.closest('a')) closeMobileNav();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllL1();
      if (mobileNav && mobileNav.classList.contains('mobile-nav--open')) {
        closeMobileNav();
      }
    }
  });

  /* ── Init ── */
  buildDesktopNav();
  buildMobileNav();
  bindDesktopEvents();
  bindMobileEvents();

})();
