import 'element-internals-polyfill';
import {LitElement, html, css} from 'lit-element';
import { classMap } from 'lit-html/directives/class-map.js';
import './scroll-select.js';
import useCustomElement from '../hooks/useCustomElement.js';

const localeWeekday = new Intl.DateTimeFormat('default', {
  weekday: 'short'
});
const localeDay = new Intl.DateTimeFormat('default', {
  day: '2-digit'
});
const localeMonth = new Intl.DateTimeFormat('default', {
  month: 'long'
});

function getWeekNumber(d) {
  d = new Date(+d);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  var yearStart = new Date(d.getFullYear(), 0, 1);
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return weekNo;
}

function getStartOfWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

class ScrollSelectDate extends LitElement {
  static get formAssociated() {
    return true;
  }
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
      }
      * {
        box-sizing: border-box;
      }
      #month {
        text-align: center;
        opacity: 0.7;
      }
      .week {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
      }
      .days {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        flex-grow: 1;
        gap: 2px;
      }
      .circle {
        text-align: center;
        flex: 1 0 auto;
        height:auto;
        max-width: 50px;
      }
      .circle:before {
        content:'';
        float:left;
        padding-top:100%;
      }
      .day {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #0002;
        user-select: none;
        transition: background 0.26s ease-out, opacity 0.26s ease-out;
      }
      .day.selected {
        background-color: var(--mdc-theme-primary);
        color: var(--mdc-theme-on-primary);
      }
      .day.disabled {
        opacity: 0.2;
      }
      .weekday {
        font-size: 80%;
        opacity: 0.8;
        margin-top: -2px;
      }
      .daydigit {
        margin-top: -2px;
        margin-left: 2px;
      }
      .handle {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: #0001;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        user-select: none;
        text-shadow: 0px 0px 3px white;
        transition: opacity 0.26s linear;
      }
      .handle[disabled] {
        background: none;
        opacity: 0.2;
        text-shadow: none;
      }
      scroll-select {
        width: 0;
        flex: 1 1 auto;
      }
    `;
  }

  constructor() {
    super();
    this.internals = this.attachInternals();

    if (!this._value) {
      this._value = new Date();
      this._value.setHours(0,0,0,0)
    }
    this.year = this.value.getFullYear();
    this.week = getWeekNumber(this.value);
    this.index = 0;
  }

  get numWeeks() {
    return parseInt(this.getAttribute('num-weeks') || '4');
  }

  get week() {
    return this._week;
  }

  set week(val) {
    this._week = val;
    this.requestUpdate();
  }

  _extraStyles(d) {
    return '';
  }
  get extraStyles() {
    return this._extraStyles;
  }
  set extraStyles(v) {
    this._extraStyles = v;
    this.requestUpdate();
  }

  _extraClasses(d) {
    const ret = {}
    if (toISODate(d) === toISODate(this.value)) ret.selected = true;
    if ([0, 6].includes(d.getDay())) ret.disabled = true;
    return ret;
  }
  get extraClasses() {
    return this._extraClasses;
  }
  set extraClasses(v) {
    this._extraClasses = v;
    this.requestUpdate();
  }

  getDatesOffset(x) {
    const monday = getStartOfWeek(this.week+x, this.year);
    const dates = new Array(7).fill(0).map((v, i)=>new Date(monday));
    dates.forEach((d, i)=>d.setDate(d.getDate() + i));
    return dates;
  }

  getMonthName(x) {
    const days = this.getDatesOffset(x);
    const mondayMonth = localeMonth.format(days[0]);
    const sundayMonth = localeMonth.format(days[6]);
    return mondayMonth + (mondayMonth !== sundayMonth ? (' - ' + sundayMonth) : '');
  }

  get index() {
    return this._index;
  }
  set index(val) {
    if (val >= this.numWeeks) return;
    if (val < 0) return;
    this._index = val;
    this.requestUpdate();
  }

  get value() {
    return new Date(this._value);
  }
  set value(v) {
    v.setHours(0,0,0,0)
    if (this.extraClasses(v).disabled) return;
    this._value = v;
    this.internals.setFormValue(this._value);
    this.dispatchEvent(new Event('value-change'), {bubbles: true});
    this.dispatchEvent(new Event('change'), {bubbles: true});
    this.requestUpdate();
  }

  render() {
    return html`
      <div id="month">
        <div>${this.getMonthName(this.index)}</div>
      </div>
      <div class="week">
        <div class="handle" ?disabled=${this.index===0} @click=${()=>this.index--}>&lt;</div>
        <scroll-select .index=${this.index} @indexChange=${(e)=>this.index = e.target.index}>
          ${new Array(this.numWeeks).fill(0).map((w,i)=>html`
            <div class="days">
              ${this.getDatesOffset(i).map(d=>html`
                <div class="circle">
                  <div style=${this.extraStyles(d)} class=${classMap({day: true, ...this.extraClasses(d)})} @click=${()=>{this.value = d;}}>
                    <span class="weekday">${localeWeekday.format(d)}</span>
                    <span class="daydigit">${localeDay.format(d)}.</span>
                  </div>
                </div>
              `)}
            </div>
          `)}
        </scroll-select>
        <div class="handle" ?disabled=${this.index>=this.numWeeks-1} @click=${()=>this.index++}>&gt;</div>
      </div>
    `;
  }
}

customElements.define('select-week', ScrollSelectDate);
export const SelectWeek = (props)=>{
  const [customElementProps, ref] = useCustomElement(props);

  return <select-week {...customElementProps} ref={ref} />;
}
export default SelectWeek;
