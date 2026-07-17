class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = this.querySelector('#cart-notification');
    this.wrapper = this.querySelector('.cart-notification-wrapper');
    this.backdrop = this.querySelector('.cart-notification__backdrop');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);

    if (!this.notification || !this.wrapper) return;

    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
    this.backdrop?.addEventListener('click', this.close.bind(this));
  }

  open() {
    this.wrapper?.classList.add('is-active');
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
    this.wrapper?.classList.remove('is-active');
    this.notification.classList.remove('active', 'animate');
    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      const node = document.getElementById(section.id);
      const html = parsedState.sections[section.id];
      if (!node || html === undefined || html === null) return;
      node.innerHTML = this.getSectionInnerHTML(html, section.selector);
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
        id: 'cart-notification-recos',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const el = doc.querySelector(selector);
    return el ? el.innerHTML : '';
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
