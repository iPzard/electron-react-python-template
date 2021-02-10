const { spawn } = require('child_process');
const spawnOptions = { detached: false, shell: true, stdio: 'inherit' };

/**
 * @namespace Developer
 * @description - Scripts to starts React & Electron (+ Python) developer mode.
 */
class Developer {

  /**
   * @description - Starts developer mode for Electron + React.
   * @memberof Developer
   */
  start = () => {
    // NOTICE: cannot use `spawnSync`, must use `spawn`.
    spawn(`cross-env BROWSER=none react-scripts start`, spawnOptions);
    spawn('electron .', spawnOptions);
  };

}

module.exports = { Developer };