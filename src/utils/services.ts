// Window-control helpers backed by the preload bridge (window.electronAPI).
// See preload.js for the exposed API.

/**
 * @namespace Services
 * @description - Methods exposed by the preload bridge for window control.
 * @property {function} maximize - Maximize the program window.
 * @property {function} minimize - Minimize the program window.
 * @property {function} quit - Close and exit the program.
 * @property {function} unmaximize - Restore (unmaximize) the program window.
 */
export const app = {
  maximize: (): void => window.electronAPI.maximize(),
  minimize: (): void => window.electronAPI.minimize(),
  quit: (): void => window.electronAPI.quit(),
  unmaximize: (): void => window.electronAPI.unmaximize()
};
