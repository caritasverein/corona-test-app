import React, {useRef, useState} from 'react';
import '@material/mwc-button';
import '@material/mwc-dialog';
import QRCode from 'qrcode.react';

const strings = {
  cwaIntegrationFull: ()=>`In Corona-Warn-App öffnen`,
  cwaIntegrationFullDetail: ()=>`Hiermit erkläre ich mein Einverständnis zum Übermitteln des Testergebnisses und meines pseudonymen Codes
an das Serversystem des RKI, damit ich mein Testergebnis mit der Corona-Warn-App abrufen kann. Ich willige
außerdem in die Übermittlung meines Namens und Geburtsdatums an die App ein, damit mein Testergebnis in
der App als namentlicher Testnachweis angezeigt werden kann. Mir wurden Hinweise zum Datenschutz
ausgehändigt.`,
  cwaIntegrationMini: ()=>`In Corona-Warn-App öffnen (Minimale Daten)`,
  cwaIntegrationMiniDetail: ()=>`Hiermit erkläre ich mein Einverständnis zum Übermitteln meines Testergebnisses und meines pseudonymen
Codes an das Serversystem des RKI, damit ich mein Testergebnis mit der Corona-Warn-App abrufen kann. Das
Testergebnis in der App kann hierbei nicht als namentlicher Testnachweis verwendet werden. Mir wurden
Hinweise zum Datenschutz ausgehändigt.`,
}

const fetchCwaUrl = (uuid, fullData)=>
  fetch(`/api/appointments/${encodeURIComponent(uuid)}/cwa`)
    .then(res=>res.json()).then(({full, mini})=>fullData?full:mini)

export const ConfirmButton = ({uuid, children, ...props})=>{
  const [cwaUrl, setCwaUrl] = useState(undefined);

  const ref1 = useRef();
  const clickhandler = ()=>{
    setCwaUrl(undefined);
    if (ref1.current) ref1.current.show();
  };
  const ref2 = useRef();

  return <>
    <mwc-button {...props} onClick={clickhandler}>{children}</mwc-button>
    <mwc-dialog ref={ref1}>
      <h2>Mit persönlichen Daten</h2>
      <div>{strings.cwaIntegrationFullDetail()}</div>
      <mwc-button
        raised
        dialogAction="confirm"
        onClick={()=>{fetchCwaUrl(uuid, true).then(setCwaUrl).then(()=>ref2.current.show())}}
      >{'Weiter mit persönlichen Daten'}</mwc-button>
      <h2>Ohne persönliche Daten</h2>
      <div>{strings.cwaIntegrationMiniDetail()}</div>
      <mwc-button
        raised
        dialogAction="confirm"
        onClick={()=>{fetchCwaUrl(uuid, false).then(setCwaUrl).then(()=>ref2.current.show())}}
      >{'Weiter ohne persönliche Daten'}</mwc-button>
      <mwc-button
        slot="secondaryAction"
        dialogAction="cancel"
      >{'Zurück'}</mwc-button>
    </mwc-dialog>
    <mwc-dialog ref={ref2}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
      }}>
        <QRCode value={cwaUrl||''} size={window.innerWidth / 2} />
      </div>
      <mwc-button
        raised
        dialogAction="confirm"
        onClick={()=>window.open(cwaUrl||'')}
      >{'Corona-Warn-App jetzt öffnen'}</mwc-button>
      <mwc-button
        slot="secondaryAction"
        dialogAction="cancel"
      >{'Zurück'}</mwc-button>
    </mwc-dialog>
  </>;
}

export default ConfirmButton;
