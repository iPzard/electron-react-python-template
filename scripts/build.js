const { spawnSync } = require('child_process');
const [ , , ...sysArgs ] = process.argv;
const [ type = 'default' ] = sysArgs;

/**
 * @namespace Building
 * @description - Builds React & Python builds of project so Electron can be used.
 * @argument type - Technology to build (e.g., python, react, or all).
 */

switch(type) {
  case 'react':
    return buildReact();

  case 'python':
    return buildPython();

  case 'all':
  case 'default':
  default:
    return buildAll();
};

function buildAll() {
  buildPython();
  buildReact();
};

function buildPython(){
  const app = 'app.py';
  const icon = './public/favicon.ico';
  /**
   * @namespace PyInstaller
   * @description - Child process to convert Python app into an executable (.exe).
   */

  const options = [
    '--noconsole',
    '--noconfirm',
    '--distpath ./resources',
    `--icon ${icon}`
  ].join(' ');

  console.log('Creating Python distribution files...');
  spawnSync(`pyinstaller ${options} ${app}`, { detached: false, shell: true, stdio: 'inherit' });
};

function buildReact() {
  console.log('Creating React distribution files...');
  spawnSync(`react-scripts build`, { detached: false, shell: true, stdio: 'inherit' });
};