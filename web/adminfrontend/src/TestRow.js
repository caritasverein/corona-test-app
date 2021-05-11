import { faBirthdayCake, faCaretDown, faCaretUp, faEnvelope, faMapMarkerAlt, faMobileAlt, faPhoneAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Collapse, IconButton, TableCell, TableRow } from "@material-ui/core";
import React, { useState } from "react";
import { updateServer, useStyles } from "./helper";
import TestHandler from "./TestHandler";

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

    return <React.Fragment key={props.test.uuid}>
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
            <TableCell  style={{fontSize: '1.5em'}}>
                {time.getHours()}:{('' + time.getMinutes()).padStart(2, '0')}
            </TableCell>
            <TableCell>
                <div className="name-container">
                    <div data-area="name" style={{fontSize: '1.5em'}}>
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
                    </Box>
                </Collapse>
            </TableCell>

        </TableRow>
    </React.Fragment>

}
