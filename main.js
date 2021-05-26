const { get } = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Modules to help control application life cycle
const { app, BrowserWindow, ipcMain } = require('electron');
const { openPort } = require('./scripts/port');
const isDevMode = require('electron-is-dev');

// Function to shutdown Electron & Flask
const shutdown = (port) => {
  get(`http://localhost:${port}/quit`)
    .then(app.quit)
    .catch(app.quit);
};

// Browser window configurations
const browserWindows = {};

// Function to create window
const createMainWindow = (port) => {
  const { loadingWindow, mainWindow } = browserWindows;

  /**
   * If in developer mode, show a loading window while
   * the app and developer server compile.
  */
  if(isDevMode) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.hide();
    /**
     * Opening devTools, must be done before dom-ready
     * to avoid occasional error from the webContents
     * object being destroyed.
    */
    mainWindow.webContents.openDevTools({ mode: 'undocked' });

    /**
     * Hide loading window once the main
     * window is ready.
    */
    mainWindow.webContents.on('dom-ready', () => {


      // Fix page if error occurs during hot-loading
      const consistencyCheck = `
        var isBodyEmpty = document.body.innerHTML === "";
        var isHeadEmpty = document.head.innerHTML === "";
        var isLoadFail = isBodyEmpty && isHeadEmpty;

        if(isLoadFail) location.reload();
      `;

      // Check consistency, hide loading window & show main
      mainWindow.webContents.executeJavaScript(consistencyCheck)
        .catch((error) => console.error(error))
        .then(() => loadingWindow.hide())
        .then(() => mainWindow.show());
    });
  }

  // Use build/index.html for production release
  else mainWindow.loadFile(path.join(__dirname, 'build/index.html'));

  // Set opacity for title on window blur & focus
  const setTitleOpacity = (value) => `
    if(document.readyState === 'complete') {
      const titleBar = document.getElementById('electron-window-title-text');
      const titleButtons = document.getElementById('electron-window-title-buttons');

      if(titleBar) titleBar.style.opacity = ${value};
      if(titleButtons) titleButtons.style.opacity = ${value};
    }
  `;

  // Set window event handlers
  const executeOnWindow = (command) => mainWindow.webContents.executeJavaScript(command)
    .catch((error) => console.error(error));

  mainWindow.on('focus', () => executeOnWindow(setTitleOpacity(1)));
  mainWindow.on('blur', () => executeOnWindow(setTitleOpacity(.5)));

  // Send window control event listeners to front end
  ipcMain.on('app-maximize', (_event, _arg) => mainWindow.maximize());
  ipcMain.on('app-minimize', (_event, _arg) => mainWindow.minimize());
  ipcMain.on('app-quit', (_event, _arg) => shutdown(port));
  ipcMain.on('app-unmaximize', (_event, _arg) => mainWindow.unmaximize());
  ipcMain.on('get-port-number', (event, _arg) => event.returnValue = port);
};

// Loading window to show while Dev Build is being created
const createLoadingWindow = () => {
  return new Promise((resolve, reject) => {
    const { loadingWindow } = browserWindows;
    const loaderConfig = {
      react: 'utilities/loaders/react/index.html',
      redux: 'utilities/loaders/redux/index.html'
    };

    try {
      loadingWindow.loadFile(path.join(__dirname, loaderConfig.redux));
      loadingWindow.webContents.on('did-finish-load', () => {
        resolve(loadingWindow.show());
      });
    } catch(error) {
      reject((error) => console.error(error));
    }
  });
};

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
*/
app.whenReady().then(async () => {

  // Method to set port in range of 3001-3999, based on availability
  const port = await openPort();

  // Initialize main browser window
  browserWindows.mainWindow = new BrowserWindow({
    frame: false,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      preload: path.join(app.getAppPath(), 'preload.js')
    }
  });

  // If dev mode, use loading window and run Flask in shell
  if(isDevMode) {
    browserWindows.loadingWindow = new BrowserWindow({ frame: false }),
    createLoadingWindow().then(()=> createMainWindow(port));
    spawn(`python app.py ${port}`, { detached: true, shell: true, stdio: 'inherit' });
  }

  // Connect to Python micro-services for production.
  else {
    createMainWindow(port);
    spawn(`start ./resources/app/app.exe ${port}`, { detached: false, shell: true, stdio: 'pipe' });
  }

  app.on('activate', () => {
    /**
     * On macOS it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
    */
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(port);
  });

  // Feature to ensure single app instance
  const initialInstance = app.requestSingleInstanceLock();
  if (!initialInstance) app.quit();
  else {
    app.on('second-instance', () => {
      if(browserWindows.mainWindow?.isMinimized()) browserWindows.mainWindow?.restore();
      browserWindows.mainWindow?.focus();
    });
  }

  /**
   * Quit when all windows are closed, except on macOS. There, it's common
   * for applications and their menu bar to stay active until the user quits
   * explicitly with Cmd + Q.
  */
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
      shutdown(port);
  });
});
