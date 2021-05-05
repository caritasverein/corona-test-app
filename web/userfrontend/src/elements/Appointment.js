import React, {useState, useEffect} from 'react';
import './mwc-fa-textfield.js';
import './mwc-fa-checkbox.js';
import '@material/mwc-button';
import '@material/mwc-checkbox';
import '@material/mwc-formfield';
import '@material/mwc-icon';

import { toast } from 'react-toastify';
import printjs from 'print-js';

import {useApi, apiFetch, useInterval} from '../hooks/useApi.js';
import {useStorage} from '../hooks/useStorage.js';
import {localeFull} from '../util/date.js';

const strings = {
  toastAppointmentError: (err)=>`Es ist ein Fehler aufgetreten. Bitte versuche es erneut!`,
  yourAppointment: ()=>`Ihr Termin`,
  yourAppointmentAt: (date)=>`am ${date} Uhr`,
  testStatusDetail: (status)=>({
    loading: 'Wird geladen...',
    reservation: `Ihr Termin wurde erfolgreich reserviert. Sie haben nun etwas Zeit Ihren Termin zu bestätigen, indem Sie Ihre das folgende Formular ausfüllen und anschließend auf "speichern" drücken.`,
    pending: 'Ihr Termin wurde bestätigt. Bitte kommen Sie pünktlich.',
    processing: 'Ihr Test wird derzeit bearbeitet. Bitte beachten Sie, dass es bis zu 30 Minuten dauern kann, bis Ihr Ergebnis feststeht.',
    completed: 'Der Test wurde abgeschlossen. Ihr Ergebnis ist nun für 48 Stunden verfügbar.',
  })[status],
  yourResult: ()=>`Ihr Ergebnis`,
  dataPolicy: ()=>`Wofür werden diese Daten verwendet? Diese Daten dienen in erster Linie dazu, Kontakt mit Ihnen aufzunehmen. [...]`,
  save: ()=>`Speichern`,
  saveSuccess: ()=>`Ihre Angaben wurden erfolgreich gespeichert!`,
  change: ()=>`Ändern`,
  personalDetail: ()=>`Persönliche Daten`,
  contactDetail: ()=>`Kontaktdaten`,
  contactDetailDetail: ()=>`Bitte geben Sie an, wie wir Sie kontaktieren können. Über eine Handynummer oder E-Mail kommen Sie dann auch zu Ihrem Testergebnis.`,
  phoneMobile: ()=>`Handynummer`,
  phoneLandline: ()=>`Festnetznummer`,
  email: ()=>`E-Mail`,
  noPhoneMobile: ()=>`Keine`,
  noPhoneLandline: ()=>`Keine`,
  noEmail: ()=>`Keine`,
  acceptTerms: ()=>`Ich bin damit einverstanden, dass [...]`,
  linkMore: ()=>`Weitere Informationen`,
  testResult: (res)=>({
    positive: 'Positiv',
    negative: 'Negativ',
    invalid: 'Ungültig',
  })[res],
  printResult: ()=>`Ergebnis Drucken`,
  cancelAppointmentDetail: ()=>`Der Zeitpunkt Ihres Termins kann nicht geändert werden. Nutzen Sie hierfür die Funktion "Termin absagen" und buchen Sie anschließend einen neuen Termin.`,
  cancelAppointment: ()=>`Termin Absagen`,
  printAppointmentDetail: ()=>`Sie können sich Ihren Termin auch ausdrucken. So haben Sie eine handfeste Erinnerung.`,
  printAppointment: ()=>`Termin Drucken`,
  deleteLocalAppointmentDetail: ()=>`Sie haben Ihren Termin auf diesem Gerät gespeichert. Besuchen Sie ${window.location.host} erneut, so können Sie Ihr Testergebnis abrufen oder den Termin absagen.`,
  deleteLocalAppointment: ()=>`Von diesem Gerät löschen`,
  storeLocalAppointmentDetail: ()=>`Sie haben die Möglichkeit, Ihren Termin auf diesem Gerät zu speichern. Besuchen Sie ${window.location.host} erneut, so können Sie den Termin problemlos absagen, oder Ihr Testergebnis abrufen.`,
  storeLocalAppointment: ()=>`Auf diesem Gerät speichern`,
  backToAppointmentSelection: ()=>`Zurück zur Terminübersicht`,
}

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
    pattern: '^[1-9]{5}(,| ) ?.*+$',
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
    set: (v)=>(v.replace('+49', '0').replace(/[^0-9]/g, '') || null),
  },
  "phoneLandline": {
    label: 'Festnetznummer',
    type: 'tel',
    icon: 'phone',
    pattern: '^(0|\\+49)[2-9][0-9]+$',
    set: (v)=>(v.replace('+49', '0').replace(/[^0-9]/g, '') || null),
  },
  "email": {
    label: 'E-Mail',
    type: 'email',
    icon: 'email',
    set: (v)=>(v.replace(/[\s]/g, ' ') || null),
  },
};

function getAppointmentStatus(appointment) {
  if (!appointment) return 'loading';
  if (!appointment.nameFamily) return 'reservation';
  if (appointment.testResult) return 'completed';
  if (appointment.testStartedAt) return 'processing';
  return 'pending';
}

export const Appointment = ({uuid})=>{
  const [storedAppointments, setStoredAppointments] = useStorage('appointments', '[]');
  const isStored = !!storedAppointments.find((a)=>a.uuid===uuid);
  const [appointment, updateAppointment, appointmentError] = useApi(
    'GET', 'appointments/'+uuid, undefined, undefined, true,
  );
  useInterval(updateAppointment, 5 * 1000);

  const testStatus = getAppointmentStatus(appointment);
  const [editMode, setEditMode] = useState(testStatus==='reservation');
  if (!editMode && testStatus==='reservation') setEditMode(true);
  if (editMode && !(['reservation', 'pending']).includes(testStatus)) setEditMode(false);

  if (testStatus === 'loading') return <h2><mwc-icon>hourglass_top</mwc-icon>&nbsp; {strings.testStatusDetail(testStatus)}</h2>;
  if (appointmentError) {
    toast(`${strings.toastAppointmentError(appointmentError)} (${appointmentError.status} ${appointmentError.message})`);
    window.setTimeout(()=>{
      if (appointmentError.status === 404) {
        setStoredAppointments(sa=>sa.filter(a=>a.uuid!==uuid));
      }
      window.location.pathname = '/';
    }, 5000);
    return <></>;
  }

  return <>
    <h3><mwc-icon>event</mwc-icon>&nbsp; {strings.yourAppointment()}</h3>
    <h2>{strings.yourAppointmentAt(localeFull(appointment.time))}</h2>
    <p>{strings.testStatusDetail(testStatus)}</p>
    {appointment.testResult && <div style={{
      background: ({
        positive: '#F44',
        negative: '#0C0',
        invalid:  '#FC0',
      })[appointment.testResult],
      padding: '2rem',
      borderRadius: '1rem',
      textAlign: 'center',
      boxShadow: '2px 2px 8px 0px #0008',
    }}>
        <h2>{strings.yourResult()}: <span style={{textDecoration: 'underline'}}>{strings.testResult(appointment.testResult)}</span></h2>
    </div>}
    {editMode && <form style={{display: 'flex', flexDirection:'column', gap: '0.5rem'}}>
      {Object.entries(appointmentDetail).map(([name, def])=><React.Fragment key={name}>
        {def.type==='description' ? <p>
          {def.text}
        </p>:<mwc-fa-textfield
          key={name}
          type={def.type || 'text'}
          name={name}
          required={def.required ?? null}
          pattern={def.pattern}
          label={def.label || name}
          iconTrailing={def.icon}
          value={def.get?def.get(appointment[name]??'', appointment):appointment[name]??''}
        ></mwc-fa-textfield>}
      </ React.Fragment>)}
      <mwc-formfield label={strings.acceptTerms()}>
        <mwc-fa-checkbox required></mwc-fa-checkbox>
      </mwc-formfield>
      <mwc-button
        class="ok"
        raised
        icon="send"
        onClick={(e)=>{
          e.preventDefault();
          let target = e.target;
          while(!(target instanceof HTMLFormElement)) target = target.parentNode;
          const form = target;
          const valid = form.reportValidity();
          if (!valid) {
            form.querySelector(':invalid')?.scrollIntoView?.({behavior: "smooth", block: "center"});
            return;
          }

          const entries = [...new FormData(form).entries()]
            .map(([k, v]) => [k, appointmentDetail[k].set ? appointmentDetail[k].set(v) : v]);

          const data = Object.fromEntries(entries);
          data.address += '\n'+data.town;
          delete data.town;

          // wait for additional information about requirements
          /*if (!data.phoneMobile && !data.phoneLandline) {
            form.querySelector(`[name="phoneMobile"]`).setCustomValidity("Invalid field.");
            form.reportValidity();
            return;
          } else {
            form.querySelector(`[name="phoneMobile"]`).setCustomValidity("");
          }*/

          apiFetch('PATCH','appointments/'+uuid, data)
            .then(async ()=>{
              toast(strings.saveSuccess());
              await updateAppointment();
              setEditMode(false);
            }).catch(e=>{
              console.error(e);
              toast(e.message + ' ' + JSON.stringify(e.detail));
            });
        }}
      >{strings.save()}</mwc-button>
      <p>{strings.dataPolicy()}</p>
    </form>}
    {!editMode && <>
      <h3 style={{marginBottom: '0.5rem'}}><mwc-icon>badge</mwc-icon>&nbsp; {strings.personalDetail()}:</h3>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div style={{display: editMode?'none':'flex', flexDirection:'column'}}>
          {appointment.nameGiven} {appointment.nameFamily}<br />
          {appointment.address}<br />
          {new Date(appointment.dateOfBirth).toLocaleDateString()}
        </div>
        {testStatus==='pending' && <mwc-button
          style={{flexGrow: '0'}}
          raised
          icon="edit"
          trailingIcon
          onClick={(e)=>{
            setEditMode((v)=>!v);
          }}
        >{strings.change()}</mwc-button>}
      </div>
      <h3 style={{marginBottom: '0.5rem'}}><mwc-icon>contact_mail</mwc-icon>&nbsp; {strings.contactDetail()}:</h3>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div style={{display: editMode?'none':'flex', flexDirection:'column'}}>
          {strings.phoneMobile()}: {appointment.phoneMobile || strings.noPhoneMobile()}<br />
          {strings.phoneLandline()}: {appointment.phoneLandline || strings.noPhoneLandline()}<br />
          {strings.email()}: {appointment.email || strings.noEmail()}
        </div>
        {testStatus==='pending' && <mwc-button
          style={{flexGrow: '0'}}
          raised
          icon="edit"
          trailingIcon
          onClick={(e)=>{
            setEditMode((v)=>!v);
          }}
        >{strings.change()}</mwc-button>}
      </div>
    </>}
    <h3 style={{marginBottom: 0, marginTop: '2rem'}}>Optionen</h3>
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      {appointment.testResult && <>
        <mwc-button
          raised
          onClick={(e)=>printjs(`/api/appointments/${encodeURIComponent(uuid)}/pdf`)}
        >{strings.printResult()}</mwc-button>
      </>}
      {(testStatus==='pending' || testStatus === 'reservation') && <>
        <p style={{marginBottom: 0}}>{strings.cancelAppointmentDetail()}</p>
        <mwc-button
          class="danger"
          raised
          icon="event_busy"
          onClick={(e)=>{
            if (!window.confirm('Möchen Sie den Termin wirklich absagen?')) return;
            setStoredAppointments((a)=>a.filter((a)=>a.uuid!==uuid));
            apiFetch('DELETE','appointments/'+uuid).then(()=>window.location.pathname = '/');
          }}
        >{strings.cancelAppointment()}</mwc-button>
      </>}
      {testStatus === 'pending' && <>
        <p style={{marginBottom: 0}}>{strings.printAppointmentDetail()}</p>
        <mwc-button
          raised
          icon="print"
        >{strings.printAppointment()}</mwc-button>

        {isStored ? <>
          <p style={{marginBottom: 0}}>{strings.deleteLocalAppointmentDetail()}</p>
          <mwc-button
            class="danger"
            raised
            icon="bookmark_remove"
            onClick={()=>{
              setStoredAppointments((a)=>a.filter((a)=>a.uuid!==uuid));
            }}
          >{strings.deleteLocalAppointment()}</mwc-button>
        </> : <>
          <p style={{marginBottom: 0}}>{strings.storeLocalAppointmentDetail()}</p>
          <mwc-button
            raised
            icon="bookmark_add"
            onClick={()=>{
              setStoredAppointments((a)=>a.find((a)=>a.uuid===uuid) ? a : [...a, {uuid, time: appointment.time}]);
            }}
          >{strings.storeLocalAppointment()}</mwc-button>
        </>}
      </>}
      <mwc-button
        onClick={()=>window.location.pathname = '/'}
      >{strings.backToAppointmentSelection()}</mwc-button>
    </div>
  </>
}

export default Appointment;
