const { spawn } = require('child_process');
const app = 'app.py';

/**
 * @namespace PyInstaller
 * @description - Child process to convert Python app into an executable (.exe).
 */

spawn(`pyinstaller --noconsole ${app}`, { detached: false, shell: true, stdio: 'inherit' });