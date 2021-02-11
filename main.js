const getPort = require('get-port');
const isDevMode = require('electron-is-dev');
const path = require('path');
const { spawn } = require('child_process');

// Modules to help control application life cycle
const { app, BrowserWindow, ipcMain } = require('electron');
const { get } = require('axios');
let port, loadingWindow;

// Set port in range of 3001-3999, based on availability
(async () => {
  port = await getPort({ port: getPort.makeRange(3001, 3999) });
  ipcMain.on('get-port-number', (event, _arg) => event.returnValue = port);
})();

// Function to shutdown Electron & Flask
const shutdown = (port)=> {
  get(`http://localhost:${port}/quit`)
    .then(() => app.quit())
    .catch(()=> app.quit());
};

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    frame: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Show loading screen while creating developer build
  if(isDevMode) {
    mainWindow.hide(); // Hide while dev build is created
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.on('dom-ready', () => { // Once dev build is complete
      loadingWindow.destroy(); // Get rid of loading window
      mainWindow.show(); // Show main window
    });
  }

  // Use build/index.html for production release
  else mainWindow.loadFile(path.join(__dirname, 'build/index.html'));

  // Open the DevTools
   mainWindow.webContents.openDevTools();

  // Set opacity for title on window blur & focus
  const setTitleOpacity = value => `
    document.getElementById('electron-window-title-text').style.opacity = ${value};
    document.getElementById('electron-window-title-buttons').style.opacity = ${value}
  `;

   const executeOnWindow = command => mainWindow.webContents.executeJavaScript(command);
   mainWindow.on('focus', () => executeOnWindow(setTitleOpacity(1)));
   mainWindow.on('blur', () => executeOnWindow(setTitleOpacity(.5)));

   // Send window control event listeners to front end
   ipcMain.on('app-maximize', (_event, _arg) => mainWindow.maximize());
   ipcMain.on('app-minimize', (_event, _arg) => mainWindow.minimize());
   ipcMain.on('app-quit', (_event, _arg) => shutdown(port));
   ipcMain.on('app-unmaximize', (_event, _arg) => mainWindow.unmaximize());
};

// Loading window to show while Dev Build is being created
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({ frame: false });

  return new Promise((resolve, reject) => {
    try {
      loadingWindow.loadFile(path.join(__dirname, 'utilities/loading/index.html'));
      loadingWindow.webContents.on('did-finish-load', () => {
        resolve(loadingWindow.show());
      });
    } catch(error) {
      reject((error) => console.error(error));
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if(isDevMode) createLoadingWindow().then(createWindow);
  else createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Run Flask in a shell for developer mode.
  if(isDevMode) spawn(`python app.py ${port}`, { detached: true, shell: true, stdio: 'inherit' });

  // Connect to Python micro-services for production.
  else spawn(`start ./resources/app/app.exe ${port}`, { detached: false, shell: true, stdio: 'pipe' });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin')
    shutdown(port);
});
