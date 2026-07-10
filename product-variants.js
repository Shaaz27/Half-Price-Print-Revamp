(function () {
  'use strict';

  var configurators = document.querySelectorAll('[data-variant-config]');

  if (!configurators.length) return;

  configurators.forEach(function (configurator) {
    var buttons = configurator.querySelectorAll('[data-variant-button]');
    var cards = configurator.querySelectorAll('[data-variant-card]');
    var track = configurator.querySelector('[data-variant-track]');
    var prevButton = configurator.querySelector('[data-variant-prev]');
    var nextButton = configurator.querySelector('[data-variant-next]');
    var priceValue = document.querySelector('[data-product-price-value]');
    if (!buttons.length || !cards.length) return;

    function visibleCardsFor(variant) {
      return Array.prototype.filter.call(cards, function (card) {
        return card.dataset.variant === variant;
      });
    }

    function getTrackGap() {
      if (!track) return 0;

      var styles = window.getComputedStyle(track);
      var gapValue = styles.columnGap || styles.gap || '0';
      return parseFloat(gapValue) || 0;
    }

    function updateCarouselControls() {
      if (!track || !prevButton || !nextButton) return;

      var maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
      var scrollLeft = Math.round(track.scrollLeft);

      prevButton.disabled = scrollLeft <= 4;
      nextButton.disabled = scrollLeft >= maxScroll - 4;
    }

    function scrollCarousel(direction) {
      if (!track) return;

      var visibleCards = Array.prototype.filter.call(cards, function (card) {
        return !card.hidden;
      });

      var leadCard = visibleCards[0];
      if (!leadCard) return;

      var amount = leadCard.getBoundingClientRect().width + getTrackGap();
      track.scrollBy({ left: amount * direction, behavior: 'smooth' });
    }

    function setSelectedCard(activeCard) {
      cards.forEach(function (card) {
        var isActive = card === activeCard;
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (!activeCard) return;

      var price = activeCard.dataset.price || '';

      if (priceValue) priceValue.textContent = price;
    }

    function activateVariant(variant) {
      buttons.forEach(function (button) {
        var isActive = button.dataset.variant === variant;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      var matchingCards = visibleCardsFor(variant);

      cards.forEach(function (card) {
        var shouldShow = card.dataset.variant === variant;
        card.hidden = !shouldShow;
      });

      if (track) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      }

      var activeVisibleCard = matchingCards.find(function (card) {
        return card.classList.contains('is-active');
      });

      setSelectedCard(activeVisibleCard || matchingCards[0] || null);
      window.setTimeout(updateCarouselControls, 220);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activateVariant(button.dataset.variant);
      });
    });

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (card.hidden) return;
        setSelectedCard(card);
      });

      card.addEventListener('keydown', function (event) {
        if (card.hidden) return;

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setSelectedCard(card);
        }
      });
    });

    if (prevButton && nextButton && track) {
      prevButton.addEventListener('click', function () {
        scrollCarousel(-1);
      });

      nextButton.addEventListener('click', function () {
        scrollCarousel(1);
      });

      track.addEventListener('scroll', updateCarouselControls, { passive: true });
      window.addEventListener('resize', updateCarouselControls, { passive: true });
    }

    var initialButton = configurator.querySelector('[data-variant-button].is-active') || buttons[0];
    activateVariant(initialButton.dataset.variant);
    updateCarouselControls();
  });
})();
