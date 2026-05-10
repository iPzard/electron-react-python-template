import React, { useEffect, useRef } from 'react';
import { get } from '../utils/requests';

import { Counter } from './counter/Counter';
import Titlebar from './titlebar/Titlebar';

import logo from '../logo.svg';
import styles from './App.module.scss';

function App() {
  // Guard for the example Flask call below.
  //
  // Under React 18 + <React.StrictMode> (see src/index.js), every effect with
  // an empty dep array runs TWICE in development to surface side-effect bugs
  // — production builds run it once. Without this ref the demo would fire two
  // alerts on first mount in dev. Real-world fetches should also be idempotent
  // under StrictMode; this is the canonical pattern.
  //
  // If your effect represents an API call that's safe to retry, you can drop
  // the guard. If you want StrictMode's double-invoke check turned off
  // entirely, remove <React.StrictMode> in src/index.js (not recommended —
  // it catches real bugs).
  const hasFiredExampleCallRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasFiredExampleCallRef.current) return undefined;
    hasFiredExampleCallRef.current = true;

    /**
     * Example call to Flask. The fetch helper retries on connection-refused
     * so we no longer need a setTimeout to wait for Flask to bind.
     * @see /src/utils/requests.js
     * @see /app.py
     */
    get<string>(
      'example',
      (response) => alert(response),
      (error) => console.error(error)
    );
    return undefined;
  }, []);

  return (
    <>
      <Titlebar />

      <div className={ styles.app }>
        <header className={ styles['app-header'] }>
          <img src={ logo } className={ styles['app-logo'] } alt="logo" />
          <Counter />
          <p>
            Edit
            {' '}
            <code>src/App.js</code>
            {' '}
            and save to reload.
          </p>
          <span>
            <span>Learn </span>
            <a
              className={ styles['app-link'] }
              href="https://reactjs.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              React
            </a>
            <span>, </span>
            <a
              className={ styles['app-link'] }
              href="https://redux.js.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Redux
            </a>
            <span>, </span>
            <a
              className={ styles['app-link'] }
              href="https://redux-toolkit.js.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Redux Toolkit
            </a>
            ,
            <span> and </span>
            <a
              className={ styles['app-link'] }
              href="https://react-redux.js.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              React Redux
            </a>
          </span>
        </header>
      </div>
    </>
  );
}

export default App;
