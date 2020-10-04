const fs = require('fs')
const { spawn } = require('child_process');

/**
 * @namespace Build
 * @description - Builds React & Python builds of project so Electron can be used.
 */

// Check if project is using npm or yarn
const npm = './package-lock.json';
const yarn = './yarn.lock';

// Determine package manager to use
const command = fs.existsSync(npm) ? 'npm' :
  fs.existsSync(yarn) ? 'yarn' :
  'npm'; // default to npm

spawn(`${command} run build:react && ${command} run build:python`, { detached: false, shell: true, stdio: 'inherit' });