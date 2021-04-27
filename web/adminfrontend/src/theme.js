import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
  palette: {
    primary: {
      //main: '#152968',
      main: '#25a534',
      background: '#111'
    },
    secondary: {
      //main: '#25a534',
      main: '#152968'
    },
    error: {
      main: red.A400,
    },
    
    type: 'light'
  },
});

export default theme;