import { faBirthdayCake, faCaretDown, faCaretUp, faEnvelope, faMapMarkerAlt, faMobileAlt, faPencilAlt, faPhoneAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Collapse, Dialog, DialogContent, DialogTitle, IconButton, TableCell, TableRow } from "@material-ui/core";
import React, { useState } from "react";
import { isToday, updateServer, useStyles } from "./helper";
import TestHandler from "./TestHandler";
import EditAppointment from 'shared/components/edit-appointment.js';

export default function TestRow(props) {

    const classes = useStyles();

    const options = {
        weekday: undefined, year: 'numeric', month: 'numeric', day: 'numeric'
    }

    const [open, setOpen] = useState(false); //expandedTests.indexOf(props.test.uuid) > -1

    const time = new Date(props.test.time);

    const toggleHighlighted = async (uuid, value) => {
        await updateServer(uuid, { marked: value ? "true" : null }, props.triggerUpdate)
    }



    const [showAddingDialog, setShowAddingDialog] = useState(false);

    const edit = () => {
        setShowAddingDialog(true)
    }

    const handleAddingDialogSave = (data) => {
        const apiBaseURL = new URL(window.location);
        apiBaseURL.pathname = '/api/';
        updateServer(props.test.uuid, { ...data, time: undefined }, props.triggerUpdate, apiBaseURL)
        handleAddingDialogClose();
    }

    const handleAddingDialogClose = () => {
        setShowAddingDialog(false)
    }

    const editButton = <Button onClick={() => edit()} size={'small'} style={{ verticalAlign: 'baseline' }} variant={'contained'} className={'mx-2'}><FontAwesomeIcon icon={faPencilAlt} fixedWidth /> Bearbeiten</Button>



    return <React.Fragment key={props.test.uuid}>

        <Dialog disableBackdropClick open={showAddingDialog} onClose={handleAddingDialogClose}>
            <DialogTitle id="form-dialog-title">Daten bearbeiten</DialogTitle>
            <DialogContent>
                <EditAppointment admin appointment={props.test} update={handleAddingDialogSave} cancel={handleAddingDialogClose} />
            </DialogContent>
        </Dialog>

        <TableRow key={props.test.uuid} className={(props.test.marked ? classes.highlightedRow : '') + ' ' + classes.root}>
            <TableCell>
                <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                    {open ? <FontAwesomeIcon icon={faCaretUp} /> : <FontAwesomeIcon icon={faCaretDown} />}
                </IconButton>
            </TableCell>
            <TableCell>
                <Button onClick={() => toggleHighlighted(props.test.uuid, !props.test.marked)} variant={'contained'} className={props.test.marked ? classes.positiveButton : ''}>
                    <div style={{ whiteSpace: 'nowrap', fontSize: '1.5em' }}>
                        {(props.test.slot || '-')}
                    </div>
                </Button>
            </TableCell>
            <TableCell style={{ fontSize: '1.5em' }}>
                {time.getHours()}:{('' + time.getMinutes()).padStart(2, '0')}
            </TableCell>
            <TableCell>
                <div className="name-container">
                    <div data-area="name" style={{ fontSize: '1.5em' }}>
                        {props.test.nameFamily}, {props.test.nameGiven}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <TestHandler {...props} />
            </TableCell>
        </TableRow>
        <TableRow className={(props.test.marked ? classes.highlightedRow : '')}>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                <Collapse in={open} timeout="auto" unmountOnExit>

                </Collapse>
            </TableCell>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box marginBottom={3}>
                        <span className={'mr-2'} style={{ whiteSpace: 'nowrap' }}>
                            <FontAwesomeIcon fixedWidth icon={faBirthdayCake} /> {(new Date(props.test.dateOfBirth)).toLocaleDateString('de-DE', options)}
                        </span>
                        <span className={'mx-2'} style={{ whiteSpace: 'nowrap' }}>
                            <FontAwesomeIcon fixedWidth icon={faMapMarkerAlt} /> {props.test.address}
                        </span>
                        {props.test.phoneMobile && <span className={'mx-2'} style={{ whiteSpace: 'nowrap' }}><FontAwesomeIcon fixedWidth icon={faMobileAlt} /> {props.test.phoneMobile}</span>}
                        {props.test.phoneLandline && <span className={'mx-2'} style={{ whiteSpace: 'nowrap' }}><FontAwesomeIcon fixedWidth icon={faPhoneAlt} /> {props.test.phoneLandline}</span>}
                        {props.test.email && <span className={'mx-2'} style={{ whiteSpace: 'nowrap' }}><FontAwesomeIcon fixedWidth icon={faEnvelope} /> {props.test.email}</span>}
                        <span>
                            {!props.test.arrivedAt && editButton}
                        </span>
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    </React.Fragment>

}
