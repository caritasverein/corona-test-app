import { AppBar, Button, Container, Toolbar, Typography } from "@material-ui/core";
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
import { faBell, faBirthdayCake, faCalendarTimes, faCheck, faClock, faComments, faEnvelope, faExclamationTriangle, faEyeSlash, faIdCard, faList, faMapMarkerAlt, faMobileAlt, faPhoneAlt, faPrint, faSign, faSpinner, faTag, faTimes, faVial } from "@fortawesome/free-solid-svg-icons";

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
    }
}));

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

    const fetchTests = useCallback(async (testsForComparison) => {
        const params = new URLSearchParams({ "start": startOfDay.toISOString(), "end": endOfDay.toISOString() });
        const url = new URL('./appointments?' + params.toString(), apiBaseURL);
        const response = await fetch(url);
        if (response.ok) {
            const result = await response.json();
            console.log("fetch:", result)
            if (JSON.stringify(result) !== JSON.stringify(testsForComparison)) {
                setTests(result);
            }
        } else {
            if (response.status ===  401) window.location.pathname = '/api/login';
            const text = await response.json();
            setErrorWindowMessage(text?.message?.toString() || text.toString())
            setOpenErrorWindow(true)
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
        _finishedTests.forEach(test => {
            if (finishedTests.indexOf(test) === -1) {
                audioDing.play();
            }
        })
        if (JSON.stringify(_finishedTests) !== JSON.stringify(finishedTests)) {
            setFinishedTests(_finishedTests);
        }
        setPendingTests(_finishedTests.length)
    }, [defaultTime, finishedTests, getTestTimes, tests]);

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
        const url = new URL('../appointments/' + uuid + '/pdf', apiBaseURL);
        printjs(url.toString())
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

        const hideButton = <Button onClick={() => hideTest(props.test.uuid)} size={'small'} className={'ml-3 '} variant={'contained'}><FontAwesomeIcon icon={faEyeSlash} /></Button>
        const printButton = <Button onClick={() => printPDF(props.test.uuid)} size={'small'} className={'ml-3 '} variant={'contained'} startIcon={<FontAwesomeIcon icon={faPrint} />}>Zertifikat</Button>
        const cancelTestButton = <Button disabled={onUpdate} variant={'contained'} className={'ml-2'} onClick={() => cancelTest()}>Nicht erschienen</Button>
        const startTestButton = <Button disabled={onUpdate} variant={'contained'} color={'secondary'} onClick={() => startTest()}>Test starten</Button>
        const resultButtons = <React.Fragment>
            <Button disabled={onUpdate} variant={'contained'} className={classes.negativeButton} onClick={() => setResult('negative')}>negative</Button>
            <Button disabled={onUpdate} variant={'contained'} className={classes.positiveButton} onClick={() => setResult('positive')}>positive</Button>
            <Button disabled={onUpdate} variant={'contained'} className={classes.invalidButton} onClick={() => setResult('invalid')}>Ungültig</Button>
        </React.Fragment>

        const stopTestButton = (timeLeft) => {
            return <Button disabled={timeLeft <= 0 || onUpdate} variant={'contained'} className={classes.warningButton} onClick={() => stopTest()}>
                <FontAwesomeIcon fixedWidth icon={faVial} className={'mr-2 flash'} /> {timeLeft <= 0 ? 'Bitte warten' : Math.floor(timeLeft / 60) + ':' + ('' + timeLeft % 60).padStart(2, '0')}
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

        const setResult = async (res) => {
            if (res === 'negative' || ['positive', 'invalid'].indexOf(res) > -1 && window.confirm(resultText[res] + " - Bist du sicher?")) {
                setOnUpdate(true);
                await updateServer(props.test.uuid, { testResult: res })
                setOnUpdate(false);
            }
        }

        let handler = <React.Fragment></React.Fragment>

        if (props.test.testResult === null && now - defaultTime < testUnixtime) {
            // Test is running
            handler = stopTestButton(secondsLeft);

        } else if (props.test.testResult === null && testUnixtime > 0 && now - defaultTime >= testUnixtime) {
            // Waiting for results
            handler = resultButtons;

        } else if (props.test.testResult !== null) {
            // Test is finished
            handler = <div className={classes[props.test.testResult]}>{resultIcons[props.test.testResult]} {resultText[props.test.testResult]}
                {props.test.testResult === 'negative' && printButton}
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
            </React.Fragment>

        }

        return handler;

    }

    const TestRow = (props) => {

        const options = {
            weekday: undefined, year: 'numeric', month: 'numeric', day: 'numeric'
        }

        const time = new Date(props.test.time);

        return <TableRow key={props.test.uuid}>
            <TableCell>
                <b># {props.index + 1}</b>
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
                {props.test.phoneMobile && <div><FontAwesomeIcon fixedWidth icon={faMobileAlt} /> {props.test.phoneMobile}</div>}
                {props.test.phoneLandline && <div><FontAwesomeIcon fixedWidth icon={faPhoneAlt} /> {props.test.phoneLandline}</div>}
                {props.test.email && <div><FontAwesomeIcon fixedWidth icon={faEnvelope} /> {props.test.email}</div>}
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
                    {pendingTests > 0 && <div className={'pending-tests ml-3'}><FontAwesomeIcon fixedWidth icon={faBell} /> {pendingTests === 1 ? "Ein fertiger Test" : pendingTests + " fertige Tests"}</div>}
                </Toolbar>
            </AppBar>

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
