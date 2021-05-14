import DOMPurify from 'dompurify';
import {useStorage} from '../hooks/useStorage.js';
import {useRoute} from '../hooks/useRoute.js';
import {useApi} from '../hooks/useApi.js';
import {localeFull} from '../util/date.js';

const strings = {
  storedAppointments: ()=>`Gespeicherte Termine`,
  yourAppointmentAt: (date)=>`Ihr Termin am ${date}`,
  newAppointment: ()=>`Neuen Termin vereinbaren`,
}

export const Welcome = () => {
  const [, setRoute] = useRoute();

  const [existingAppointments, setExistingAppointments] = useStorage('appointments', '[]');
  const twoDaysAgo = new Date(Date.now() - 1000*60*60*24*2)
  if (existingAppointments.find(a=>new Date(a.time) < twoDaysAgo)) {
    setExistingAppointments(ea=>ea.filter(a=>new Date(a.time) > twoDaysAgo));
  }
  existingAppointments.sort((a, b)=>a.time.localeCompare(b.time));

  const url = new URL(process.env.REACT_APP_INDEX_REF, window.location);
  const [location] = useApi(url);

  return <>
    <div
      dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(location)}}
    ></div>
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      {existingAppointments.length ? <h2><mwc-icon>bookmarks</mwc-icon>&nbsp;{strings.storedAppointments()}</h2> : ''}
      {existingAppointments.map(({uuid, time})=><>
        <mwc-button
          outlined
          fullwidth
          icon="bookmark_border"
          onClick={()=>setRoute([uuid])}
        >{strings.yourAppointmentAt(localeFull(time))}</mwc-button>
      </>)}
      <mwc-button
        raised
        fullwidth
        onClick={()=>setRoute(['newAppointment'])}
      >
        <mwc-icon>add</mwc-icon>&nbsp;{strings.newAppointment()}
      </mwc-button>
    </div>
  </>
}
export default Welcome;
