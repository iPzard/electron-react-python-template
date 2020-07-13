// Electron Inter Process Communication and dialog
const { ipcRenderer } = window.require('electron');

export const app = {
  maximize: () => ipcRenderer.send('app-maximize'),
  minimize: () => ipcRenderer.send('app-minimize'),
  quit: () => ipcRenderer.send('app-quit'),
  unmaximize: () => ipcRenderer.send('app-unmaximize')
};