(function () {
  function getCartUi() {
    return document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  }

  document.addEventListener(
    'click',
    function (event) {
      const btn = event.target.closest(
        'button.pflege-bestseller-card__cart[data-variant-id], button.pflege-pflegesets__cart[data-variant-id], button.pflege-cat-card__cart[data-variant-id]'
      );
      if (!btn) return;
      if (btn.getAttribute('aria-disabled') === 'true') return;

      event.preventDefault();
      event.stopPropagation();

      const cart = getCartUi();
      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData();
      formData.append('id', btn.getAttribute('data-variant-id'));
      formData.append('quantity', '1');

      if (cart) {
        formData.append(
          'sections',
          cart.getSectionsToRender().map(function (section) {
            return section.id;
          })
        );
        formData.append('sections_url', window.location.pathname);
        cart.setActiveElement(btn);
      }

      config.body = formData;
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('loading');

      fetch(routes.cart_add_url, config)
        .then(function (response) {
          return response.json();
        })
        .then(function (response) {
          if (response.status) {
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'pflege-bestseller-add',
              productVariantId: formData.get('id'),
              errors: response.errors || response.description,
              message: response.message,
            });
            const msg = response.description || response.message || window.cartStrings?.error;
            if (msg) window.alert(msg);
            return;
          }

          if (!cart) {
            window.location = routes.cart_url;
            return;
          }

          let perfMarker;
          if (typeof CartPerformance !== 'undefined') {
            perfMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
          }

          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'pflege-bestseller-add',
            productVariantId: formData.get('id'),
            cartData: response,
          }).then(function () {
            if (typeof CartPerformance !== 'undefined' && perfMarker) {
              CartPerformance.measureFromMarker('add:wait-for-subscribers', perfMarker);
            }
          });

          if (typeof CartPerformance !== 'undefined') {
            CartPerformance.measure('add:paint-updated-sections', function () {
              cart.renderContents(response);
            });
          } else {
            cart.renderContents(response);
          }
        })
        .catch(function (e) {
          console.error(e);
        })
        .finally(function () {
          btn.classList.remove('loading');
          btn.removeAttribute('aria-disabled');
        });
    },
    false
  );
})();
