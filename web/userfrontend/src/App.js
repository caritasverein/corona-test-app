import {useState} from 'react';
import './App.css';
import {
  AppBar,
  Button,
  Container,
  Toolbar,
  Typography,
  TextField
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as DateFns from 'date-fns';

import {useApi, apiFetch} from './useApi.js';

const useStyles = makeStyles(theme => ({
  offset: theme.mixins.toolbar,
}))

const appointmentDetail = {
  "nameGiven": 'Vorname',
  "nameFamily": 'Nachname',
  "address": 'Adresse',
  "dateOfBirth": 'Geburtsdatum',
  "email": 'E-Mail',
  "phoneMobile": 'Handynummer',
  "phoneLandline": 'Festnetznummer',
};

const ShowAppointment = ({uuid})=>{
  const appointment = useApi('GET', 'appointments/'+uuid);
  if (!appointment) return <h2>{uuid}...</h2>;
  const testStatus = appointment.testStartedAt ? appointment.testResult || 'In Bearbeitung' : 'Ausstehend'
  return <>
    <h2>{uuid}</h2>
    <h3>Termin am: {appointment.time}</h3>
    <p>Testergebnis: {testStatus}</p>
    <form>
      {Object.entries(appointmentDetail).map(([name, label])=><>
        <TextField type="text" name={name} required={true} label={label} variant="filled" defaultValue={appointment[name]||''} />
        <br />
      </>)}
      <Button
        variant='contained'
        color='primary'
        onClick={(e)=>{
          e.preventDefault();
          let target = e.target;
          while(!target.form || target instanceof HTMLFormElement) target = target.parentNode;
          const form = target.form;
          const data = Object.fromEntries(new FormData(form).entries());
          apiFetch('PATCH','appointments/'+uuid, data).then(alert)
        }}
      >Speichern</Button>
    </form>
    <pre>{JSON.stringify(appointment, null, 4)}</pre>
  </>
}

const NewAppointment = ()=>{
  const windows = useApi('GET', 'windows', undefined, []);
  const dates = windows.map(w=>new Date(w.start).toLocaleDateString());
  const checkDateUnavailable = (date)=> {
    return !dates.includes(new Date(date).toLocaleDateString());
  }

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString());
  if (checkDateUnavailable(selectedDate) && windows.length) setSelectedDate(new Date(windows[0].start).toISOString());
  console.log(selectedDate);

  const slots = useApi('GET', 'windows/'+DateFns.format(new Date(selectedDate), 'yyyy-MM-dd'), undefined, []);
  console.log('slots', slots);

  const [selectedSlot, setSelectedSlot] = useState(undefined);

  return <>
    <h2>Neuer Termin</h2>
    {windows.map(s=><Button
      key={s.start}
      disabled={s.full}
      variant='contained'
      color={selectedDate === s.start ? 'primary':''}
      onClick={()=>setSelectedDate(s.start)}
    >
      {s.start} - {s.end}
    </Button>)}
    {slots.map(s=><>
      <h3>Termine am {s.start}</h3>
        {s.times.map(t=><Button
          key={t.time}
          variant='contained'
          color={selectedSlot === t.time ? 'primary':''}
          disabled={t.full}
          onClick={()=>setSelectedSlot(t.time)}
        >
          {t.time}
        </Button>
      )}
    </>)}
    <h3>Reservieren</h3>
    <Button
      disabled={!selectedSlot}
      variant='contained'
      color='primary'
      onClick={()=>apiFetch('POST','appointments', {time:selectedSlot}).then(res=>window.location.pathname = res.uuid)}
    >
      {selectedSlot ? `Termin ${selectedSlot} reservieren!` : `Kein Termin ausgewählt`}
    </Button>
  </>
}

function App() {
  const classes = useStyles();

  const viewAppointment = window.location.pathname.length !== 36 && window.location.pathname.slice(1);

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Caritas-Verein Corona Tests
          </Typography>
        </Toolbar>
      </AppBar>
      <Container>
        {viewAppointment?<ShowAppointment uuid={viewAppointment}/>:<NewAppointment />}
      </Container>
    </div>
  );
}

export default App;
