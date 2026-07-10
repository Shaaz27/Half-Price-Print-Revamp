/**
 * Search Panel — premium search suggestions & live search
 */
(function () {
  'use strict';

  var DEBOUNCE_MS = 250;
  var CLOSE_DELAY = 200;
  var data = window.HPP_SEARCH || {};

  var wrapper = document.getElementById('searchWrapper');
  var input = document.getElementById('searchInput');
  var panel = document.getElementById('searchPanel');
  var clearBtn = document.getElementById('searchClear');
  var mobileSearchBtn = document.getElementById('mobileSearchBtn');
  var mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
  var mobileSearchClose = document.getElementById('mobileSearchClose');
  var mobileSearchInput = document.getElementById('mobileSearchInput');
  var mobileSearchPanel = document.getElementById('mobileSearchPanel');

  if (!wrapper || !input || !panel) return;

  var closeTimer = null;
  var debounceTimer = null;
  var activeIndex = -1;
  var currentItems = [];
  var isOpen = false;

  /* ── Render helpers ── */
  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function highlight(text, query) {
    if (!query) return esc(text);
    var re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return esc(text).replace(re, '<strong>$1</strong>');
  }

  function formatPrice(product) {
    if (product.price === 'Get a Quote') return esc(product.price);
    var formattedPrice = esc(product.price);
    if (product.price.indexOf('AED ') === 0) {
      formattedPrice = '<span class="price-with-symbol"><img src="assets/dirham.svg" class="price-currency" alt="" aria-hidden="true">' + esc(product.price.replace('AED ', '')) + '</span>';
    }
    return (product.priceFrom ? 'From ' : '') + formattedPrice;
  }

  function renderProductItem(product, query) {
    var badge = product.badge ? '<span class="search-product__badge">' + esc(product.badge) + '</span>' : '';
    var rating = product.rating ? '<span class="search-product__rating" aria-label="' + product.rating + ' stars">★ ' + product.rating + '</span>' : '';

    return '<a href="' + product.href + '" class="search-product" role="option" tabindex="-1">' +
      '<div class="search-product__img"><img src="' + product.image + '" alt="" loading="lazy" width="56" height="56"></div>' +
      '<div class="search-product__info">' +
        '<span class="search-product__title">' + highlight(product.title, query) + '</span>' +
        '<span class="search-product__meta">' +
          '<span class="search-product__price">' + formatPrice(product) + '</span>' +
          rating + badge +
        '</span>' +
      '</div>' +
    '</a>';
  }

  function renderDefaultState() {
    var popular = (data.popular || []).map(function (term) {
      return '<li><button type="button" class="search-suggestion" data-term="' + esc(term) + '" role="option" tabindex="-1">' + esc(term) + '</button></li>';
    }).join('');

    var categories = (data.categories || []).map(function (cat) {
      return '<li><a href="' + cat.href + '" class="search-suggestion search-suggestion--link" role="option" tabindex="-1">' + esc(cat.label) + '</a></li>';
    }).join('');

    var featured = data.products ? data.products.slice(0, 5) : [];
    var products = featured.map(function (p) { return renderProductItem(p, ''); }).join('');

    var promo = data.featured ? (
      '<a href="' + data.featured.href + '" class="search-promo">' +
        '<img src="' + data.featured.image + '" alt="" loading="lazy" width="280" height="180">' +
        '<div class="search-promo__body">' +
          '<strong>' + esc(data.featured.title) + '</strong>' +
          '<span>' + esc(data.featured.description) + '</span>' +
        '</div>' +
      '</a>'
    ) : '';

    return '<div class="search-panel__default">' +
      '<div class="search-panel__col search-panel__col--left">' +
        '<div class="search-panel__section">' +
          '<h4 class="search-panel__heading">Popular Searches</h4>' +
          '<ul class="search-panel__list" role="group">' + popular + '</ul>' +
        '</div>' +
        '<div class="search-panel__section">' +
          '<h4 class="search-panel__heading">Trending Categories</h4>' +
          '<ul class="search-panel__list" role="group">' + categories + '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="search-panel__col search-panel__col--center">' +
        '<div class="search-panel__section">' +
          '<h4 class="search-panel__heading">Featured Products</h4>' +
          '<div class="search-panel__products" role="group">' + products + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="search-panel__col search-panel__col--right">' +
        '<div class="search-panel__section">' +
          '<h4 class="search-panel__heading">Featured Collection</h4>' +
          promo +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function filterData(query) {
    var q = query.toLowerCase().trim();
    if (!q) return null;

    var suggestions = (data.suggestions || []).concat(data.popular || [])
      .filter(function (s, i, arr) { return arr.indexOf(s) === i; })
      .filter(function (s) { return s.toLowerCase().indexOf(q) !== -1; })
      .slice(0, 6);

    var pages = (data.pages || []).filter(function (p) {
      return p.label.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 5);

    var products = (data.products || []).filter(function (p) {
      return p.title.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);

    return { suggestions: suggestions, pages: pages, products: products, query: q };
  }

  function renderLiveState(results) {
    if (!results) return renderDefaultState();

    var q = results.query;

    if (!results.suggestions.length && !results.pages.length && !results.products.length) {
      return '<div class="search-panel__empty">' +
        '<p>No results found for &ldquo;' + esc(q) + '&rdquo;</p>' +
        '<span>Try a different search term or browse our categories.</span>' +
      '</div>';
    }

    var suggestionsHtml = results.suggestions.length ? (
      '<div class="search-panel__section">' +
        '<h4 class="search-panel__heading">Suggestions</h4>' +
        '<ul class="search-panel__list" role="group">' +
          results.suggestions.map(function (s) {
            return '<li><button type="button" class="search-suggestion" data-term="' + esc(s) + '" role="option" tabindex="-1">' + highlight(s, q) + '</button></li>';
          }).join('') +
        '</ul>' +
      '</div>'
    ) : '';

    var pagesHtml = results.pages.length ? (
      '<div class="search-panel__section">' +
        '<h4 class="search-panel__heading">Pages</h4>' +
        '<ul class="search-panel__list" role="group">' +
          results.pages.map(function (p) {
            return '<li><a href="' + p.href + '" class="search-suggestion search-suggestion--link" role="option" tabindex="-1">' + highlight(p.label, q) + '</a></li>';
          }).join('') +
        '</ul>' +
      '</div>'
    ) : '';

    var productsHtml = results.products.length ? (
      '<div class="search-panel__section">' +
        '<h4 class="search-panel__heading">Products</h4>' +
        '<div class="search-panel__products" role="group">' +
          results.products.map(function (p) { return renderProductItem(p, q); }).join('') +
        '</div>' +
      '</div>'
    ) : '';

    return '<div class="search-panel__live">' +
      '<div class="search-panel__col search-panel__col--left">' +
        suggestionsHtml + pagesHtml +
      '</div>' +
      '<div class="search-panel__col search-panel__col--center search-panel__col--wide">' +
        productsHtml +
      '</div>' +
    '</div>';
  }

  function renderViewAll(query) {
    if (!query) return '';
    return '<div class="search-panel__footer">' +
      '<a href="?q=' + encodeURIComponent(query) + '" class="search-panel__view-all">View all results for &ldquo;' + esc(query) + '&rdquo;</a>' +
    '</div>';
  }

  function updatePanel(query) {
    var results = query ? filterData(query) : null;
    var html = query ? renderLiveState(results) : renderDefaultState();
    var footer = query ? renderViewAll(query) : '';
    panel.innerHTML = html + footer;
    collectItems();
    activeIndex = -1;
  }

  function collectItems() {
    currentItems = Array.from(panel.querySelectorAll('[role="option"]'));
  }

  /* ── Open / close ── */
  function openPanel() {
    clearTimeout(closeTimer);
    isOpen = true;
    wrapper.classList.add('search-wrapper--open');
    input.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    requestAnimationFrame(function () {
      panel.classList.add('search-panel--visible');
    });
    if (!input.value.trim()) updatePanel('');
  }

  function closePanel() {
    isOpen = false;
    wrapper.classList.remove('search-wrapper--open');
    input.setAttribute('aria-expanded', 'false');
    panel.classList.remove('search-panel--visible');
    activeIndex = -1;
    setActiveItem(-1);
    setTimeout(function () {
      if (!wrapper.classList.contains('search-wrapper--open')) {
        panel.hidden = true;
      }
    }, 250);
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closePanel, CLOSE_DELAY);
  }

  /* ── Active item (keyboard) ── */
  function setActiveItem(index) {
    currentItems.forEach(function (item, i) {
      item.classList.toggle('search-item--active', i === index);
      if (i === index) item.focus();
    });
    activeIndex = index;
  }

  /* ── Events — click to open, not hover ── */
  input.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!isOpen) openPanel();
  });

  wrapper.querySelector('.search__submit').addEventListener('click', function (e) {
    e.preventDefault();
    if (!isOpen) openPanel();
    else input.focus();
  });

  input.addEventListener('input', function () {
    var val = input.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      updatePanel(val);
    }, DEBOUNCE_MS);
  });

  panel.addEventListener('click', function (e) {
    var suggestion = e.target.closest('.search-suggestion[data-term]');
    if (suggestion) {
      input.value = suggestion.dataset.term;
      updatePanel(suggestion.dataset.term);
      input.focus();
    }
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closePanel();
      input.blur();
      return;
    }

    if (!currentItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveItem(activeIndex < currentItems.length - 1 ? activeIndex + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveItem(activeIndex > 0 ? activeIndex - 1 : currentItems.length - 1);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      var item = currentItems[activeIndex];
      if (item.tagName === 'A') {
        window.location.href = item.href;
      } else if (item.dataset.term) {
        input.value = item.dataset.term;
        updatePanel(item.dataset.term);
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (!wrapper.contains(e.target) && !panel.contains(e.target)) {
      if (isOpen) scheduleClose();
    }
  });

  /* ── Mobile search overlay ── */
  function openMobileSearch() {
    if (!mobileSearchOverlay) return;
    mobileSearchOverlay.classList.add('mobile-search--open');
    mobileSearchOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      if (mobileSearchInput) mobileSearchInput.focus();
    }, 300);
    if (mobileSearchPanel) {
      mobileSearchPanel.innerHTML = renderDefaultState();
    }
  }

  function closeMobileSearch() {
    if (!mobileSearchOverlay) return;
    mobileSearchOverlay.classList.remove('mobile-search--open');
    mobileSearchOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (mobileSearchBtn) mobileSearchBtn.addEventListener('click', openMobileSearch);
  if (mobileSearchClose) mobileSearchClose.addEventListener('click', closeMobileSearch);

  if (mobileSearchInput && mobileSearchPanel) {
    mobileSearchInput.addEventListener('input', function () {
      var val = mobileSearchInput.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var results = val ? filterData(val) : null;
        mobileSearchPanel.innerHTML = (val ? renderLiveState(results) : renderDefaultState()) + (val ? renderViewAll(val) : '');
      }, DEBOUNCE_MS);
    });
  }

  /* ── Init ── */
  updatePanel('');
  panel.hidden = true;

  wrapper.querySelector('.search').addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value.trim()) {
      window.location.href = '?q=' + encodeURIComponent(input.value.trim());
    }
  });

})();
