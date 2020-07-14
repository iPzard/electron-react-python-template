import {
  CloseButton,
  ContractButton,
  MaximizeButton,
  MinimizeButton
} from 'components/titlebar/TitlebarButtons';
import React, { useState } from 'react';

import { app } from 'utils/services';
import favicon from 'components/titlebar/img/favicon.png';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import styles from 'components/titlebar/Titlebar.module.scss';

initializeIcons();

/*
  NOTICE:
  the IDs 'electron-window-title-text' & 'electron-window-title-buttons' below
  are used in main.js to set opacity when the screen goes in and out of focus.
*/

const Titlebar = () => {

  const [ maximized, setMaximized ] = useState(false);

  const handleMaximizeToggle = () => {
    !maximized ? app.maximize() : app.unmaximize();
    setMaximized(!maximized);
  };

  return (
    <section className={ styles.titlebar }>
      <div>
        <img src={ favicon } alt='favicon' />
        <span id='electron-window-title-text'>{ document.title }</span>
      </div>

      <div id='electron-window-title-buttons'>
        <MinimizeButton onClick={ app.minimize }/>

        {
          maximized ?
          <ContractButton onClick={ handleMaximizeToggle }/> :
          <MaximizeButton onClick={ handleMaximizeToggle }/>
        }
        <CloseButton onClick={ app.quit } />
      </div>
    </section>
  );
};

export default Titlebar;