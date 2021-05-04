import React from 'react';
import './App.css';
import '@material/mwc-top-app-bar-fixed';
import '@material/mwc-button';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {useStorage} from './hooks/useStorage.js';
import {useRoute} from './hooks/useRoute.js';
import {localeFull} from './util/date.js';
import Appointment from './elements/Appointment.js';
import NewAppointment from './elements/NewAppointment.js';

const strings = {
  locationName: ()=>`Testzentrum Wassermühle`,
  welcomeTolocationName: ()=>`Willkommen im Testzentrum Wassermühle`,
  storedAppointments: ()=>`Gespeicherte Termine`,
  yourAppointmentAt: (date)=>`Ihr Termin am ${date}`,
  newAppointment: ()=>`Neuen Termin vereinbaren`,
};

function App() {
  const [route, setRoute] = useRoute();
  const viewAppointment = (route[0] && route[0].length === 36) ? route[0] : undefined;

  const screen = (viewAppointment ? 'appointment' : route[0]) || 'welcome';

  const [existingAppointments, setExistingAppointments] = useStorage('appointments', '[]');
  const twoDaysAgo = new Date(Date.now() - 1000*60*60*24*2)
  if (existingAppointments.find(a=>new Date(a.time) < twoDaysAgo)) {
    setExistingAppointments(ea=>ea.filter(a=>new Date(a.time) > twoDaysAgo));
  }
  existingAppointments.sort((a, b)=>a.time.localeCompare(b.time));

  return (
    <div className="App">
      <mwc-top-app-bar-fixed>
        <div
          slot="title"
          style={{display: 'flex', alignItems: 'center', gap: '1rem'}}
          onClick={()=>setRoute([''])}
        >
          <img loading="lazy" src="/logo.png" width="30" height="30" alt="logo" />
          {strings.locationName()}
        </div>
      </mwc-top-app-bar-fixed>
      <div style={{margin: 'auto', padding: '1rem', paddingBottom: '5rem', maxWidth: '800px'}}>
        {screen === 'welcome' && <>
          <iframe
            title="Location"
            src="/location.html"
            style={{border: 'none', width: '100%', height: '50vh'}}
            sandbox
          />
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {existingAppointments.length ? <h2>{strings.storedAppointments()}</h2> : ''}
            {existingAppointments.map(({uuid, time})=><>
              <mwc-button
                outlined
                fullwidth
                onClick={()=>setRoute([uuid])}
              >{strings.yourAppointmentAt(localeFull(time))}</mwc-button>
            </>)}
            <mwc-button
              raised
              fullwidth
              onClick={()=>setRoute(['newAppointment'])}
            >
              + {strings.newAppointment()}
            </mwc-button>
          </div>
        </>}
        {screen === 'appointment' && <Appointment uuid={viewAppointment} />}
        {screen === 'newAppointment' && <NewAppointment created={(uuid)=>setRoute([uuid])} />}

      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
