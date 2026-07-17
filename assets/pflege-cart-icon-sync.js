(function () {
  function syncPflegeCartIcon() {
    var master = document.getElementById('cart-icon-bubble');
    var slave = document.getElementById('pflege-cart-icon-contents');
    if (!master || !slave) return;
    if (slave.innerHTML.trim() === master.innerHTML.trim()) return;
    slave.innerHTML = master.innerHTML;
  }

  function updatePflegeCartTotal() {
    var el = document.querySelector('[data-pflege-cart-total]');
    if (!el || !window.routes || !window.routes.cart_url) return;
    fetch(window.routes.cart_url + '.js')
      .then(function (res) {
        return res.json();
      })
      .then(function (cart) {
        var currency = cart.currency || 'EUR';
        var formatted = new Intl.NumberFormat(document.documentElement.lang || 'de-DE', {
          style: 'currency',
          currency: currency,
        }).format(cart.total_price / 100);
        el.textContent = formatted;

        // Zugänglicher Name des Warenkorb-Links mit Artikelanzahl aktuell halten
        var link = document.getElementById('pflege-cart-icon-bubble');
        if (link) {
          var heading = link.getAttribute('data-pflege-cart-heading') || 'Warenkorb';
          link.setAttribute('aria-label', heading + ', ' + cart.item_count + ' Artikel, ' + formatted);
        }
      })
      .catch(function () {});
  }

  function init() {
    var master = document.getElementById('cart-icon-bubble');
    var slave = document.getElementById('pflege-cart-icon-contents');
    if (master && slave) {
      new MutationObserver(syncPflegeCartIcon).observe(master, { childList: true, subtree: true });
    }
    updatePflegeCartTotal();
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, function () {
        requestAnimationFrame(function () {
          syncPflegeCartIcon();
          updatePflegeCartTotal();
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
