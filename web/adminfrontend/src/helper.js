import { makeStyles } from "@material-ui/core";
import { green, orange, red, yellow } from "@material-ui/core/colors";
import { useEffect, useState } from "react";

console.log(process.env.REACT_APP_TEST_DURATION)
const defaultTime = parseInt(process.env.REACT_APP_TEST_DURATION || '900');

const apiBaseURL = new URL(window.location);
apiBaseURL.pathname = '/api/admin/';

const useTestTimes = (testStartedAt) => {
    const [secondsLeft, setSecondsLeft] = useState(defaultTime);
    const {now, testUnixtime, isFinished, isRunning} = calculateTimes(testStartedAt)
    useEffect(() => {
        const {testUnixtime, isRunning} = calculateTimes(testStartedAt)
        const interval = isRunning ? setInterval(() => {
            const {now, isFinished} = calculateTimes(testStartedAt)
            setSecondsLeft(testUnixtime === 0 ? defaultTime : defaultTime - (now - testUnixtime))
            if (isFinished) clearInterval(interval);
        }) : null
        return () => {
            clearInterval(interval)
        }
    }, [testStartedAt])
    return { now, testUnixtime, secondsLeft, isFinished, isRunning }
}

const calculateTimes = (testStartedAt) => {
    const now = Math.round((new Date()).getTime() / 1000);
    const testUnixtime = testStartedAt ? Math.round((new Date(testStartedAt).getTime()) / 1000) : 0;
    const isRunning = testUnixtime > 0 && defaultTime - (now - testUnixtime) >= 0
    const isFinished = testUnixtime > 0 && now - defaultTime >= testUnixtime
    return {now, testUnixtime, isRunning, isFinished}
}


const updateServer = async (uuid, update, triggerUpdate) => {
    const handleError = (err) => {
        console.log(err)
        //setErrorWindowMessage(err)
        //setOpenErrorWindow(true);
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
        if (triggerUpdate) triggerUpdate(uuid, result);
        return true
    } else {
        handleError(await response.text())
    }

}

const deleteFromServer = async (uuid, triggerUpdate) => {
    const handleError = (err) => {
        console.log(err)
        //setErrorWindowMessage(err)
        //setOpenErrorWindow(true);
    }
    const url = new URL('../appointments/' + uuid, apiBaseURL);
    const options = {
        method: 'DELETE',
    }
    const response = await fetch(url, options);
    if (response.ok) {
        if (triggerUpdate) triggerUpdate(uuid, { invalidatedAt: new Date() });
        return true
    } else {
        handleError(await response.text())
    }

}

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
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
        backgroundColor: orange['100']
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

export { useTestTimes, defaultTime, updateServer, apiBaseURL, useStyles, deleteFromServer, calculateTimes }
