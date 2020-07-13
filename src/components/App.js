import React, { useState } from 'react';
import { mapDispatchToProps, mapStateToProps } from 'state/dispatch';

import Titlebar from 'components/titlebar/Titlebar';
import { connect } from 'react-redux';
import { customTheme } from 'theme/palette';
import { loadTheme } from 'office-ui-fabric-react';

loadTheme({ palette: customTheme });

const App = (props) => {

  // From redux...
  const { state, add, subtract } = props;

  return (
    <main>
      <Titlebar />
      <h1>Electron React Python</h1>
      <p>Welcome to the Electron React Python starter app! Change this code in './src/components/App.js'</p>
      <h5>Redux in action:</h5>
      <p>{ state.count }</p>
      <button onClick={ add }>Up</button>
      <button onClick={ subtract }>Down</button>
    </main>
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
