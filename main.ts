// Built-in modules
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

// Electron modules
import {
  app,
  BrowserWindow,
  ipcMain,
  type IpcMainEvent
} from 'electron';

// Extra modules — get-port v5 uses CommonJS-style namespace export.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import getPort = require('get-port');

// Electron's `app.isPackaged` is the canonical "is this a packaged build?"
// signal — no need for the `electron-is-dev` shim. Defined here as a
// constant so the rest of the file reads naturally.
const isDevMode = !app.isPackaged;


/**
 * Shuts down Electron & Flask.
 *
 * Uses Node's built-in http module rather than axios — this is the only
 * HTTP call from the Electron main process, so a dedicated client is
 * unnecessary. Flask responds with a JSON ack and then exits itself
 * (see app.py /quit). We don't read the body; we just need the request
 * to flush before quitting Electron.
 *
 * Belt-and-braces: schedule app.exit(0) a few seconds after app.quit().
 * app.quit() can be silently no-op'd by hidden windows, deadlocked
 * renderer hangs, or stuck devtools sessions — leaving electron.exe alive
 * after the user thinks they closed the app. app.exit() is unconditional.
 * @param {number} port - Port that Flask server is running on.
 */
const shutdown = (port: number): void => {
  const forceExit = setTimeout(() => app.exit(0), 3000);
  forceExit.unref();

  const finish = (): void => {
    app.quit();
  };

  const req = http.get(`http://127.0.0.1:${port}/quit`, finish);
  req.on('error', finish);
  req.setTimeout(2000, () => {
    req.destroy();
    finish();
  });
};


/**
 * Electron browser windows.
 *
 * @see https://www.electronjs.org/docs/api/browser-window
 */
interface BrowserWindowsRefs {
  mainWindow?: BrowserWindow;
  loadingWindow?: BrowserWindow | null;
}

const browserWindows: BrowserWindowsRefs = {};


/**
 * Creates main window.
 * @param {number} port - Port that Flask server is running on.
 */
const createMainWindow = (port: number): void => {
  const { loadingWindow, mainWindow } = browserWindows;
  if (!mainWindow) throw new Error('mainWindow not initialized before createMainWindow()');

  /**
   * Function to use custom JavaScript in the DOM.
   * @param {string} command - JavaScript to execute in DOM.
   * @param {function} callback - Callback to execute here once complete.
   * @returns {Promise}
   */
  const executeOnWindow = (
    command: string,
    callback?: (result: unknown) => void
  ): Promise<void> => {
    return mainWindow.webContents.executeJavaScript(command)
      .then((result: unknown) => { if (callback) callback(result); })
      .catch(console.error);
  };

  /**
   * If in developer mode, show a loading window while
   * the app and developer server compile.
   */
  if (isDevMode) {

    // Use 127.0.0.1 (not localhost) — CRA binds IPv4 only when HOST=127.0.0.1
    // is set in scripts/start.js. On Windows, Electron resolves "localhost"
    // to ::1 (IPv6) and the connection is refused.
    mainWindow.loadURL('http://127.0.0.1:3000');
    mainWindow.hide();

    /**
     * Hide loading window and show main window
     * once the main window is ready.
     */
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.openDevTools({ mode: 'undocked' });

      /**
       * Checks page for errors that may have occurred
       * during the hot-loading process.
       */
      const isPageLoaded = `
        var isBodyFull = document.body.innerHTML !== "";
        var isHeadFull = document.head.innerHTML !== "";
        var isLoadSuccess = isBodyFull && isHeadFull;

        isLoadSuccess || Boolean(location.reload());
      `;

      /**
       * Updates windows if page is loaded
       * @param {*} isLoaded
       */
      const handleLoad = (isLoaded: unknown): void => {
        if (isLoaded) {

          /**
           * Keep show() before destroy() in this order to prevent
           * unresponsive behavior during page load.
           *
           * IMPORTANT: destroy() — not hide(). The 'window-all-closed'
           * event only fires when every BrowserWindow is closed/destroyed.
           * A merely hidden loadingWindow keeps Electron alive in the
           * background, so when the user closes the main window, app.quit()
           * never fires and the electron.exe process leaks.
           */
          mainWindow.show();
          loadingWindow?.destroy();
          browserWindows.loadingWindow = null;
        }
      };

      /**
       * Checks if the page has been populated with
       * React project. if so, shows the main page.
       */
      executeOnWindow(isPageLoaded, handleLoad);
    });
  }

  /**
   * If using in production, the built version of the
   * React project will be used instead of localhost.
   *
   * After Phase 5 of TS migration, this file lives at dist-electron/main.js
   * (one level deep from app root). Use app.getAppPath() — works in dev
   * (project root) and prod (asar root) — instead of __dirname.
   */
  else mainWindow.loadFile(path.join(app.getAppPath(), 'build/index.html'));


  /**
   * Controls the opacity of title bar on focus/blur.
   * @param {number} value - Opacity to set for title bar.
   */
  const setTitleOpacity = (value: number): string => `
    if(document.readyState === 'complete') {
      const titleBar = document.getElementById('electron-window-title-text');
      const titleButtons = document.getElementById('electron-window-title-buttons');

      if(titleBar) titleBar.style.opacity = ${value};
      if(titleButtons) titleButtons.style.opacity = ${value};
    }
  `;


  mainWindow.on('focus', () => executeOnWindow(setTitleOpacity(1)));
  mainWindow.on('blur', () => executeOnWindow(setTitleOpacity(0.5)));

  /**
   * Listen and respond to ipcRenderer events on the frontend.
   * @see `src\utils\services.ts`
   */
  ipcMain.on('app-maximize', () => mainWindow.maximize());
  ipcMain.on('app-minimize', () => mainWindow.minimize());
  ipcMain.on('app-quit', () => shutdown(port));
  ipcMain.on('app-unmaximize', () => mainWindow.unmaximize());
  ipcMain.on('get-port-number', (event: IpcMainEvent) => {
    event.returnValue = port;
  });
};


/**
 * Creates loading window to show while build is created.
 */
const createLoadingWindow = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const { loadingWindow } = browserWindows;
    if (!loadingWindow) {
      reject(new Error('loadingWindow not initialized'));
      return;
    }

    // Path to the developer loading screen shown while CRA compiles.
    // Add new variants under utilities/loaders/<name>/ if you want to swap.
    const loaderHtml = 'utilities/loaders/redux/index.html';

    try {
      // app.getAppPath() instead of __dirname so this resolves correctly
      // after main.js relocated to dist-electron/.
      loadingWindow.loadFile(path.join(app.getAppPath(), loaderHtml));

      loadingWindow.webContents.on('did-finish-load', () => {
        loadingWindow.show();
        resolve();
      });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};


/**
 * Installs developer extensions. The package is a devDependency
 * so it's absent from production bundles (closed issue #23). We therefore
 * require it lazily and swallow MODULE_NOT_FOUND — the installer is purely
 * a dev convenience.
 * @returns {Promise}
 */
const installExtensions = async (): Promise<unknown> => {
  const isForceDownload = Boolean(process.env.UPGRADE_EXTENSIONS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let installer: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    installer = require('electron-devtools-installer');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') throw error;
    return undefined;
  }

  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']
    .map((extension) => installer.default(installer[extension], isForceDownload));

  return Promise
    .allSettled(extensions)
    .catch(console.error);
};


/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
*/
app.whenReady().then(async () => {

  /**
   * Method to set port in range of 3001-3999,
   * based on availability.
   */
  const port = await getPort({
    port: getPort.makeRange(3001, 3999)
  });

  /**
   * Assigns the main browser window on the
   * browserWindows object.
   *
   * preload sits next to main.js in dist-electron/ after compile —
   * use __dirname so this works in dev and inside the asar in prod.
   */
  browserWindows.mainWindow = new BrowserWindow({
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  /**
   * If not using in production, use the loading window
   * and run Flask in shell.
   */
  if (isDevMode) {
    await installExtensions(); // React, Redux devTools
    browserWindows.loadingWindow = new BrowserWindow({ frame: false });
    createLoadingWindow().then(() => createMainWindow(port));
    spawn(`python app.py ${port}`, { detached: true, shell: true, stdio: 'inherit' });
  }

  /**
   * If using in production, use the main window
   * and run bundled app (dmg, elf, or exe) file.
   */
  else {
    createMainWindow(port);

    // Production Flask launch.
    //
    // Path lives at process.resourcesPath (the dir CONTAINING app.asar),
    // NOT app.getAppPath() (which is the asar itself — you can't spawn a
    // binary from inside a read-only archive). electron-packager's
    // --extra-resource flag drops the PyInstaller dir at
    //   <install>/resources/app/   on Win/Linux
    //   <install>/Resources/app/   inside the .app bundle on macOS
    // and process.resourcesPath resolves to that parent on every platform.
    //
    // We spawn the Flask binary directly rather than through a shell. That
    // avoids the `start` cmd quirk on Windows (returns immediately, drops
    // stderr) and the `open -gj` path on macOS (swallows errors silently).
    const flaskBinaryName = process.platform === 'win32' ? 'app.exe' : 'app';
    const flaskBinary = path.join(
      process.resourcesPath,
      'app',
      flaskBinaryName
    );

    // Capture Flask stdout + stderr to a logfile in the OS user-data dir.
    // PyInstaller's `console=False` (in app.spec) means there's no console
    // window in production, so a Flask traceback would otherwise vanish.
    // The log path is platform-specific:
    //   Windows: %APPDATA%\<app-name>\flask.log
    //   macOS:   ~/Library/Application Support/<app-name>/flask.log
    //   Linux:   ~/.config/<app-name>/flask.log
    // Template users who want different routing (rotation, no log at all,
    // separate stdout/stderr) can edit the few lines below.
    const userDataDir = app.getPath('userData');
    fs.mkdirSync(userDataDir, { recursive: true });
    const flaskLogPath = path.join(userDataDir, 'flask.log');
    const flaskLog = fs.createWriteStream(flaskLogPath, { flags: 'a' });
    flaskLog.write(`\n--- Flask launched at ${new Date().toISOString()} on port ${port} ---\n`);

    const flaskProc = spawn(flaskBinary, [String(port)], {
      cwd: path.dirname(flaskBinary),
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    flaskProc.stdout?.pipe(flaskLog);
    flaskProc.stderr?.pipe(flaskLog);
  }

  app.on('activate', () => {
    /**
     * On macOS it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
    */
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(port);
  });

  /**
   * Ensures that only a single instance of the app
   * can run, this correlates with the "name" property
   * used in `package.json`.
   */
  const initialInstance = app.requestSingleInstanceLock();
  if (!initialInstance) app.quit();
  else {
    app.on('second-instance', () => {
      if (browserWindows.mainWindow?.isMinimized()) browserWindows.mainWindow?.restore();
      browserWindows.mainWindow?.focus();
    });
  }

  /**
   * Quit when all windows are closed, except on macOS. There, it's common
   * for applications and their menu bar to stay active until the user quits
   * explicitly with Cmd + Q.
  */
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      shutdown(port);
    }
  });
});
