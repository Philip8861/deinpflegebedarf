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
    if (!this.wrapper) return;

    const reveal = () => {
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
    };

    /* showModal wirft InvalidStateError, wenn der Dialog noch offen ist (z. B. erneut „In den Warenkorb“). */
    if (typeof this.wrapper.showModal === 'function') {
      try {
        if (this.wrapper.open) this.wrapper.close();
        this.wrapper.showModal();
        this.wrapper.classList.remove('cart-notification-wrapper--modeless');
      } catch (e) {
        console.warn('[cart-notification] showModal fehlgeschlagen, nutze show() als Fallback', e);
        if (this.wrapper.open) this.wrapper.close();
        if (typeof this.wrapper.show === 'function') {
          this.wrapper.show();
          this.wrapper.classList.add('cart-notification-wrapper--modeless');
        }
      }
    } else if (typeof this.wrapper.show === 'function') {
      if (this.wrapper.open) this.wrapper.close();
      this.wrapper.show();
      this.wrapper.classList.add('cart-notification-wrapper--modeless');
    } else {
      return;
    }

    reveal();
  }

  close() {
    if (this.wrapper?.open) {
      this.wrapper.close();
    } else {
      this.notification?.classList.remove('active', 'animate');
      document.body.removeEventListener('click', this.onBodyClick);
    }
    this.wrapper?.classList.remove('cart-notification-wrapper--modeless');
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
