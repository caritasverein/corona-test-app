import {Checkbox} from '@material/mwc-checkbox';

export class CheckboxFA extends Checkbox {
  static get formAssociated() {return true}
  get required() {
    return this.hasAttribute('required');
  }
  set required(v) {
    if(v) this.setAttribute('required', v);
    else this.removeAttribute('required');

    if(v) this.formElement.setAttribute('required', v);
    else this.formElement.removeAttribute('required');
  }

  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state) {
    if (this.formElement) {
      this.formElement.value = state;
      this.updateValidity();
    } else this.restoreValue = state;
  }

  formResetCallback() {
    this.checked = this.hasAttribute('checked');
    this.formElement.checked = this.checked;
    this._checkValidity();
  }

  connectedCallback() {
    this.internals = this.attachInternals();
    super.connectedCallback();
  }

  _checkValidity() {
    const validity = this.formElement.validity;

    return validity.valid;
  }

  get validationMessage() {
    return '';
  }
  set validationMessage(v) {

  }

  updateValidity(report) {
    const isValid = this._checkValidity();

    this.internals.setValidity(
      this.formElement.validity,
      this.formElement.validationMessage
    );

    if (isValid) this.validationMessage = '';
    if (!isValid) this.setAttribute('invalid', 'invalid');
    else this.removeAttribute('invalid');

    if (report) {
      this.validationMessage = this.formElement.validationMessage;
      this.isUiValid = isValid;
      this.style.setProperty(
        '--mdc-checkbox-unchecked-color',
        isValid?'inherit':'var(--mdc-theme-error, #b00020)'
      );
    }
  }

  reportValidity() {
    const validity = this.formElement.validity;
    this.validationMessage = this.formElement.validationMessage;
    this.isUiValid = validity.valid;
    this.style.setProperty(
      '--mdc-checkbox-unchecked-color',
      validity.valid?'inherit':'var(--mdc-theme-error, #b00020)'
    );
  }

  updateValue(report=false) {
    this.internals.setFormValue(this.formElement.checked ? this.formElement.value || 'true' : null);
    this.updateValidity(report);
  }

  firstUpdated() {
    super.firstUpdated();
    this.required = this.hasAttribute('required');

    if (this.restoreValue) this.formElement.value = this.restoreValue;

    if (this.internals.form)
      this.internals.form.addEventListener('formdata', (e)=>{
        e.preventDefault();
        this.updateValidity(true);
      });

    this.formElement.addEventListener('invalid', ()=>this.updateValidity(true));
    this.addEventListener('invalid', ()=>this.reportValidity());
    this.updateValidity(false);

    this.formElement.addEventListener('change', ()=>this.updateValue(true));
    this.updateValue()
  }
}

import {registerComponent} from '../registerComponent.js';
export default registerComponent('mwc-fa-checkbox', CheckboxFA);
