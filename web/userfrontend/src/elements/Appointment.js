import React, {useState} from 'react';
import '@material/mwc-button';
import '@material/mwc-formfield';
import '@material/mwc-icon';

import { toast } from 'react-toastify';
import printjs from 'print-js';

import EditAppointment from 'shared/components/edit-appointment.js';
import {useApi, apiFetch, useInterval} from '../hooks/useApi.js';
import {useRoute} from '../hooks/useRoute.js';
import {useStorage} from '../hooks/useStorage.js';
import {localeFull} from '../util/date.js';

const strings = {
  toastAppointmentError: (err)=>`Es ist ein Fehler aufgetreten. Bitte versuche es erneut!`,
  yourAppointment: ()=>`Ihr Termin`,
  yourAppointmentAt: (date)=>`am ${date} Uhr`,
  testStatusDetail: (status)=>({
    loading: 'Wird geladen...',
    reservation: `Dieser Termin ist nun für Sie geblockt. Bitte füllen Sie das folgende Formular aus. Die Daten werden für die Test-Bestätigung benötigt. Klicken Sie dann auf „speichern“. Erst danach ist der Termin verbindlich für Sie reserviert!`,
    pending: <>Ihr Termin wurde bestätigt. Bitte zum Termin unbedingt einen Lichtbildausweis (Personalausweis oder Führerschein) mitbringen!<br />WICHTIG: Bitte 30 Minuten vor dem Test nicht essen, trinken oder rauchen!</>,
    processing: 'Ihr Test wird derzeit bearbeitet. Bitte beachten Sie, dass es bis zu 30 Minuten dauern kann, bis Ihr Ergebnis feststeht.',
    completed: 'Der Test wurde abgeschlossen.',
  })[status],
  yourResult: ()=>`Ihr Ergebnis`,
  saveSuccess: ()=>`Ihre Angaben wurden erfolgreich gespeichert!`,
  change: ()=>`Ändern`,
  personalDetail: ()=>`Persönliche Daten`,
  contactDetail: ()=>`Kontaktdaten`,
  phoneMobile: ()=>`Handynummer`,
  phoneLandline: ()=>`Festnetznummer`,
  email: ()=>`E-Mail`,
  noPhoneMobile: ()=>`Keine`,
  noPhoneLandline: ()=>`Keine`,
  noEmail: ()=>`Keine`,
  linkMore: ()=>`Weitere Informationen`,
  testLocation: ()=>`Testzentrum`,
  testLocationAddress: ()=><>Alte Wassermühle<br />Alte Mühlenstraße 6<br />26169 Friesoythe</>,
  testLocationMaps: ()=>`Alte Mühlenstraße 6, 26169 Friesoythe`,
  startNavigation: ()=>`Maps`,
  testResult: (res)=>({
    positive: 'Positiv',
    negative: 'Negativ',
    invalid: 'Ungültig',
  })[res],
  testResultDetail: (res)=>({
    positive: <>Begeben Sie sich unverzüglich in Quarantäne! Ihr positives Testergebnis wird von uns an das Gesundheitsamt weitergeleitet. Zur Bestätigung muss ein PCR-Test durchgeführt werden.<br />Sie können den PCR-Test bei Ihrem Hausarzt oder in unserer Kooperationspraxis Dr. Zimmermann, Am Alten Hafen 18, 26169 Friesoythe, Telefon 04491 921020, durchführen lassen. Bitte melden Sie sich vorher telefonisch an und betreten Sie auf keinen Fall die Praxis! Der PCR-Test wird dort an der Hintertür der Praxis durchgeführt</>,
    negative: `Ein negatives Testergebnis hat nach der aktuellen Regelung 24 Stunden Gültigkeit. Das Testergebnis ist nur eine Momentaufnahme für den Tag des Tests. Auch ein negatives Testergebnis schließt die Möglichkeit einer bestehenden Infektion mit SARS-CoV-2 nicht zu 100% aus.`,
    invalid: `Leider gab es ein Problem bei der Test-Durchführung. Bitte wiederholen Sie den Test! Kommen Sie dafür heute innerhalb der vorgegebenen Test-Zeiten (dienstags von 10:00 bis 14:00 und donnerstags von 14:00 bis 18:00) noch einmal ins Test-Zentrum „Alte Wassermühle“. Sie können auch einen neuen Termin vereinbaren.`,
  })[res],
  printResult: ()=>`Ergebnis Drucken`,
  cancelAppointmentDetail: ()=>`Sie möchten Ihren Termin absagen? Dann klicken Sie hier. Sie möchten Ihren Termin ändern? Stornieren Sie zunächst hier Ihren alten Termin. Buchen Sie dann einen neuen Termin.`,
  cancelAppointment: ()=>`Termin Absagen`,
  printAppointmentDetail: ()=>`Sie möchten eine „Erinnerungshilfe“? Hier können Sie Ihren gebuchten Termin ausdrucken.`,
  printAppointment: ()=>`Termin Drucken`,
  deleteLocalAppointmentDetail: ()=>`Sie haben Ihren Termin auf diesem Gerät gespeichert. Besuchen Sie ${window.location.host} erneut, so können Sie Ihr Testergebnis abrufen oder den Termin absagen.`,
  deleteLocalAppointment: ()=>`Von diesem Gerät löschen`,
  storeLocalAppointmentDetail: ()=>`Sie können Ihren Termin auf diesem Gerät speichern. Dann können Sie diese Seite jederzeit wieder aufrufen. Dort können Sie nach Test-Ende auch Ihr Testergebnis sehen.`,
  storeLocalAppointment: ()=>`Auf diesem Gerät speichern`,
  backToAppointmentSelection: ()=>`Zurück zur Terminübersicht`,
}

function getAppointmentStatus(appointment) {
  if (!appointment) return 'loading';
  if (!appointment.nameFamily) return 'reservation';
  if (appointment.testResult) return 'completed';
  if (appointment.testStartedAt) return 'processing';
  return 'pending';
}

export const Appointment = ({uuid})=>{
  const [route, setRoute] = useRoute();
  const [storedAppointments, setStoredAppointments] = useStorage('appointments', '[]');
  const isStored = !!storedAppointments.find((a)=>a.uuid===uuid);
  const [appointment, updateAppointment, appointmentError] = useApi('appointments/'+uuid);
  useInterval(updateAppointment, 6 * 1000);

  const testStatus = getAppointmentStatus(appointment);
  const [editMode, setEditMode] = useState(testStatus==='reservation');
  if (!editMode && testStatus==='reservation') setEditMode(true);
  if (editMode && !(['reservation', 'pending']).includes(testStatus)) setEditMode(false);

  if (appointmentError) {
    if (appointmentError.status === 404) {
      if (storedAppointments.find(a=>a.uuid===uuid)) setStoredAppointments(sa=>sa.filter(a=>a.uuid!==uuid));
      return <>
        <h2>Der angegebene Termin konnte nicht gefunden werden</h2>
        <p>Möglicherweise ist er zu lange her oder wurde abgesagt.</p>
        <mwc-button
          fullwidth
          onClick={()=>window.location.pathname = '/'}
        >{strings.backToAppointmentSelection()}</mwc-button>
      </>;
    }
    if (appointmentError.status) {
      toast(`${strings.toastAppointmentError(appointmentError)} (${appointmentError.status} ${appointmentError.message})`);
      window.setTimeout(()=>{
        setRoute();
      }, 4000);
      return <></>;
    }
    return <></>;
  }
  if (testStatus === 'loading') return <h2><mwc-icon>hourglass_top</mwc-icon>&nbsp; {strings.testStatusDetail(testStatus)}</h2>;

  return <>
    <h3><mwc-icon
      style={{'--mdc-icon-size': '2rem', verticalAlign: '-8px'}}
    >event</mwc-icon>&nbsp; {strings.yourAppointment()}</h3>
    <h2>{strings.yourAppointmentAt(localeFull(appointment.time))}</h2>
    <p>{strings.testStatusDetail(testStatus)}</p>
    {appointment.testResult && <>
      <div style={{
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
      </div>
      <p>{strings.testResultDetail(appointment.testResult)}</p>
    </>}
    {editMode && <EditAppointment appointment={appointment} update={(data)=>{
      delete data.time;
      apiFetch('PATCH','appointments/'+uuid, data)
        .then(async ()=>{
          toast(strings.saveSuccess());
          await updateAppointment();
          setEditMode(false);
        }).catch(e=>{
          console.error(e);
          toast(e.message + ' ' + JSON.stringify(e.detail));
        });
    }} />}
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
      <h3 style={{marginBottom: '0.5rem'}}><mwc-icon>biotech</mwc-icon>&nbsp; {strings.testLocation()}:</h3>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div style={{display: editMode?'none':'flex', flexDirection:'column'}}>
          {strings.testLocationAddress()}
        </div>
        {testStatus==='pending' && <mwc-button
          class="secondary"
          raised
          icon="near_me"
          trailingIcon
          onClick={(e)=>{
            window.open('https://maps.google.com/?q='+encodeURIComponent(strings.testLocationMaps()), '_blank')
          }}
        >{strings.startNavigation()}</mwc-button>}
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
          onClick={(e)=>printjs(`/api/appointments/${encodeURIComponent(uuid)}/pdf`)}
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
      {testStatus !== 'reservation' && <mwc-button
        onClick={()=>window.location.pathname = '/'}
      >{strings.backToAppointmentSelection()}</mwc-button>}
    </div>
  </>
}

export default Appointment;