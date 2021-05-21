import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, DateTimePicker, TimePicker, DatePicker } from '@material-ui/pickers';
import deLocale from "date-fns/locale/de";
import React, { useEffect, useState } from 'react';
import { Button, Typography } from '@material-ui/core';
import { apiBaseURL } from './helper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useStyles } from "./helper";

export default function AddWindows(props) {

    const classes = useStyles();

    const getDateStart = () => {
        const d = new Date();
        d.setHours(8, 0, 0, 0)
        return d;
    }

    const getDateEnd = () => {
        const d = new Date();
        d.setHours(16, 0, 0, 0)
        return d;
    }

    const getWindows = async () => {
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }
        const windowsURL = new URL(window.location);
        windowsURL.pathname = '/api/windows/';
        const response = await fetch(windowsURL, options);
        if (response.ok) {
            const data = await response.json();
            setWindows(data)
        }
    }

    const [startDate, setStartDate] = useState(new Date());
    const [start, setStart] = useState(getDateStart);
    const [end, setEnd] = useState(getDateEnd);
    const [windows, setWindows] = useState([]);
    const [error, setError] = useState();

    useEffect(() => {
        getWindows();
    }, [])

    const handleSave = async () => {
        setError(undefined);

        start.setDate(startDate.getDate())
        end.setDate(startDate.getDate())

        const handleError = (err) => {
            if (err.toString() === 'Conflict') {
                setError(<div className={classes.errorMessage} >Diese Öffnungszeiten kollidieren mit bereits eingetragenen Öffnungszeiten.</div>)
            } else {
                setError(err.toString())
            }
            console.log(err)
        }
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start,
                end,
                numQueues: 2,
                appointmentDuration: 300,
                externalRef: null
            })
        }
        const url = new URL('./windows', apiBaseURL);
        const response = await fetch(url, options);
        if (response.ok) {
            getWindows();
        } else {
            handleError(await response.text())
        }

    }

    const deleteWindow = async (id) => {
        const handleError = (err) => {
            console.log(err)
        }
        const options = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        }
        const url = new URL('./windows/' + id, apiBaseURL);
        const response = await fetch(url, options);
        if (response.ok) {
            getWindows();
        } else {
            handleError(await response.text())
        }
    }

    const deleteButton = (id) => {
        return <Button variant={'contained'} className={'my-2 mx-2'} onClick={() => deleteWindow(id)}><FontAwesomeIcon icon={faTimes} /></Button>
    }

    return <div>

        <div>
            <Typography>Eingetragene Öffnungszeiten:</Typography>
            <div className={'m-3'}>
                {windows.map(w => <div>
                    {(new Date(w.start)).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}  -   {(new Date(w.start)).toLocaleTimeString('de-DE', { timeStyle: 'short' })} bis {(new Date(w.end)).toLocaleTimeString('de-DE', { timeStyle: 'short' })} {deleteButton(w.id)}
                </div>)}
            </div>
        </div>

        {error}

        <div>
            <MuiPickersUtilsProvider utils={DateFnsUtils} locale={deLocale}>
                <DatePicker
                    autoOk
                    format="dd.MM.yyyy"
                    margin="normal"
                    id="date-picker"
                    label="Tag"
                    value={startDate}
                    onChange={setStartDate}
                    color={'secondary'}
                />
            </MuiPickersUtilsProvider>
        </div>

        <div>

            <MuiPickersUtilsProvider utils={DateFnsUtils} locale={deLocale}>
                <TimePicker
                    autoOk
                    minutesStep={5}
                    ampm={false}
                    format="HH:mm"
                    margin="normal"
                    id="date-picker"
                    label="Start"
                    value={start}
                    onChange={setStart}
                    color={'secondary'}
                />
            </MuiPickersUtilsProvider>


            <MuiPickersUtilsProvider utils={DateFnsUtils} locale={deLocale}>
                <TimePicker
                    autoOk
                    minutesStep={5}
                    ampm={false}
                    format="HH:mm"
                    margin="normal"
                    id="date-picker"
                    label="Ende"
                    value={end}
                    onChange={setEnd}
                    color={'secondary'}
                />
            </MuiPickersUtilsProvider>

        </div>

        <div className={'my-3'}>
            <Button className={'mr-3'} color={'primary'} variant={'contained'} onClick={handleSave}>Hinzufügen</Button>
            <Button variant={'contained'} onClick={props.cancel}>Schließen</Button>
        </div>

    </div>


}