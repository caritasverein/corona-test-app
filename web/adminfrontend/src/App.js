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
import { faCalendarTimes, faCheck, faExclamationTriangle, faSpinnerThird, faTimes, faVial } from "@fortawesome/pro-solid-svg-icons";

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
    positivButton: {
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
    positiv: {
        color: red['500']
    },
    invalid: {
        color: yellow['900']
    },
    negativ: {
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

    const [tests, setTests] = useState({});
    const [openErrorWindow, setOpenErrorWindow] = useState(false);
    const [errorWindowMessage, setErrorWindowMessage] = useState('');
    const [onUpdate, setOnUpdate] = useState(false);

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

    useEffect(() => {

    })

    const errorWindowHandleClose = () => {
        setOpenErrorWindow(false);
    };

    const resultIcons = {
        'positiv': <FontAwesomeIcon icon={faExclamationTriangle} fixedWidth />,
        'negativ': <FontAwesomeIcon icon={faCheck} fixedWidth />,
        'invalid': <FontAwesomeIcon icon={faTimes} fixedWidth />
    }

    const resultText = {
        'positiv': 'Testergebnis positiv',
        'negativ': 'Testergebnis negativ',
        'invalid': 'Testergebnis ungültig'
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

    const deleteFromServer = async (uuid, update) => {
        const handleError = (err) => {
            console.log(err)
            setErrorWindowMessage(err)
            setOpenErrorWindow(true);
        }
        const url = new URL('./appointments/' + uuid, apiBaseURL);
        const options = {
            method: 'DELETE',
        }
        const response = await fetch(url, options);
        if (response.ok) {
            updateTest(uuid, {invalidatedAt: new Date()});
            return true
        } else {
            handleError(await response.text())
        }

    }

    const TestHandler = (props) => {

        const now = Math.round((new Date()).getTime() / 1000);
        const testUnixtime = props.test.testStartedAt ? Math.round((new Date(props.test.testStartedAt).getTime()) / 1000) : 0;
        const secondsLeft = defaultTime - (testUnixtime > 0 ? now - testUnixtime : 0);

        // Counter for active test button
        const [counter, setCounter] = useState(secondsLeft);
        useEffect(() => {
            const timer = counter <= defaultTime && counter > 0 && setInterval(() => {
                setCounter(counter - 1);
            }, 1000);
            if (counter === 0) { clearInterval(timer); }
            return () => { clearInterval(timer); }
        }, [counter]);

        const cancelTestButton = <Button disabled={onUpdate} variant={'contained'} className={'ml-2'} onClick={() => cancelTest()}>Nicht erschienen</Button>
        const startTestButton = <Button disabled={onUpdate} variant={'contained'} color={'primary'} onClick={() => startTest()}>Test starten</Button>
        const resultButtons = <React.Fragment>
            <Button disabled={onUpdate} variant={'contained'} color={'primary'} className={classes.negativeButton} onClick={() => setResult('negativ')}>Negativ</Button>
            <Button disabled={onUpdate} variant={'contained'} color={'primary'} className={classes.positivButton} onClick={() => setResult('positiv')}>Positiv</Button>
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
            await updateServer(props.test.uuid, { ...props.test, testStartedAt: (new Date()).toISOString() })
            setOnUpdate(false);
        }

        const stopTest = async () => {
            setOnUpdate(true);
            await updateServer(props.test.uuid, { ...props.test, testStartedAt: null })
            setOnUpdate(false);
        }

        const setResult = async (res) => {
            setOnUpdate(true);
            await updateServer(props.test.uuid, { ...props.test, testResult: res })
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
            handler = <div className={classes[props.test.testResult]}>{resultIcons[props.test.testResult]} {resultText[props.test.testResult]}</div>

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
                {props.test.nameFamily}, {props.test.nameGiven}<br />
                <div className={'text-muted'}>{props.test.address}</div>
            </TableCell>
            <TableCell>
                {[props.test.email, props.test.phoneNumber, props.test.phoneLandLine].map(c => {
                    if (c) return <div key={c}>{c}</div>;
                    else return ''
                })}
            </TableCell>
            <TableCell align={'right'}>
                {(new Date(props.test.dateOfBirth)).toLocaleDateString('de-DE', options)}
            </TableCell>
            <TableCell>
                <TestHandler {...props} />
            </TableCell>
        </TableRow>
    }


    return (
        <div className="App">
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        <FontAwesomeIcon icon={faVial} fixedWidth /> Corona-Test-App Testübersicht und -durchführung
                    </Typography>
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
                                <TableCell align={'right'}>Geburtstag</TableCell>
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
