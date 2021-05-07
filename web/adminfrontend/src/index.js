import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import theme from './theme';
import 'fontsource-roboto';

import 'element-internals-polyfill';
import '@webcomponents/webcomponentsjs/webcomponents-loader.js';

import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
  
);