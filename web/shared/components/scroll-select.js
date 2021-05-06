import {LitElement, html, css} from 'lit-element';

class ScrollSelect extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: row;
      }
      #scroll {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        overflow: auto;
        position: relative;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        scrollbar-width: none;
      }

      #scroll::-webkit-scrollbar {
        display: none;  /* Safari and Chrome */
      }

      ::slotted(*) {
        flex: 0 0 auto;
        width: 100%;
        height: 100%;
        scroll-snap-align: center;
        scroll-snap-stop: always;
      }
    `;
  }

  get pos() {
    return this._pos || 0;
  }
  set pos(v) {
    this._pos = v;
    if (v !== this.index) {
      this._index = v;
      this.dispatchEvent(new Event('indexChange'));
    }
    this.requestUpdate();
  }

  get index() {
    return this._index || 0;
  }

  set index(val) {
    this._index = val;
    this.requestUpdate();

    if (this._index === this.pos) return;
    const scroll = this.shadowRoot.querySelector('#scroll');
    if (!scroll) return;
    if (scroll.scrollWidth === 0) return this._index = 0;
    const maxIndex = Math.floor((scroll.scrollWidth / scroll.clientWidth) - 1);
    if (this.index < 0) return this.index = 0;
    if (this.index > maxIndex) return this.index = maxIndex;

    const target = this.index * scroll.clientWidth;
    scroll.scrollTo(target, 0);
  }

  scrollHandler() {
    const scroll = this.shadowRoot.querySelector('#scroll');
    const newPos = Math.round(scroll.scrollLeft / scroll.clientWidth);
    if (newPos !== this.pos) {
      this.pos = newPos;
    }
  }

  render() {
    return html`
      <div id="scroll" @scroll=${this.scrollHandler}>
        <slot />
      </div>
    `;
  }
}

customElements.define('scroll-select', ScrollSelect);
