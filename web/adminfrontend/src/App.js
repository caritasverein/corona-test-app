import { AppBar, Button, Container, Dialog, DialogContent, DialogTitle, Toolbar, Typography } from "@material-ui/core";
import { red, green, yellow } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBirthdayCake, faCalendarTimes, faCheck, faCheckSquare, faClock, faComments, faEnvelope, faExclamationTriangle, faEyeSlash, faIdCard, faMapMarkerAlt, faMobileAlt, faPhoneAlt, faPlus, faPrint, faSpinner, faTag, faTimes, faUser, faVial } from "@fortawesome/free-solid-svg-icons";
import { faSquare } from "@fortawesome/free-regular-svg-icons";
import EditAppointment from 'shared/components/edit-appointment.js';

import printjs from 'print-js'

const apiBaseURL = new URL(window.location);
apiBaseURL.pathname = '/api/admin/';

const useStyles = makeStyles((theme) => ({
    title: {
        flexGrow: 1
    },
    table: {
        minWidth: 650,
    },
    positiveButton: {
        backgroundColor: red['500'],
        marginRight: '10px;',
        color: 'white',
        '&:hover': {
            backgroundColor: red['900']
        }
    },
    negativeButton: {
        backgroundColor: green['500'],
        marginRight: '10px;',
        color: 'white',
        '&:hover': {
            backgroundColor: green['900']
        }
    },
    invalidButton: {
        backgroundColor: yellow['800'],
        color: 'white',
        '&:hover': {
            backgroundColor: yellow['900']
        }
    },
    warningButton: {
        backgroundColor: yellow['800'],
        '&:hover': {
            backgroundColor: yellow['900']
        }
    },
    positive: {
        color: red['500']
    },
    invalid: {
        color: yellow['900']
    },
    negative: {
        color: green['500']
    },
    errorAlert: {
        color: red[900],
        backgroundColor: red[100],
        padding: '10px 20px 10px 20px',
        borderRadius: '3px',
        margin: '10px',
        position: 'absolute',
        width: 'max-content'
    },
    activatedColor: {
        backgroundColor: green['500'],
        marginRight: '10px;',
        color: 'white',
        '&:hover': {
            backgroundColor: green['900']
        }
    },
    highlightedRow: {
        backgroundColor: theme.palette.warning.light
    },
    '@keyframes blinker': {
        '50%': { backgroundColor: green['900'] },
    },
    flashPrintButton: {
        animationName: '$blinker',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        backgroundColor: green['500'],
        marginRight: '10px;',
        color: 'white',
        '&:hover': {
            backgroundColor: green['900']
        }
    }
}));

function iOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 0)

const audioDing = new Audio('ding.mp3');

function App() {

    const defaultTime = 60 * 1;
    const classes = useStyles();

    const [tests, setTests] = useState([]);
    const [openErrorWindow, setOpenErrorWindow] = useState(false);
    const [errorWindowMessage, setErrorWindowMessage] = useState('');
    const [onUpdate, setOnUpdate] = useState(false);
    const [pendingTests, setPendingTests] = useState(0)
    const [finishedTests, setFinishedTests] = useState([]);
    const [hiddenTests, setHiddenTests] = useState(JSON.parse(localStorage.getItem('hiddenTests')) || [])
    const [showLoginButton, setShowLoginButton] = useState(false);
    const [showAddingDialog, setShowAddingDialog] = useState(false);
    const [highlights, setHighlights] = useState([])

    const login = () => {
        window.location = '/api/login'
    }

    const fetchTests = useCallback(async (testsForComparison) => {
        const params = new URLSearchParams({ "start": startOfDay.toISOString(), "end": endOfDay.toISOString() });
        const url = new URL('./appointments?' + params.toString(), apiBaseURL);
        const response = await fetch(url);
        if (response.ok) {
            const result = (await response.json()).filter(r => r.nameGiven);
            if (JSON.stringify(result) !== JSON.stringify(testsForComparison)) {
                setTests(result);
            }
        } else {
            if (response.status === 401) {
                setShowLoginButton(true);
            } else {
                const text = await response.json();
                setErrorWindowMessage(text?.message?.toString() || text.toString())
                setOpenErrorWindow(true)
            }
        }
    }, []);

    useEffect(() => {
        fetchTests();
    }, [fetchTests])


    const getTestTimes = useCallback((test) => {
        const now = Math.round((new Date()).getTime() / 1000);
        const testUnixtime = test.testStartedAt ? Math.round((new Date(test.testStartedAt).getTime()) / 1000) : 0;
        const secondsLeft = defaultTime - (testUnixtime > 0 ? now - testUnixtime : 0);
        return { now, testUnixtime, secondsLeft }
    }, [defaultTime])


    const updatePendingTests = useCallback(() => {
        const _finishedTests = tests.filter(test => {
            const { now, testUnixtime } = getTestTimes(test);
            return test.testResult === null && testUnixtime > 0 && now - defaultTime >= testUnixtime
        }).map(test => test.uuid);
        /*_finishedTests.forEach(test => {
            if (finishedTests.indexOf(test) === -1) {
                if (!iOS()) audioDing.play();
            }
        })*/
        if (JSON.stringify(_finishedTests) !== JSON.stringify(finishedTests)) {
            setFinishedTests(_finishedTests);
        }
        setPendingTests(_finishedTests.length)
    }, [defaultTime, finishedTests, getTestTimes, tests]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (finishedTests.length > 0) {
                if (!iOS()) audioDing.play();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [finishedTests]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchTests(tests);
        }, 3000);
        return () => clearInterval(interval);
    }, [fetchTests, tests]);


    useEffect(() => {
        const interval = setInterval(() => {
            updatePendingTests();
        }, 1000);
        return () => clearInterval(interval);
    }, [updatePendingTests]);

    useEffect(() => {
        updatePendingTests();
    }, [tests, updatePendingTests])

    const toggleHighlighted = (uuid) => {
        const index = highlights.indexOf(uuid);
        if (index > -1) {
            const _highlights = [...highlights]
            _highlights.splice(index, 1)
            setHighlights(_highlights)
        } else {
            setHighlights([...highlights, uuid])
        }
    }

    const errorWindowHandleClose = () => {
        setOpenErrorWindow(false);
    };

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

    const printPDF = (uuid) => {
        updateServer(uuid, {needsCertificate: null})
        const url = new URL('../appointments/' + uuid + '/pdf', apiBaseURL);
        window.open(url.toString(), '_blank');
    }

    const hideTest = (uuid) => {
        setHiddenTests([...hiddenTests, uuid])
        localStorage.setItem('hiddenTests', JSON.stringify([...hiddenTests, uuid]))
    }

    const updateTest = (uuid, update) => {
        const index = tests.findIndex(d => d.uuid === uuid);
        if (index > -1) {
            const _tests = [...tests];
            _tests[index] = { ..._tests[index], ...update }
            setTests(_tests)
        }
    }

    const updateServer = async (uuid, update) => {
        const handleError = (err) => {
            console.log(err)
            setErrorWindowMessage(err)
            setOpenErrorWindow(true);
        }
        const options = {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...update, uuid: undefined })
        }
        const url = new URL('./appointments/' + uuid, apiBaseURL);
        const response = await fetch(url, options);
        if (response.ok) {
            const result = await response.json();
            updateTest(uuid, result);
            return true
        } else {
            handleError(await response.text())
        }

    }

    const handleAddingDialogClose = () => {
        setShowAddingDialog(false)
    }

    const handleAddingDialogSave = async (data) => {
        const handleError = (err) => {
            console.log(err)
            setErrorWindowMessage(err)
            setOpenErrorWindow(true);
        }
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...data, time: new Date().toISOString()})
        }
        const url = new URL('./appointments', apiBaseURL);
        const response = await fetch(url, options);
        if (response.ok) {
            handleAddingDialogClose()
        } else {
            handleError(await response.text())
        }
    }

    const deleteFromServer = async (uuid) => {
        const handleError = (err) => {
            console.log(err)
            setErrorWindowMessage(err)
            setOpenErrorWindow(true);
        }
        const url = new URL('../appointments/' + uuid, apiBaseURL);
        const options = {
            method: 'DELETE',
        }
        const response = await fetch(url, options);
        if (response.ok) {
            updateTest(uuid, { invalidatedAt: new Date() });
            return true
        } else {
            handleError(await response.text())
        }

    }

    const TestHandler = (props) => {

        const { now, testUnixtime, secondsLeft } = getTestTimes(props.test);

        // Counter for active test button
        const [counter, setCounter] = useState(secondsLeft);
        useEffect(() => {
            const timer = counter <= defaultTime && counter > 0 && setInterval(() => {
                setCounter(counter - 1);
            }, 1000);
            if (counter === 0) { clearInterval(timer); }
            return () => { clearInterval(timer); }
        }, [counter]);

        const hideButton = <Button onClick={() => hideTest(props.test.uuid)} size={'small'} className={'my-2 mx-2 float-right'} variant={'contained'}><FontAwesomeIcon icon={faEyeSlash} /></Button>
        const printButton = <Button onClick={() => printPDF(props.test.uuid)} size={'small'} className={'my-2 mx-2 ml-3 ' + (props.test.needsCertificate ? classes.flashPrintButton : '')} variant={'contained'} startIcon={<FontAwesomeIcon icon={faPrint} />}>{props.test.needsCertificate ? 'Zertifikat' : 'Zertifikat'}</Button>
        const cancelTestButton = <Button disabled={onUpdate} variant={'contained'} className={'my-2 mx-2'} onClick={() => cancelTest()}>Nicht erschienen</Button>
        const startTestButton = <Button disabled={onUpdate} variant={'contained'} color={'secondary'} className={'my-2 mx-2'} onClick={() => startTest()}>Test starten</Button>
        const needsCertificateButton = props.test.needsCertificate
            ? <Button disabled={onUpdate} variant={'contained'} className={classes.activatedColor + ' my-2 mx-2'} onClick={() => needsCertificate(false)} startIcon={<FontAwesomeIcon icon={faCheckSquare} />}>Zertifikat</Button>
            : <Button disabled={onUpdate} variant={'contained'} className={'my-2 mx-2'} onClick={() => needsCertificate(true)} startIcon={<FontAwesomeIcon icon={faSquare} />}>Zertifikat</Button>

        const resultButtons = <React.Fragment>
            <Button disabled={onUpdate} variant={'contained'} className={classes.negativeButton + ' mx-2 my-2'} onClick={() => setResult('negative')}>negative</Button>
            <Button disabled={onUpdate} variant={'contained'} className={classes.positiveButton + ' mx-2 my-2'} onClick={() => setResult('positive')}>positive</Button>
            <Button disabled={onUpdate} variant={'contained'} className={classes.invalidButton + ' mx-2 my-2'} onClick={() => setResult('invalid')}>Ungültig</Button>
        </React.Fragment>

        const stopTestButton = (timeLeft) => {
            return <Button disabled={timeLeft <= 0 || onUpdate} variant={'contained'} className={classes.warningButton + ' mx-2 my-2'} onClick={() => stopTest()}>
                <FontAwesomeIcon fixedWidth icon={faVial} className={'mr-3 flash '} /> {timeLeft <= 0 ? 'Bitte warten' : Math.floor(timeLeft / 60) + ':' + ('' + timeLeft % 60).padStart(2, '0')}
            </Button>
        }

        const cancelTest = async () => {
            setOnUpdate(true);
            await deleteFromServer(props.test.uuid)
            setOnUpdate(false);
        }

        const startTest = async () => {
            setOnUpdate(true);
            await updateServer(props.test.uuid, { testStartedAt: (new Date()).toISOString() })
            setOnUpdate(false);
        }

        const stopTest = async () => {
            setOnUpdate(true);
            await updateServer(props.test.uuid, { testStartedAt: null })
            setOnUpdate(false);
        }

        const needsCertificate = async (value) => {
            setOnUpdate(true);
            await updateServer(props.test.uuid, { needsCertificate: value ? "true" : null })
            setOnUpdate(false);
        }

        const setResult = async (res) => {
            if (res === 'negative' || (['positive', 'invalid'].indexOf(res) > -1 && window.confirm(resultText[res] + " - Bist du sicher?"))) {
                setOnUpdate(true);
                await updateServer(props.test.uuid, { testResult: res })
                setOnUpdate(false);
            }
        }

        let handler = <React.Fragment></React.Fragment>

        if (props.test.testResult === null && now - defaultTime < testUnixtime) {
            // Test is running
            handler = <div>
                {stopTestButton(secondsLeft)}
                {needsCertificateButton}
            </div>

        } else if (props.test.testResult === null && testUnixtime > 0 && now - defaultTime >= testUnixtime) {
            // Waiting for results
            handler = <div>
                {resultButtons}
                {needsCertificateButton}
            </div>

        } else if (props.test.testResult !== null) {
            // Test is finished
            handler = <div className={classes[props.test.testResult] + ' my-2 mx-2'}>{resultIcons[props.test.testResult]} {resultText[props.test.testResult]}
                {props.test.testResult === 'negative' && printButton}
                {props.test.testResult !== 'negative' && props.test.needsCertificate && <span className={'ml-3'}><b>Person wartet auf Zertifikat</b></span>}
                {hideButton}
            </div>

        } else if (props.test.invalidatedAt) {
            handler = <div>
                <FontAwesomeIcon icon={faCalendarTimes} fixedWidth /> Termin abgesagt.
                {hideButton}
            </div>

        } else {
            // Test is ready to start
            handler = <React.Fragment>
                {startTestButton}
                {cancelTestButton}
                {needsCertificateButton}
            </React.Fragment>

        }

        return handler;

    }

    const TestRow = (props) => {

        const options = {
            weekday: undefined, year: 'numeric', month: 'numeric', day: 'numeric'
        }

        const time = new Date(props.test.time);

        return <TableRow key={props.test.uuid} className={highlights.indexOf(props.test.uuid) > -1 ? classes.highlightedRow : ''}>
            <TableCell>
                <Button onClick={() => toggleHighlighted(props.test.uuid)} variant={'contained'} className={highlights.indexOf(props.test.uuid) > -1 ? classes.positiveButton : ''}>{props.test.id}</Button>
            </TableCell>
            <TableCell>
                {time.getHours()}:{('' + time.getMinutes()).padStart(2, '0')}
            </TableCell>
            <TableCell>
                <div className="name-container">
                    <div data-area="name">
                        {props.test.nameFamily}, {props.test.nameGiven}
                    </div>
                    <div data-area="dateOfBirth" className="text-muted">
                        <FontAwesomeIcon fixedWidth icon={faBirthdayCake} /> {(new Date(props.test.dateOfBirth)).toLocaleDateString('de-DE', options)}
                    </div>
                    <div data-area="address" className="text-muted">
                        <FontAwesomeIcon fixedWidth icon={faMapMarkerAlt} /> {props.test.address}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {props.test.phoneMobile && <div style={{ whiteSpace: 'nowrap' }}><FontAwesomeIcon fixedWidth icon={faMobileAlt} /> {props.test.phoneMobile}</div>}
                {props.test.phoneLandline && <div style={{ whiteSpace: 'nowrap' }}><FontAwesomeIcon fixedWidth icon={faPhoneAlt} /> {props.test.phoneLandline}</div>}
                {props.test.email && <div style={{ whiteSpace: 'nowrap' }}><FontAwesomeIcon fixedWidth icon={faEnvelope} /> {props.test.email}</div>}
            </TableCell>
            <TableCell>
                <TestHandler {...props} />
            </TableCell>
        </TableRow>
    }

    return (
        <div className="App">
            <AppBar position="sticky">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        <FontAwesomeIcon icon={faVial} fixedWidth /> Corona-Test-App Testübersicht und -durchführung
                    </Typography>
                    {onUpdate && <div><FontAwesomeIcon spin icon={faSpinner} size={'2x'} /></div>}
                    <Button onClick={() => setShowAddingDialog(true)} variant={'contained'} startIcon={<FontAwesomeIcon icon={faPlus} />}>Person hinzufügen</Button>
                    {showLoginButton && <Button onClick={() => login()} variant={'contained'} color={'secondary'} startIcon={<FontAwesomeIcon icon={faUser} />}>Login</Button>}
                    {pendingTests > 0 && <div className={'pending-tests ml-3'}><FontAwesomeIcon fixedWidth icon={faBell} /> {pendingTests === 1 ? "Ein fertiger Test" : pendingTests + " fertige Tests"}</div>}
                </Toolbar>
            </AppBar>

            <Dialog open={showAddingDialog} onClose={handleAddingDialogClose}>
                <DialogTitle id="form-dialog-title">Neue Person hinzufügen</DialogTitle>
                <DialogContent>
                    <EditAppointment admin appointment={{}} update={handleAddingDialogSave} />
                </DialogContent>

            </Dialog>

            {openErrorWindow &&
                <div className={classes.errorAlert} onClick={() => errorWindowHandleClose()}>
                    {errorWindowMessage} <FontAwesomeIcon className={'ml-2 pointer'} icon={faTimes} />
                </div>}

            <Container maxWidth={'lg'} className={'mt-5'}>
                <TableContainer component={Paper}>
                    <Table className={classes.table} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell><FontAwesomeIcon icon={faTag} fixedWidth /></TableCell>
                                <TableCell><FontAwesomeIcon icon={faClock} fixedWidth /></TableCell>
                                <TableCell><FontAwesomeIcon icon={faIdCard} fixedWidth /> Name</TableCell>
                                <TableCell><FontAwesomeIcon icon={faComments} fixedWidth /> Kontakt</TableCell>
                                <TableCell><FontAwesomeIcon icon={faVial} fixedWidth /> Testdurchführung</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tests.length > 0 && tests.filter(test => hiddenTests.indexOf(test.uuid) === -1).map((test, index) => <TestRow key={'row-' + test.uuid} test={test} index={index} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </div>
    );
}

export default App;
