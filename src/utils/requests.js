// Talks to the Python/Flask backend via fetch. The Flask port is provided by
// the preload bridge (see preload.js → contextBridge → window.electronAPI).
// The renderer no longer has direct Electron access (contextIsolation: true).
//
// Flask is spawned by Electron in parallel with the React dev server, so the
// first few requests after startup may race the Flask bind. fetchWithRetry
// retries on connection-refused-style errors with exponential backoff up to
// `maxAttempts` total attempts.

const port = window.electronAPI.getPort();

const RETRYABLE_NETWORK_ERROR = /Failed to fetch|NetworkError|ECONNREFUSED|connection refused/i;

const fetchWithRetry = async (url, init, maxAttempts = 6) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await (init === undefined ? fetch(url) : fetch(url, init));
    } catch (error) {
      lastError = error;
      const message = (error && error.message) || '';
      if (!RETRYABLE_NETWORK_ERROR.test(message) || attempt === maxAttempts) {
        throw error;
      }
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms (capped)
      const delay = Math.min(100 * 2 ** (attempt - 1), 1600);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => { setTimeout(r, delay); });
    }
  }
  throw lastError;
};

/**
 * @namespace Requests
 * @description - Helper functions for network requests (e.g., get, post, put, delete, etc..)
 */

/**
* @description - Helper GET method for sending requests to and from the Python/Flask services.
* @param {string} route - Path of the Python/Flask service you want to use.
* @param {Function} callback - Callback function which uses the returned data as an argument.
* @return response data from Python/Flask service.
* @memberof Requests
*/
export const get = (route, callback, errorCallback) => {
  fetchWithRetry(`http://127.0.0.1:${port}/${route}`)
    .then((response) => response.json())
    .then(callback)
    .catch((error) => (errorCallback ? errorCallback(error) : console.error(error)));
};


/**
* @description - Helper POST method for sending requests to and from the Python/Flask services.
* @param body - request body of data that you want to pass.
* @param route - URL route of the Python/Flask service you want to use.
* @param callback - optional callback function to be invoked if provided.
* @return response data from Python/Flask service.
* @memberof Requests
*/
export const post = (
  body,
  route,
  callback,
  errorCallback
) => {
  fetchWithRetry(`http://127.0.0.1:${port}/${route}`, {
    body,
    headers: { 'Content-type': 'application/json' },
    method: 'POST'
  })
    .then((response) => response.json())
    .then(callback)
    .catch((error) => (errorCallback ? errorCallback(error) : console.error(error)));
};
