/**
 * Collection page interactions
 * Lightweight filtering and sorting for the static collection grid
 */
(function () {
  'use strict';

  var grid = document.getElementById('collectionGrid');
  var countEl = document.getElementById('collectionCount');
  var sortEl = document.getElementById('collectionSort');
  var filterButtons = document.querySelectorAll('.collection-chip');

  if (!grid || !countEl || !sortEl || !filterButtons.length) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.collection-card'));
  var activeFilter = 'all';

  function compareCards(a, b, sortValue) {
    if (sortValue === 'name-asc') {
      return a.dataset.name.localeCompare(b.dataset.name);
    }

    if (sortValue === 'price-asc') {
      return Number(a.dataset.price) - Number(b.dataset.price);
    }

    if (sortValue === 'price-desc') {
      return Number(b.dataset.price) - Number(a.dataset.price);
    }

    return Number(a.dataset.order) - Number(b.dataset.order);
  }

  function applyState() {
    var sortValue = sortEl.value;
    var sortedCards = cards.slice().sort(function (a, b) {
      return compareCards(a, b, sortValue);
    });
    var visibleCount = 0;

    sortedCards.forEach(function (card) {
      var matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
      card.hidden = !matchesFilter;
      if (matchesFilter) visibleCount += 1;
      grid.appendChild(card);
    });

    countEl.textContent = 'Showing ' + visibleCount + ' product' + (visibleCount === 1 ? '' : 's');
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.dataset.filter || 'all';

      filterButtons.forEach(function (chip) {
        chip.classList.toggle('is-active', chip === button);
      });

      applyState();
    });
  });

  sortEl.addEventListener('change', applyState);
  applyState();
})();
