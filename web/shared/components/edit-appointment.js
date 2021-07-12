import React from 'react';
import {
  html,
  component,
} from 'haunted';
import '@material/mwc-formfield';
import './mwc-fa-checkbox';
import './mwc-fa-textfield';
import '@material/mwc-button';
import '@material/mwc-dialog';

const strings = {
  save: ()=>`Absenden`,
  cancel: ()=>`Abbrechen`,
  dialogBack: ()=>`zurück`,
  dialogAhead: ()=>`fortfahren`,
  contactDetailDetail: ()=>`Bitte geben Sie in mindestens 1 Feld Ihre Kontaktdaten ein. Dann können wir mit Ihnen Kontakt aufnehmen – zum Beispiel bei Termin\u2011Verschiebungen. Wenn Sie Ihre Handy-Nummer und/oder E-Mail-Adresse angeben, bekommen Sie Ihr Ergebnis innerhalb von 30 Minuten nach dem Test elektronisch zugeschickt. Sie können aber auch vor Ort ein ausgedrucktes Formular mitnehmen.`,
  acceptTerms: ()=>`Ich erkläre mich mit der oben stehenden Vereinbarung einverstanden`,
  dataPolicy: ()=>`Ich erkläre mich einverstanden, dass zum Zweck der Abrechnung und zum Schutz potentiell weiterer Kontaktpersonen mein Befundergebnis sowie meine Kontaktdaten (Name, Anschrift) durch den Caritas-Verein Altenoythe erhoben und gespeichert werden. Die erhobenen Daten können zum Zweck der Abrechnung mit der Kassenärztlichen Vereinigung genutzt werden und unterliegenden der Gesetzlichen Speicherdauer (10 Jahre).
  Die Befundergebnisse können im Sinne der Teststrategie an das Gesundheitsamt, Hausarzt, gesetzlicher Vertreter übermittelt werden.
  Mir ist bewusst, dass mein Einverständnis jederzeit und ohne Angabe von Gründen schriftlich widerrufen werden kann! Die Einwilligung ist freiwillig und gilt zeitlich unbeschränkt.`,
  confirmNoContact: ()=>`Sie haben weder eine Handynummer noch eine E-Mail-Adresse angegeben. Wenn Sie fortfahren können wir Ihnen Ihr Testergebnis nicht automatisch zusenden.`,
  alertNoContact: ()=>`Sie haben keine Kontaktmöglichkeit angegeben. Bitte geben Sie mindestens eine Kontaktmöglichkeit an.`,
  cwaReimport: ()=>`Sie haben Ihren Termin bereits in die Corona-Warn-App übertragen.
  Wenn Sie fortfahren, müssen Sie anschließend Ihren Test aus der Corona-Warn-App entfernen und erneut übertragen.
  Andernfalls wird Ihr Testergebnis möglicherweise nicht übermittelt.`
};

const appointmentDetail = (admin)=>({
  "nameGiven": {
    label: 'Vorname',
    required: true,
    type: 'text',
    autocomplete: 'given-name',
    icon: 'person',
  },
  "nameFamily": {
    label: 'Nachname',
    required: true,
    type: 'text',
    autocomplete: 'family-name',
    icon: 'badge',
  },
  "address": {
    label: 'Straße, Hausnummer',
    required: true,
    type: 'text',
    icon: 'home',
    autocomplete: 'address-line1',
    get: (v)=>v?v.split('\n')[0]:'',
  },
  "town": {
    label: 'PLZ, Ort',
    required: true,
    type: 'text',
    icon: 'location_city',
    autocomplete: 'address-line2',
    pattern: '^[0-9]{5}(,| ) ?.+$',
    get: (_, v)=>v.address?v.address.split('\n')[1]:'',
  },
  "dateOfBirth": {
    label: 'Geburtsdatum',
    required: true,
    type: 'text',
    icon: 'cake',
    get: (v)=>v?new Date(new Date(v).toISOString().split('T')[0]).toLocaleDateString():'',
    pattern: '^\\s*(3[01]|[12][0-9]|0?[1-9])\\.(1[012]|0?[1-9])\\.((?:19|20)?\\d{2})\\s*$',
    placeholder: 'tt.mm.jjjj',
    autocomplete: 'bday',
    set: (v)=>{
        if (!v || v.split('.').length < 3) return null;
        let [day, month, year] = v.split('.').map(v=>parseInt(v));
        if (year < 1900) {
          if (year < (new Date().getFullYear() % 100)) year += 2000;
          else year += 1900;
        }
        return new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
    },
  },
  "desc1": {
    type: admin?"hidden":"description",
    text: strings.contactDetailDetail()
  },
  "phoneMobile": {
    label: 'Handynummer',
    type: 'tel',
    icon: 'smartphone',
    pattern: '^(0|\\+49)(15|16|17)[0-9]+$',
    autocomplete: 'mobile tel',
    change: (v)=>(v.replace('+49', '0').replace(/[^0-9\+]/g, '') || ''),
    set: (v)=>(v.replace('+49', '0').replace(/[^0-9]/g, '') || null),
  },
  "phoneLandline": {
    label: 'Festnetznummer',
    type: 'tel',
    icon: 'phone',
    autocomplete: 'home tel',
    pattern: '^(0|\\+49)[2-9][0-9]+$',
    change: (v)=>(v.replace('+49', '0').replace(/[^0-9\+]/g, '') || ''),
    set: (v)=>(v.replace('+49', '0').replace(/[^0-9]/g, '') || null),
  },
  "email": {
    label: 'E-Mail',
    type: 'email',
    icon: 'email',
    autocomplete: 'home email',
    set: (v)=>(v.replace(/[\s]/g, ' ') || null),
  },
});

function focusNext(el, rev=false) {
  const names = Object.entries(appointmentDetail());
  if (rev) names.reverse();
  let nextIndex = names.findIndex(([key, value])=>key===el.getAttribute('name')) + 1;
  while (names[nextIndex] && !names[nextIndex][1].label) nextIndex++;
  const nextName = names[nextIndex];
  if (!nextName) return;
  const form = el.form || el.internals.form;
  form.querySelector(`[name="${nextName[0]}"]`).focus();
}

let searchAbort = new AbortController();
function search(e, el) {
  if (!e.target.value) return;
  searchAbort.abort();
  searchAbort = new AbortController();
  fetch('/api/admin/userlist?q='+encodeURIComponent(e.target.value), {signal: searchAbort.signal})
    .then(res=>res.json())
    .then(res=>{
      el.appointment = {...el.appointment, ...res}
    })

}

function EditAppointment(props) {
  const {appointment, update, cancel, admin, hasuserlist} = props;

  const submit = (e)=>{
    if (e.detail && e.detail.action === 'cancel') return;
    const acceptedNoContact = e.detail && e.detail.action === 'accept';

    let form = e.target;
    while(!(form instanceof HTMLFormElement)) form = form.parentNode;
    e.preventDefault();

    const valid = form.reportValidity();
    if (!valid) {
      console.log(form.querySelector('[invalid], :invalid'), valid)
      form.querySelector('[invalid], :invalid')
        .scrollIntoView({behavior: "smooth", block: "center"});
      return;
    }

    const check = appointmentDetail(admin)
    const entries = [...new FormData(form).entries()]
      .map(([k, v]) => [
        k,
        check[k] && check[k].set ? check[k].set(v.trim()) : v.trim()
      ]);

    const data = Object.fromEntries(entries.reverse());
    console.log(JSON.stringify(data));
    data.address += '\n'+data.town;
    delete data.town;

    if (!data.phoneLandline && !data.phoneMobile && !data.email) {
      this.shadowRoot.querySelector('#alertNoContact').show();
      return;
    }

    if (!acceptedNoContact) {
      if (!data.phoneMobile && !data.email) {
        this.shadowRoot.querySelector('#confirmNoContact').show();
        return;
      }
    }
    update(data);
  }

  return html`
    <style>
      mwc-icon {
        vertical-align: -2px;
        --mdc-icon-size: 1em;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
    </style>
    <form @submit=${submit}>
      <input type="submit" style="display: none"/>
      <input type="hidden" name="time" value=${appointment.time} />
      ${admin ? html`<mwc-fa-textfield
        type="search"
        label="Suche"
        iconTrailing="search"
        @input=${(e)=>search(e, this)}
        @keypress=${(e)=>{if (e.key==='Enter') {focusNext(e.target, e.shiftKey); e.preventDefault();}}}
      ></mwc-fa-textfield>`:''}
      ${Object.entries(appointmentDetail(admin)).map(([name, def])=>{
        if (def.type==='description') return html`<p>
          ${def.text}
        </p>`

        if (def.type==='hidden') return '';

        return html`
          <mwc-fa-textfield
            type=${def.type || 'text'}
            name=${name || ''}
            ?required=${def.required}
            pattern=${def.pattern || ''}
            autocomplete=${def.autocomplete || ''}
            label=${def.label || name}
            iconTrailing=${def.icon || name}
            value=${def.get?def.get(appointment[name]||'', appointment):appointment[name]||''}
            @input=${(e)=>def.change ? e.target.value = def.change(e.target.value) : e.target.value}
            @keypress=${(e)=>{if (e.key==='Enter') {focusNext(e.target, e.shiftKey); e.preventDefault();}}}
          ></mwc-fa-textfield>
        `
      })}
      ${admin ? '' : html`
        <p style='font-size: 90%'>${strings.dataPolicy()}</p>
        <mwc-formfield label=${'* ' + strings.acceptTerms()}>
          <mwc-fa-checkbox
            required
            ?checked=${appointment.nameFamily}
            @invalid=${(e)=>{
              e.target.parentNode.style.setProperty('--mdc-theme-text-primary-on-background', 'var(--mdc-theme-error, #b00020)');
            }}
          ></mwc-fa-checkbox>
        </mwc-formfield>
      `}

      ${appointment.cwasalt ? html`
        <p style='color: red'>${strings.cwaReimport()}</p>
      ` : ''}

      <mwc-button
        class="ok"
        raised
        icon="send"
        @click=${submit}
      >${strings.save()}</mwc-button>
      <mwc-dialog id="confirmNoContact" @closed=${submit}>
        <div>${strings.confirmNoContact()}</div>
        <mwc-button
          raised
          slot="primaryAction"
          dialogAction="cancel"
        >${strings.dialogBack()}</mwc-button>
        <mwc-button
            slot="secondaryAction"
            dialogAction="accept"
        >${strings.dialogAhead()}</mwc-button>
      </mwc-dialog>
      <mwc-dialog id="alertNoContact">
        <div>${strings.alertNoContact()}</div>
        <mwc-button
          raised
          slot="primaryAction"
          dialogAction="cancel"
        >${strings.dialogBack()}</mwc-button>
      </mwc-dialog>
      ${cancel ? html`
        <mwc-button
          style="--mdc-theme-primary: #EE6524"
          raised
          icon="close"
          @click=${cancel}
        >${strings.cancel()}</mwc-button>
      ` : ''}
    </form>
  `;
}

import {registerComponent} from '../registerComponent.js';
export default registerComponent('edit-appointment', EditAppointment);
