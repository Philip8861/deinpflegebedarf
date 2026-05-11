class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = this.querySelector('#cart-notification');
    this.wrapper = this.querySelector('dialog.cart-notification-wrapper');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);

    if (!this.notification || !this.wrapper) return;

    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );

    this.wrapper.addEventListener('click', (evt) => {
      if (evt.target === this.wrapper) this.close();
    });

    this.wrapper.addEventListener('close', () => {
      this.notification.classList.remove('active', 'animate');
      document.body.removeEventListener('click', this.onBodyClick);
      removeTrapFocus(this.activeElement);
    });
  }

  open() {
    if (!this.wrapper || typeof this.wrapper.showModal !== 'function') return;

    this.wrapper.showModal();
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener(
      'transitionend',
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    if (this.wrapper?.open) {
      this.wrapper.close();
    } else {
      this.notification?.classList.remove('active', 'animate');
      document.body.removeEventListener('click', this.onBodyClick);
    }
  }

  renderContents(parsedState) {
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      document.getElementById(section.id).innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.id],
        section.selector
      );
    });

    if (this.header) this.header.reveal();
    this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
