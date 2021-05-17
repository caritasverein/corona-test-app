import { AppBar, Button, Container, Dialog, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Toolbar, Typography } from "@material-ui/core";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faClock, faIdCard, faPlus, faTag, faTimes, faUser, faVial } from "@fortawesome/free-solid-svg-icons";
import EditAppointment from 'shared/components/edit-appointment.js';

import { apiBaseURL, useStyles, defaultTime } from "./helper";
import TestRow from "./TestRow";

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


    const classes = useStyles();

    const [tests, setTests] = useState([]);
    const [openErrorWindow, setOpenErrorWindow] = useState(false);
    const [errorWindowMessage, setErrorWindowMessage] = useState('');
    const [pendingTests, setPendingTests] = useState(0)
    const [finishedTests, setFinishedTests] = useState([]);
    const [showLoginButton, setShowLoginButton] = useState(false);
    const [showAddingDialog, setShowAddingDialog] = useState(false);
    const [view, setView] = useState('all')

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


    const updatePendingTests = useCallback(() => {
        const _finishedTests = tests.filter(test => {
            const now = Math.round((new Date()).getTime() / 1000);
            const testUnixtime = test.testStartedAt ? Math.round((new Date(test.testStartedAt).getTime()) / 1000) : 0;
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
    }, [finishedTests, tests])

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


    const errorWindowHandleClose = () => {
        setOpenErrorWindow(false);
    };

    const updateTest = (uuid, update) => {
        const index = tests.findIndex(d => d.uuid === uuid);
        if (index > -1) {
            const _tests = [...tests];
            _tests[index] = { ..._tests[index], ...update }
            setTests(_tests)
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
            body: JSON.stringify({ ...data, time: new Date().toISOString() })
        }
        const url = new URL('./appointments', apiBaseURL);
        const response = await fetch(url, options);
        if (response.ok) {
            handleAddingDialogClose()
        } else {
            handleError(await response.text())
        }
    }


    const viewFilter = (test) => {
        if(view === 'all') return true;
        if(view === 'tests') return test.arrivedAt && test.testResult === null;
        //const { isFinished} = calculateTimes(test);
        if(view === 'secretary') return test.arrivedAt === null || (test.testResult === null) || (test.testResult !== null && test.needsCertificate)
    }

    return (
        <div className="App">
            <AppBar position="sticky">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        <FontAwesomeIcon icon={faVial} fixedWidth /> {process.env.REACT_APP_LOCATION_NAME} - Testübersicht und -durchführung
                    </Typography>
                    <FormControl variant="filled" className={classes.formControl + ' mx-2'} size="small">
                        <InputLabel id="demo-simple-select-filled-label">Ansicht</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={view}
                            onChange={e => setView(e.target.value)}
                        >
                            <MenuItem value={'all'}>Alles anzeigen</MenuItem>
                            <MenuItem value={'tests'}>Testungen</MenuItem>
                            <MenuItem value={'secretary'}>Empfang</MenuItem>
                        </Select>
                    </FormControl>
                    <Button onClick={() => setShowAddingDialog(true)} className={'mx-2'} variant={'contained'} startIcon={<FontAwesomeIcon icon={faPlus} />}>Person hinzufügen</Button>
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

            <Container maxWidth={'lg'} className={'my-5'}>
                <TableContainer component={Paper}>
                    <Table className={classes.table} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell><FontAwesomeIcon icon={faTag} fixedWidth /></TableCell>
                                <TableCell><FontAwesomeIcon icon={faClock} fixedWidth /></TableCell>
                                <TableCell><FontAwesomeIcon icon={faIdCard} fixedWidth /> Name</TableCell>
                                <TableCell><FontAwesomeIcon icon={faVial} fixedWidth /> Testdurchführung</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tests.length > 0 &&
                            tests
                            //.filter(test => hiddenTests.indexOf(test.uuid) === -1)
                            .filter(test => viewFilter(test))
                            .map((test, index) => <TestRow key={'row-' + test.uuid} view={view} test={test} index={index} triggerUpdate={updateTest} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </div>
    );
}

export default App;
