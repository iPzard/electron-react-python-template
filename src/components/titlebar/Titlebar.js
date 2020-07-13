import {
  CloseButton,
  ContractButton,
  MaximizeButton,
  MinimizeButton
} from 'components/titlebar/TitlebarButtons';
import React, { useState } from 'react';

//import PropTypes from 'prop-types';
import { app } from 'utils/services';
import favicon from 'components/titlebar/img/favicon.png';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import styles from 'components/titlebar/Titlebar.module.scss';

initializeIcons();


const Titlebar = props => {

  const [ maximized, setMaximized ] = useState(false);

  const handleMaximizeToggle = () => {
    !maximized ? app.maximize() : app.unmaximize();
    setMaximized(!maximized);
  };

  return (
    <section className={ styles.titlebar }>
      <div>
        <img src={ favicon } alt='favicon' />
        <span>{ document.title }</span>
      </div>

      <div>
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

//Titlebar.propTypes = { };

export default Titlebar;