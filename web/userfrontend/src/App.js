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
  imprint: ()=>`Impressum`,
  privacy: ()=>`Datenschutz`,
  source: ()=>`Quellcode`,
};

const styles = Object.fromEntries(Object.entries({
  "--mdc-theme-primary": process.env.REACT_APP_THEME_PRIMARY,
  "--mdc-theme-on-primary": process.env.REACT_APP_THEME_ON_PRIMARY,
  "--mdc-theme-secondary": process.env.REACT_APP_THEME_SECONDARY,
  "--mdc-theme-on-secondary": process.env.REACT_APP_THEME_ON_SECONDARY,
}).filter(([k,v])=>v));

function App() {
  const [route, setRoute] = useRoute();
  const viewAppointment = (route[0] && route[0].length === 36) ? route[0] : undefined;

  const screen = (viewAppointment ? 'appointment' : route[0]) || 'welcome';

  return (
    <div className="App" style={styles}>
      <mwc-top-app-bar-fixed>
        <div
          slot="title"
          style={{display: 'flex', alignItems: 'center', gap: '1rem'}}
          onClick={()=>setRoute([''])}
        >
          <img loading="lazy" src={process.env.REACT_APP_LOGO_REF} width="30" height="30" alt="logo" />
          {strings.locationName()}
        </div>
      </mwc-top-app-bar-fixed>
      <div style={{margin: 'auto', padding: '1rem', paddingBottom: '2rem', maxWidth: '800px'}}>
        {screen === 'welcome' && <Welcome />}
        {screen === 'appointment' && <Appointment uuid={viewAppointment} />}
        {screen === 'newAppointment' && <NewAppointment created={(uuid)=>setRoute([uuid])} />}

      </div>
      <footer style={{margin: 'auto', padding: '1rem', textAlign: 'center', opacity: 0.5}}>
        <a style={{color: 'inherit'}} href={process.env.REACT_APP_IMPRINT_REF}>{strings.imprint()}</a>
        &nbsp; | &nbsp;
        <a style={{color: 'inherit'}} href={process.env.REACT_APP_PRIVACY_REF}>{strings.privacy()}</a>
        &nbsp; | &nbsp;
        <a style={{color: 'inherit'}} href="https://github.com/caritasverein/corona-test-app">{strings.source()}</a>
      </footer>
      <ToastContainer />
    </div>
  );
}

export default App;
