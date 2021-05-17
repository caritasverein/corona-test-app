import React, {useRef} from 'react';
import '@material/mwc-button';
import '@material/mwc-dialog';

export const ConfirmButton = ({dialog={}, children, onClick, ...props})=>{

  const ref = useRef();
  const clickhandler = ()=>{
    if (ref.current) ref.current.show();
  };

  return <>
    <mwc-button {...props} onClick={clickhandler}>{children}</mwc-button>
    <mwc-dialog ref={ref}>
      <div>{dialog.text || 'Are you sure?'}</div>
      <mwc-button
        slot="secondaryAction"
        dialogAction="cancel"
      >{dialog.cancelText || 'cancel'}</mwc-button>
      <mwc-button
        raised
        slot="primaryAction"
        dialogAction="confirm"
        onClick={onClick}
      >{dialog.confirmText || 'confirm'}</mwc-button>
    </mwc-dialog>
  </>;
}

export default ConfirmButton;
