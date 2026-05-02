import './index.scss';

import { Provider } from 'react-redux';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import store from './state/store';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={ store }>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
