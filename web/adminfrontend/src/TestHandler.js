import { faCalendarTimes, faCheck, faCircleNotch, faExclamationTriangle, faFileContract, faPrint, faTimes, faVial } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@material-ui/core";
import printJS from "print-js";
import React from "react";
import { useState } from "react";
import { apiBaseURL, defaultTime, deleteFromServer, updateServer, useStyles, useTestTimes } from "./helper";


const resultIcons = {
    'positive': <FontAwesomeIcon icon={faExclamationTriangle} fixedWidth />,
    'negative': <FontAwesomeIcon icon={faCheck} fixedWidth />,
    'invalid': <FontAwesomeIcon icon={faTimes} fixedWidth />
}

const resultText = {
    'positive': 'Testergebnis positiv',
    'negative': 'Testergebnis negativ',
    'invalid': 'Testergebnis ungültig'
}

export default function TestHandler(props) {

    const classes = useStyles();

    const { now, testUnixtime, secondsLeft, isFinished, isRunning } = useTestTimes(props.test.testStartedAt);

    if (props.test.nameFamily === 'Koch') {
        console.log("isRunning", isRunning, "isFinished", isFinished, "secondsLeft", secondsLeft, "testUnixtime", testUnixtime)
    }

    const [onUpdate, setOnUpdate] = useState(false);

    const printPDF = (uuid) => {
        updateServer(uuid, { needsCertificate: null }, props.triggerUpdate)
        const url = new URL('../appointments/' + uuid + '/pdf', apiBaseURL);
        if (navigator.userAgent.includes('Android') || navigator.userAgent.includes('Mobile')) {
            window.open(url.toString(), '_blank');
        } else {
            printJS(url.toString());
        }
    }


    const printButton = <Button onClick={() => printPDF(props.test.uuid)} size={'small'} style={{ fontSize: '1.5em' }} className={'my-2 mx-2 ' + (props.test.needsCertificate ? classes.flashPrintButton : '')} variant={'contained'}><FontAwesomeIcon icon={faPrint} /></Button>
    const cancelTestButton = <Button disabled={onUpdate} variant={'contained'} className={'my-2 mx-2'} onClick={() => cancelTest()}>Nicht erschienen</Button>
    const startTestButton = <Button disabled={onUpdate} variant={'contained'} color={'primary'} className={'my-2 mx-2'} onClick={() => startTest()} style={{ width: '17ch' }}>Test starten</Button>
    const onSiteButton = <Button disabled={onUpdate} variant={'contained'} color={'secondary'} className={'my-2 mx-2'} onClick={() => onSite()} style={{ width: '17ch' }}>Erschienen</Button>

    const needsCertificateButton = props.test.needsCertificate
        ? <Button disabled={onUpdate} variant={'contained'} style={{ fontSize: '1.5em' }} className={classes.activatedColor + ' my-2 mx-2'} onClick={() => needsCertificate(false)}><FontAwesomeIcon icon={faFileContract} /></Button>
        : <Button disabled={onUpdate} variant={'contained'} style={{ fontSize: '1.5em' }} className={'my-2 mx-2'} onClick={() => needsCertificate(true)}><FontAwesomeIcon icon={faFileContract} /></Button>

    const resultButtons = <React.Fragment>
        <Button disabled={onUpdate} variant={'contained'} className={classes.negativeButton + ' mx-2 my-2'} onClick={() => setResult('negative')}>negativ</Button>
        <Button disabled={onUpdate} variant={'contained'} className={classes.positiveButton + ' mx-2 my-2'} onClick={() => setResult('positive')}>positiv</Button>
        <Button disabled={onUpdate} variant={'contained'} className={classes.invalidButton + ' mx-2 my-2'} onClick={() => setResult('invalid')}>Ungültig</Button>
    </React.Fragment>

    const displayTime = (timeLeft) => {
        return Math.floor(timeLeft / 60) + ':' + ('' + timeLeft % 60).padStart(2, '0')
    }
    const stopTestButton = (timeLeft) => {
        return <Button disabled={timeLeft <= 0 || onUpdate} variant={'contained'} className={classes.warningButton + ' mx-2 my-2'} onClick={() => stopTest()}>
            <FontAwesomeIcon fixedWidth icon={faVial} className={'mr-3 flash '} /> {timeLeft <= 0 ? 'Bitte warten' : displayTime(timeLeft)}
        </Button>
    }


    const cancelTest = async () => {
        setOnUpdate(true);
        await deleteFromServer(props.test.uuid, props.triggerUpdate)
        setOnUpdate(false);
    }

    const startTest = async () => {
        setOnUpdate(true);
        await updateServer(props.test.uuid, { testStartedAt: (new Date()).toISOString() }, props.triggerUpdate)
        setOnUpdate(false);
    }

    const onSite = async () => {
        setOnUpdate(true);
        await updateServer(props.test.uuid, { arrivedAt: new Date().toISOString() }, props.triggerUpdate)
        setOnUpdate(false);
    }

    const stopTest = async () => {
        setOnUpdate(true);
        await updateServer(props.test.uuid, { testStartedAt: null }, props.triggerUpdate)
        setOnUpdate(false);
    }

    const needsCertificate = async (value) => {
        setOnUpdate(true);
        await updateServer(props.test.uuid, { needsCertificate: value ? "true" : null }, props.triggerUpdate)
        setOnUpdate(false);
    }

    const setResult = async (res) => {
        if (res === 'negative' || (['positive', 'invalid'].indexOf(res) > -1 && window.confirm(resultText[res] + " - Bist du sicher?"))) {
            setOnUpdate(true);
            await updateServer(props.test.uuid, { testResult: res }, props.triggerUpdate)
            setOnUpdate(false);
        }
    }

    let handler = <React.Fragment></React.Fragment>



    if (props.test.testResult === null && now - defaultTime < testUnixtime) {
        // Test is running
        handler = <div>
            {needsCertificateButton}
            {props.view === 'secretary' ? <div className={'d-inline-block mx-2 '}><FontAwesomeIcon style={{color: 'gray'}} icon={faCircleNotch} spin fixedWidth /> Test läuft ({displayTime(secondsLeft)})...</div> : stopTestButton(secondsLeft)}
        </div>

    } else if (props.test.testResult === null && isFinished) {
        // Waiting for results
        handler = <div>
            {needsCertificateButton}
            {props.view === 'secretary' ? <div className={'d-inline-block mx-2 '}><FontAwesomeIcon style={{color: 'gray'}} icon={faCircleNotch} spin fixedWidth /> Warte auf Ergebnisse...</div> : resultButtons}
        </div>

    } else if (props.test.testResult !== null) {
        // Test is finished
        handler = <div className={classes[props.test.testResult]}>
            {['negative', 'positive'].indexOf(props.test.testResult) > -1 && printButton}
            <span className={'mx-2'}>{resultIcons[props.test.testResult]} {resultText[props.test.testResult]}</span>
            {props.test.needsCertificate && ['negative', 'positive'].indexOf(props.test.testResult) === -1 && <span className={'ml-3'}><b>Person wartet auf Zertifikat</b></span>}
            {/*hideButton*/}
        </div>

    } else if (props.test.invalidatedAt) {
        // Appointment invalidated
        handler = <div>
            <FontAwesomeIcon icon={faCalendarTimes} fixedWidth /> Termin abgesagt.
            {/*hideButton*/}
        </div>

    } else if (props.test.arrivedAt) {
        // Waiting for test start
        handler = <React.Fragment>
            {needsCertificateButton}
            {props.view === 'secretary' ? <div className={'d-inline-block mx-2 '}><FontAwesomeIcon style={{color: 'gray'}} icon={faCircleNotch} spin fixedWidth /> Warte auf Testung...</div> : startTestButton}
        </React.Fragment>

    } else {
        // Waiting for user to show up on site
        handler = <React.Fragment>
            {/*startTestButton*/}
            {needsCertificateButton}
            {onSiteButton}
            {cancelTestButton}
        </React.Fragment>

    }

    return handler;

}
