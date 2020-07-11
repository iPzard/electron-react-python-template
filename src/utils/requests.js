// Electron Inter Process Communication and dialog
const { ipcRenderer } = window.require('electron');

// Dynamically generated TCP (open) port between 3000-3999
const port = ipcRenderer.sendSync('get-port-number');


/**
* Helper GET method for sending requests to and from the Python/Flask services.
* @param route - URL route of the Python/Flask service you want to use.
* @return response data from Python/Flask service.
*/
export const get = (route) => {
  fetch(`http://localhost:${port}/${route}`)
  .catch(error => console.error(error))
  .then(response => response.text())
  .then(response => console.log(response));
};


/**
* Helper POST method for sending requests to and from the Python/Flask services.
* @param body     - request body of data that you want to pass.
* @param route    - URL route of the Python/Flask service you want to use.
* @param callback - optional callback function to be invoked if provided.
* @return response data from Python/Flask service.
*/
export const post = (body, route, callback) => {
  fetch(`http://localhost:${port}/${route}`, {
    body,
    method: 'POST',
    headers: { 'Content-type': 'application/json' }
  })
  .catch(error => console.error(error))
  .then(response => response.json()).then(response => callback(response) || undefined);
};