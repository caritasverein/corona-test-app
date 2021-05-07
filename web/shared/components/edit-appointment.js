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
  save: ()=>`Speichern`,
  contactDetailDetail: ()=>`Bitte geben Sie in mindestens 1 Feld Ihre Kontaktdaten ein. Dann können wir mit Ihnen Kontakt aufnehmen – zum Beispiel bei Termin\u2011Verschiebungen. Wenn Sie Ihre Handy-Nummer und/oder E-Mail-Adresse angeben, bekommen Sie Ihr Ergebnis innerhalb von 30 Minuten nach dem Test elektronisch zugeschickt. Sie können aber auch vor Ort ein ausgedrucktes Formular mitnehmen.`,
  acceptTerms: ()=>`Ich erkläre mich mir der oben stehenden Vereinbarung einverstanden`,
  dataPolicy: ()=>`Ich erkläre mich einverstanden, dass zum Zweck der Abrechnung und zum Schutz potentiell weiterer Kontaktpersonen mein Befundergebnis sowie meine Kontaktdaten (Name, Anschrift) durch den Caritas-Verein Altenoythe erhoben und gespeichert werden. Die erhobenen Daten können zum Zweck der Abrechnung mit der Kassenärztlichen Vereinigung genutzt werden und unterliegenden der Gesetzlichen Speicherdauer (10 Jahre).
  Die Befundergebnisse können im Sinne der Teststrategie an das Gesundheitsamt, Hausarzt, gesetzlicher Vertreter übermittelt werden.
  Mir ist bewusst, dass mein Einverständnis jederzeit und ohne Angabe von Gründen schriftlich widerrufen werden kann! Die Einwilligung ist freiwillig und gilt zeitlich unbeschränkt.`,
};

const appointmentDetail = {
  "nameGiven": {
    label: 'Vorname',
    required: true,
    type: 'text',
    icon: 'person',
  },
  "nameFamily": {
    label: 'Nachname',
    required: true,
    type: 'text',
    icon: 'badge',
  },
  "address": {
    label: 'Adresse, Hausnummer',
    required: true,
    type: 'text',
    icon: 'home',
    get: (v)=>v?v.split('\n')[0]:'',
  },
  "town": {
    label: 'PLZ, Ort',
    required: true,
    type: 'text',
    icon: 'location_city',
    pattern: '^[1-9]{5}(,| ) ?.+$',
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
    type: "description",
    text: strings.contactDetailDetail()
  },
  "phoneMobile": {
    label: 'Handynummer',
    type: 'tel',
    icon: 'smartphone',
    pattern: '^(0|\\+49)(15|16|17)[0-9]+$',
    change: (v)=>(v.replace('+49', '0').replace(/[^0-9\+]/g, '') || ''),
    set: (v)=>(v.replace('+49', '0').replace(/[^0-9]/g, '') || null),
  },
  "phoneLandline": {
    label: 'Festnetznummer',
    type: 'tel',
    icon: 'phone',
    pattern: '^(0|\\+49)[2-9][0-9]+$',
    change: (v)=>(v.replace('+49', '0').replace(/[^0-9\+]/g, '') || ''),
    set: (v)=>(v.replace('+49', '0').replace(/[^0-9]/g, '') || null),
  },
  "email": {
    label: 'E-Mail',
    type: 'email',
    icon: 'email',
    set: (v)=>(v.replace(/[\s]/g, ' ') || null),
  },
};


function EditAppointment(props) {
  const {appointment, update} = props;

  const submit = (e)=>{
    if (e.detail && e.detail.action === 'cancel') return;
    const acceptedNoContact = e.detail && e.detail.action === 'accept';

    let form = e.target;
    while(!(form instanceof HTMLFormElement)) form = form.parentNode;
    e.preventDefault();

    const valid = form.reportValidity();
    if (!valid) {
      form.querySelector('[invalid], :invalid')
        .scrollIntoView({behavior: "smooth", block: "center"});
      return;
    }

    const entries = [...new FormData(form).entries()]
      .map(([k, v]) => [
        k,
        appointmentDetail[k] && appointmentDetail[k].set ? appointmentDetail[k].set(v) : v
      ]);

    const data = Object.fromEntries(entries);
    data.address += '\n'+data.town;
    delete data.town;

    if (!acceptedNoContact) {
      if (!data.phoneMobile && !data.phoneLandline) {
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
      ${Object.entries(appointmentDetail).map(([name, def])=>
        def.type==='description' ? html`<p>
          ${def.text}
        </p>`:html`<mwc-fa-textfield
          type=${def.type || 'text'}
          name=${name || ''}
          ?required=${def.required}
          pattern=${def.pattern || ''}
          label=${def.label || name}
          iconTrailing=${def.icon || name}
          value=${def.get?def.get(appointment[name]||'', appointment):appointment[name]||''}
          @input=${(e)=>def.change ? e.target.value = def.change(e.target.value) : e.target.value}
        ></mwc-fa-textfield>
      `)}
      <p style='font-size: 90%'>${strings.dataPolicy()}</p>
      <mwc-formfield label=${'* ' + strings.acceptTerms()}>
        <mwc-fa-checkbox required ?checked=${appointment.nameFamily}></mwc-fa-checkbox>
      </mwc-formfield>

      <mwc-button
        class="ok"
        raised
        icon="send"
        @click=${submit}
      >${strings.save()}</mwc-button>
      <mwc-dialog id="confirmNoContact" @closed=${submit}>
        <div>
          Sie haben weder eine Telefonnummer noch eine E-Mail-Adresse angegeben. Wenn Sie fortfahren können wir Ihnen keine Terminänderungen mitteilen!<br/>
          Bitte geben Sie mindestens eine Konkaktmöglichkeit an.
        </div>
        <mwc-button
          raised
          slot="primaryAction"
          dialogAction="cancel"
        >zurück</mwc-button>
        <mwc-button
            slot="secondaryAction"
            dialogAction="accept"
        >fortfahren</mwc-button>
      </mwc-dialog>
    </form>
  `;
}

import {registerComponent} from '../registerComponent.js';
export default registerComponent('edit-appointment', EditAppointment);
