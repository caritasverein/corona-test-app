import {TextField} from '@material/mwc-textfield';

export class TextFieldFA extends TextField {
  static get formAssociated() {return true}

  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state) {
    this.value = state;
    this.formElement.value = this.value;
    this._checkValidity();
  }

  formResetCallback() {
    this.value = this.getAttribute('value') || '';
    this.formElement.value = this.value;
    this._checkValidity();
  }

  connectedCallback() {
    this.internals = this.attachInternals();
    super.connectedCallback();
  }

  updateValidity(report) {
    const isValid = this._checkValidity();

    this.internals.setValidity(
      this._validity,
      this.formElement.validationMessage
    );
    if (isValid) this.validationMessage = '';
    if (!isValid) this.internals.setFormValue(null);
    if (!isValid) this.setAttribute('invalid', 'invalid');
    else this.removeAttribute('invalid');

    if (report) {
      this.validationMessage = this.formElement.validationMessage;
      this.mdcFoundation.setValid(isValid);
      this.isUiValid = isValid;
    }
  }

  setCustomValidity(message) {
    this.formElement.setCustomValidity(message);
    this.updateValidity(true);
  }

  updateValue() {
    this.internals.setFormValue(this.formElement.value);
    this.updateValidity(false);
  }

  firstUpdated() {
    super.firstUpdated();
    console.log(this.name);

    if (this.internals.form)
      this.internals.form.addEventListener('formdata', ()=>this.updateValidity(true));

    this.formElement.addEventListener('invalid', ()=>this.updateValidity(true));
    this.addEventListener('invalid', ()=>this.updateValidity(true));
    this.updateValidity(false);

    this.formElement.addEventListener('change', ()=>this.updateValue());
    this.updateValue()
  }
}

import {registerComponent} from '../registerComponent.js';
export default registerComponent('mwc-fa-textfield', TextFieldFA);
