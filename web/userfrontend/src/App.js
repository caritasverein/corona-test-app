import React from 'react';
import './App.css';
import '@material/mwc-top-app-bar-fixed';
import '@material/mwc-button';
import '@material/mwc-icon';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {useRoute} from './hooks/useRoute.js';
import Appointment from './elements/Appointment.js';
import NewAppointment from './elements/NewAppointment.js';
import Welcome from './elements/Welcome.js';

const strings = {
  locationName: ()=>process.env.REACT_APP_LOCATION_NAME,
  welcomeTolocationName: ()=>`Willkommen im `+process.env.REACT_APP_LOCATION_NAME,
};

function App() {
  const [route, setRoute] = useRoute();
  const viewAppointment = (route[0] && route[0].length === 36) ? route[0] : undefined;

  const screen = (viewAppointment ? 'appointment' : route[0]) || 'welcome';

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
        {screen === 'welcome' && <Welcome />}
        {screen === 'appointment' && <Appointment uuid={viewAppointment} />}
        {screen === 'newAppointment' && <NewAppointment created={(uuid)=>setRoute([uuid])} />}

      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
