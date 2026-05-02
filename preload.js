// Preload script — runs with Node access in an isolated context, then exposes
// a narrow API to the renderer via contextBridge. The renderer (with
// contextIsolation: true and nodeIntegration: false) has no other path to
// IPC, fs, or child_process.

const { contextBridge, ipcRenderer } = require('electron');

// Surgical filter for one specific Electron security warning that fires in
// dev mode and cannot be silenced upstream:
//
//   "Electron Security Warning (Insecure Content-Security-Policy) This
//   renderer process has either no Content Security Policy set or a policy
//   with 'unsafe-eval' enabled."
//
// public/index.html DOES set a CSP, but webpack-dev-server requires
// 'unsafe-eval' for HMR. Electron flags any CSP containing 'unsafe-eval'.
// The warning self-describes as dev-only ("will not show up once the app
// is packaged"), so silencing it here is harmless in production.
//
// Important: this filter is intentionally narrow — it matches only this
// exact warning string. Any other security warning Electron logs (e.g. if
// a future change re-enables nodeIntegration) will still surface.
const CSP_WARNING_MARKER = 'Insecure Content-Security-Policy';
const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes(CSP_WARNING_MARKER)) return;
  originalConsoleWarn(...args);
};

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Returns the Flask port assigned by main.js. Synchronous so renderer code
   * can use the value at module load time without an extra await.
   */
  getPort: () => ipcRenderer.sendSync('get-port-number'),

  // Window controls — fire-and-forget, no return value.
  maximize: () => ipcRenderer.send('app-maximize'),
  minimize: () => ipcRenderer.send('app-minimize'),
  quit: () => ipcRenderer.send('app-quit'),
  unmaximize: () => ipcRenderer.send('app-unmaximize')
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  ['chrome', 'node', 'electron'].forEach((type) => {
    replaceText(`${type}-version`, process.versions[type]);
  });
});
