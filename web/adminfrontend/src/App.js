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
import { faAlarmExclamation, faBirthdayCake, faCalendarTimes, faCheck, faExclamationTriangle, faMapMarkerAlt, faPrint, faSpinnerThird, faTimes, faVial } from "@fortawesome/pro-solid-svg-icons";
import printjs from 'print-js'

let renderCount = 0;

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
        '&:hover': {
            backgroundColor: red['900']
        }
    },
    negativeButton: {
        backgroundColor: green['500'],
        marginRight: '10px;',
        '&:hover': {
            backgroundColor: green['900']
        }
    },
    invalidButton: {
        backgroundColor: yellow['800'],
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

function App() {

    renderCount += 1;
    console.log(`renderCount: `, renderCount);

    const defaultTime = 60 * 0.2;
    const classes = useStyles();

    const [tests, setTests] = useState([]);
    const [openErrorWindow, setOpenErrorWindow] = useState(false);
    const [errorWindowMessage, setErrorWindowMessage] = useState('');
    const [onUpdate, setOnUpdate] = useState(false);
    const [pendingTests, setPendingTests] = useState(0)
    const [finishedTests, setFinishedTests] = useState([]);

    const fetchTests = useCallback(async (testsForComparison) => {
        const params = new URLSearchParams({ "start": startOfDay.toISOString(), "end": endOfDay.toISOString() });
        const url = new URL('./appointments?' + params.toString(), apiBaseURL);
        const response = await fetch(url);
        const result = await response.json();
        if (JSON.stringify(result) !== JSON.stringify(testsForComparison)) setTests(result);
    }, []);

    useEffect(() => {
        fetchTests();
    }, [fetchTests])

    useEffect(() => {
        const interval = setInterval(() => {
            fetchTests(tests);
        }, 3000);
        return () => clearInterval(interval);
    }, [fetchTests, tests]);


    const getTestTimes = useCallback((test) => {
        const now = Math.round((new Date()).getTime() / 1000);
        const testUnixtime = test.testStartedAt ? Math.round((new Date(test.testStartedAt).getTime()) / 1000) : 0;
        const secondsLeft = defaultTime - (testUnixtime > 0 ? now - testUnixtime : 0);
        return { now, testUnixtime, secondsLeft }
    }, [defaultTime])


    useEffect(() => {
        const _tests = tests.filter(test => {
            const { now, testUnixtime } = getTestTimes(test);
            return test.testResult === null && testUnixtime > 0 && now - defaultTime >= testUnixtime
        });
        const _finishedTests = [];
        for(const test in _tests) {
            if(finishedTests.indexOf(test.uuid) === -1) {
                new Audio('ding.mp3');
                _finishedTests.push(test.uuid);
            }
        }
        setFinishedTests(_finishedTests);
        setPendingTests(_tests.length)
    }, [defaultTime, finishedTests, getTestTimes, tests])

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

        const { now, testUnixtime, secondsLeft} = getTestTimes(props.test);

        // Counter for active test button
        const [counter, setCounter] = useState(secondsLeft);
        useEffect(() => {
            const timer = counter <= defaultTime && counter > 0 && setInterval(() => {
                setCounter(counter - 1);
            }, 1000);
            if (counter === 0) { clearInterval(timer); }
            return () => { clearInterval(timer); }
        }, [counter]);

        const printButton = <Button onClick={() => printPDF(props.test.uuid)} size={'small'} className={'ml-3 '} variant={'contained'} startIcon={<FontAwesomeIcon icon={faPrint} />}>Zertifikat</Button>
        const cancelTestButton = <Button disabled={onUpdate} variant={'contained'} className={'ml-2'} onClick={() => cancelTest()}>Nicht erschienen</Button>
        const startTestButton = <Button disabled={onUpdate} variant={'contained'} color={'primary'} onClick={() => startTest()}>Test starten</Button>
        const resultButtons = <React.Fragment>
            <Button disabled={onUpdate} variant={'contained'} color={'primary'} className={classes.negativeButton} onClick={() => setResult('negative')}>negative</Button>
            <Button disabled={onUpdate} variant={'contained'} color={'primary'} className={classes.positiveButton} onClick={() => setResult('positive')}>positive</Button>
            <Button disabled={onUpdate} variant={'contained'} color={'primary'} className={classes.invalidButton} onClick={() => setResult('invalid')}>Ungültig</Button>
        </React.Fragment>

        const stopTestButton = (timeLeft) => {
            return <Button disabled={timeLeft <= 0 || onUpdate} variant={'contained'} className={classes.warningButton} onClick={() => stopTest()}>
                <FontAwesomeIcon fixedWidth spin icon={faSpinnerThird} className={'mr-2'} /> {timeLeft <= 0 ? 'Bitte warten' : Math.floor(timeLeft / 60) + ':' + ('' + timeLeft % 60).padStart(2, '0')}
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
            setOnUpdate(true);
            await updateServer(props.test.uuid, { testResult: res })
            setOnUpdate(false);
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
                {props.test.testResult === 'negative' && printButton}</div>

        } else if (props.test.invalidatedAt) {
            handler = <div><FontAwesomeIcon icon={faCalendarTimes} fixedWidth /> Termin abgesagt.</div>

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

        return <TableRow key={props.test.uuid}>
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
                {[props.test.email, props.test.phoneNumber, props.test.phoneLandLine].map(c => {
                    if (c) return <div key={c}>{c}</div>;
                    else return ''
                })}
            </TableCell>
            <TableCell>
                <TestHandler {...props} />
            </TableCell>
        </TableRow>
    }


    return (
        <div className="App">
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        <FontAwesomeIcon icon={faVial} fixedWidth /> Corona-Test-App Testübersicht und -durchführung
                    </Typography>
                    {pendingTests > 0 && <div className={'pending-tests'}><FontAwesomeIcon fixedWidth icon={faAlarmExclamation} /> {pendingTests} fertige Tests!</div>}
                    {onUpdate && <div><FontAwesomeIcon spin icon={faSpinnerThird} size={'2x'} /></div>}
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
                                <TableCell>Name</TableCell>
                                <TableCell>Kontakt</TableCell>
                                <TableCell><FontAwesomeIcon icon={faVial} fixedWidth /> Testdurchführung</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tests.length > 0 && tests.map(data => <TestRow key={'row-' + data.uuid} test={data} />)}
                        </TableBody>
                    </Table>
                </TableContainer>


            </Container>


        </div>
    );
}

export default App;
