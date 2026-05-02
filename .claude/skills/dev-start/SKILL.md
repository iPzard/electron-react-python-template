---
name: dev-start
description: Use this skill when the user wants to run the app in dev mode, hits "white screen / loading screen never goes away", or asks how the React + Electron + Flask processes start together. Triggers include "yarn start", "dev server stuck", "Flask not responding", "port already in use", "loader hangs". Walks through the dev-mode handoff and the most common failures.
---

# Dev start — Electron + React + Flask handoff

## What `yarn start` does

`tsx ./scripts/dispatch.ts start` → `Starter.developerMode()`:

1. `npx kill-port 3000` — frees the React dev server port.
2. `cross-env HOST=127.0.0.1 BROWSER=none DISABLE_ESLINT_PLUGIN=true react-scripts start` — boots CRA dev server on `127.0.0.1:3000`.
3. `tsc -p tsconfig.electron.json` — compiles `main.ts` + `preload.ts` to `dist-electron/`. `package.json` `"main": "dist-electron/main.js"` is what Electron loads, so this output must exist before the next step.
4. `electron .` — boots Electron, which:
   - picks a free port in 3001–3999 via `get-port` (in `main.ts`),
   - opens a frameless **loading window** (`utilities/loaders/redux/index.html`),
   - spawns `python app.py <port>` in a shell,
   - opens the **main window** loading `http://127.0.0.1:3000`,
   - hides the loading window once the React DOM is populated (checked by injected JS in `main.ts`).

So three processes run: React dev server, Electron, Flask.

## Prerequisites checklist

Run these checks before declaring a bug:
- `node --version` → present.
- `python --version` (or `python3`) → present, and `pip install -r requirements.txt` has run (`Flask`, `flask-cors`, `pyinstaller`).
- `yarn install` has populated `node_modules`.
- Port 3000 is freeable. If `kill-port` fails, something else has it locked.

## Common failures and what they mean

| Symptom | Likely cause | Fix |
|---|---|---|
| Loader window hangs forever | React dev server not up yet, or threw a compile error | Check the React-dev-server terminal output; the `did-finish-load` handler in `main.ts` reloads on empty DOM but won't recover from a real CRA error |
| Electron exits immediately at boot | `tsc -p tsconfig.electron.json` failed → `dist-electron/main.js` missing | Look for the `tsc` errors in the terminal (printed before `electron .` is spawned). Fix the TS error and rerun `yarn start`. |
| Alert "Example response from Flask…" never appears | Flask did not start, or wrong port | Check terminal for Python traceback. Confirm `app.py` got the port arg: it's spawned as `python app.py <port>` in `main.ts` |
| `EADDRINUSE` on 3000 | Stale React dev server | Kill it manually; `kill-port` in start script runs once at boot |
| CORS error in DevTools | Renderer hit Flask from non-`localhost` origin | Don't change CORS. Renderer should call `127.0.0.1:<port>` (or `localhost:<port>`) only, via `requests.ts` helpers |
| `process.env.UPGRADE_EXTENSIONS` flag mention in errors | DevTools extension install (React/Redux DevTools) failed — non-fatal, app still loads |

## Verifying it works

- Main window should show the React UI with the Counter and a "Learn React/Redux/…" line.
- Within ~3s of load, an `alert()` fires saying "Example response from Flask!" — this proves the Flask round-trip via `src/utils/requests.ts` `get()`.
- Dragging the frameless title bar should work; min/max/close buttons should respond (they go through IPC channels in `main.ts`, surfaced to the renderer via the typed `electronAPI` bridge in `preload.ts`).

If the alert does not fire, Flask is the problem, not React/Electron.
