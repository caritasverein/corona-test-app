import React, {useState, useEffect, useCallback} from 'react';

import '@material/mwc-button';

import { toast, Slide } from 'react-toastify';

import {useApi, apiFetch} from '../hooks/useApi.js';
import {localeFull, localeTime, localeDayAndMonth, utcDay} from '../util/date.js';

import {SelectWeek} from './select-week.js';

const strings = {
  newAppointment: ()=>`Neuer Termin`,
  toastError: (err)=>`Es ist ein Fehler aufgetreten. Bitte versuche es erneut!`,
  selectDay: ()=>`Wählen Sie den Tag`,
  selectTime: ()=>`Wählen Sie die Uhrzeit`,
  appointmentsAvailable: (date)=>`Freie Termine am ${date}`,
  noAppointmentsAvailable: ()=>`An diesem Tag stehen keine Termine zur Verfügung`,
  fromTimeOn: (time)=>`ab ${time} Uhr`,
  createAppointmentReservation: (time)=>`Termin ${time} reservieren!`,
  createAppointmentNoSelection: (time)=>`Kein Termin ausgewählt`,
};

export const NewAppointment = ({created})=>{
  const [windows, updateWindows] = useApi('GET', 'windows', undefined, []);

  useEffect(() => {
      const interval = setInterval(() => {
          updateWindows();
      }, 30 * 1000);
      return () => clearInterval(interval);
  }, [updateWindows]);

  const [selectedDate, setSelectedDate] = useState(()=>{
    const today = new Date();
    today.setHours(0,0,0,0);
    return today.toISOString();
  });

  const [slots, updateSlots] = useApi('GET', 'windows/'+utcDay(selectedDate), undefined, []);

  const groupedSlots = {};
  slots.flatMap(s=>s.times).forEach(s=>{
    const date = new Date(s.time);
    date.setMinutes(0, 0, 0);
    const hour = localeTime(date);
    if (!groupedSlots[hour]) groupedSlots[hour] = [];
    groupedSlots[hour].push(s);
  });

  const [selectedSlot, setSelectedSlot] = useState(undefined);

  const confirmToast = React.useRef(null);

  const confirm = useCallback((selectedSlot) => {
    toast.dismiss(confirmToast.current)
    confirmToast.current = toast(({closeToast})=><>
        <h3>Reservieren</h3>
        <mwc-button
          style={{width: '100%'}}
          class="info"
          raised
          {...{[selectedSlot?'enabled':'disabled']: true}}
          onClick={()=>{
            closeToast();
            apiFetch('POST','appointments', {time:selectedSlot})
              .then(res=>created(res.uuid))
              .catch((e)=>{
                toast(`${strings.toastError(e)} (${e.status} ${e.message})`);
                updateSlots();
              })
          }}
        >
          {selectedSlot ? strings.createAppointmentReservation(localeFull(selectedSlot)) : strings.createAppointmentNoSelection()}
        </mwc-button>
      </>, {
      xtoastId: 'aaaaaaaaaaaa',
      transition: Slide,
      position: 'bottom-center',
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
    });
  }, [confirmToast, created]);

  return <>
    <h2>{strings.newAppointment()}</h2>
    <h3>{strings.selectDay()}</h3>
    <SelectWeek
      onChange={(e)=>setSelectedDate(e.target.value)}
      $extraClasses={(d)=>{
        d = new Date(d);
        d.setHours(0,0,0,0);
        const ret = {disabled: true};
        const dates = windows.map(({start})=>{
          start = new Date(start);
          start.setHours(0,0,0,0);
          return start.toISOString();
        });
        if (dates.includes(d.toISOString()))
          ret.disabled = false;
        if (selectedDate && d.toISOString() === new Date(selectedDate).toISOString())
          ret.selected = true;
        return ret;
      }}
    ></SelectWeek>
    {slots[0] && <>
      <h3 style={{marginTop: '3rem'}}>{strings.selectTime()}</h3>
      <h4>{strings.appointmentsAvailable(localeDayAndMonth(slots[0].start))}</h4>
      {!slots.length && <p>{strings.noAppointmentsAvailable()}</p>}
      {Object.entries(groupedSlots).map(([hour, slots])=><React.Fragment key={hour}>
        <h4 style={{marginBottom: '0.5rem'}}>{strings.fromTimeOn(hour)}:</h4>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
          {slots.map(t=><React.Fragment key={t.time}>
            {new Date(t.time).getMinutes()===0 && <>
            </>}
            <mwc-button
              style={{
                textDecoration: t.full?'line-through':'none',
              }}
              class={selectedSlot === t.time?'info':''}
              raised
              {...{[t.full?'disabled':'enabled']: true}}
              onClick={()=>{
                confirm(t.time);
                setSelectedSlot(selectedSlot !== t.time ? t.time : undefined);
              }}
            >
              {localeTime(t.time)} Uhr
            </mwc-button>
          </React.Fragment>)}
        </div>
      </React.Fragment>)}
    </>}
  </>;
}

export default NewAppointment;
