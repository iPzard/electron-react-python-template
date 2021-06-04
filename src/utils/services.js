// Electron Inter Process Communication and dialog
const { ipcRenderer } = window.require('electron');

/**
 * @namespace Services
 * @description - Methods from Electron Inter Process Communication.
 * @property {function} maximize - Function to maximize the screen size of the program.
 * @property {function} minimize - Function to minimize the screen size of the program.
 * @property {function} quit - Function to close and exit the program.
 * @property {function} unmaximize - Function to contract (unmaximize) the screen size of the program.
 */
export const app = {
  maximize: () => ipcRenderer.send('app-maximize'),
  minimize: () => ipcRenderer.send('app-minimize'),
  quit: () => ipcRenderer.send('app-quit'),
  unmaximize: () => ipcRenderer.send('app-unmaximize')
};