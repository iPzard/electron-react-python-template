# CLAUDE.md

Guidance for Claude Code working in this repo. Project is a starter template for desktop apps that combine **Electron** (shell), **React + Redux Toolkit** (UI), and **Python/Flask** (backend microservice). Three processes run together; the wiring is the interesting part.

## Scope discipline (read this first, every session)

Two load-bearing rules. The user has called both out explicitly. Re-read at the start of every session.

### Rule 1 — minimum diff

**Do not introduce files, splits, refactors, or restructuring beyond what the current task literally asks for.** Specifically:
- Do **not** split `requirements.txt` into `requirements.txt` + `requirements-dev.txt`. Keep one file. Same for any analogous "runtime vs dev" or "best-practice" expansion.
- Do **not** add new files (CONTRIBUTING.md, configs, helper modules, fixtures folders) unless the task literally names them.
- Do **not** rename, reformat, or alphabetize unrelated code while in the area.
- Do **not** run long-lived dev processes (`yarn start`, `electron .`, `react-scripts start`) for smoke tests without explicit user OK and a guaranteed kill in the same call. Orphan processes have happened — don't repeat.
- If a side-fix is genuinely required for the requested task to land (e.g., a lint error blocking `yarn verify`), say so explicitly **before** doing it, and only the smallest version.

Memory: `feedback_no_unscoped_changes.md`.

### Rule 2 — packaged app is zero-install for end users

**Developers** cloning this template need Node + Python + `yarn install` + `pip install -r requirements.txt`. That's expected — the README setup section is for them.

**End users** who install the resulting MSI / DMG / DEB must NOT need Python, Node, pip, yarn, npm, virtualenvs, system libraries, or any other runtime. They double-click the installer and the app runs — like any other consumer desktop app.

Practical implications:
- Python runtime deps must be bundled by PyInstaller (`app.spec` `hiddenimports` / `datas`).
- Node runtime deps used by `main.js` / `preload.js` go in `dependencies`, not `devDependencies` (devDeps don't ship in the asar).
- Production code paths must not shell out to `pip`, `npm`, `node`, `python`, `git`, `make`, or any binary that may be absent on a clean Windows / macOS / Linux machine.
- No first-run installers, no postinstall download steps, no "install Python first" prompts.
- If a feature genuinely cannot ship without forcing an end-user install, stop and surface the constraint **before** implementing it.

Memory: `feedback_packaged_app_zero_runtime_deps.md`.

## Quick map

| Layer | Entry | Notes |
|---|---|---|
| Electron main | [main.js](main.js) | window creation, IPC handlers, Flask spawn, port assignment, shutdown |
| Preload | [preload.js](preload.js) | exposes a narrow `window.electronAPI` to renderer via `contextBridge` (renderer has `nodeIntegration: false`, `contextIsolation: true`) |
| Renderer entry | [src/index.js](src/index.js) | mounts React 18 under Redux `<Provider>` via `createRoot` |
| React app | [src/components/App.js](src/components/App.js) | example Flask `get('example')` call on mount, ref-guarded for StrictMode |
| Flask | [app.py](app.py) | single file, port from `sys.argv[1]`, binds 127.0.0.1, dev-only CORS for both `localhost:3000` and `127.0.0.1:3000` |
| Build/start scripts | [scripts/dispatch.js](scripts/dispatch.js) | command router for build/clean/package/start |

## How the three processes connect

1. `yarn start` → `scripts/dispatch.js start` → `Starter.developerMode()` ([scripts/start.js](scripts/start.js)) — kills port 3000, boots `react-scripts start` (HOST=127.0.0.1, BROWSER=none, DISABLE_ESLINT_PLUGIN=true), boots `electron .`. Filters known-noisy stderr from both children.
2. Electron `main.js` picks a free port in **3001–3999** via `get-port`, opens a frameless main window (loads `http://127.0.0.1:3000`) + a redux-themed loading window, and spawns `python app.py <port>`.
3. The renderer reads the port via `window.electronAPI.getPort()` (preload bridges to the sync IPC channel `get-port-number`) and calls Flask at `http://127.0.0.1:<port>`.
4. On shutdown, Electron hits `GET /quit` so Flask `os._exit`s itself, then `app.quit()` runs. A 3-second `app.exit(0)` fallback in `shutdown()` covers cases where `app.quit` silently no-ops.

## Conventions you must respect

### Imports
- Use **relative paths** for all in-project imports (`./counterSlice`, `../utils/requests`). Bare imports like `'components/foo'` no longer resolve — `baseUrl` was removed from `jsconfig.json` because it confused tooling (Prettier, ESLint plugins, IDE auto-import).
- Same convention applies inside any new files.

### Styling
- SCSS Modules only. File must be named `<Component>.module.scss` and imported as `styles from '...'`.
- Theme tokens in [src/theme/palette.js](src/theme/palette.js) (Fluent UI shape) and [src/theme/variables.scss](src/theme/variables.scss).

### React
- Function components + hooks. No class components anywhere in the codebase.
- Named export for feature components (`export function Counter`), default export for top-level page-ish components (`export default Titlebar`, `export default App`).
- One folder per feature under `src/components/<feature>/`. Slice file (`<feature>Slice.js`) sits next to its component.

### Redux
- `@reduxjs/toolkit`. Slice = `createSlice`, store registered in [src/state/store.js](src/state/store.js).
- Async actions written as manual thunks `(arg) => (dispatch) => { ... }` (see `incrementAsync` in [counterSlice.js](src/components/counter/counterSlice.js)). `createAsyncThunk` is **not** the established pattern here.
- Selectors prefixed `select`. Take full state, drill into the slice key.

### Flask
- `app.py` is single-file by design. Don't introduce blueprints or app factories.
- Port comes from `sys.argv[1]`. Don't hardcode.
- Dev-only branch: `if "app.py" in sys.argv[0]:` enables debug + CORS. PyInstaller-built binary skips this. Preserve the gate.
- All responses go through `jsonify(...)`; the renderer helpers call `.json()` on the response.

### IPC
- Renderer **cannot** call Electron directly (`contextIsolation: true`, `nodeIntegration: false`). All IPC goes through the bridge defined in [preload.js](preload.js) and exposed as `window.electronAPI`. To add a renderer-callable channel:
  1. Register the listener in `createMainWindow()` in [main.js](main.js).
  2. Expose a wrapper inside `contextBridge.exposeInMainWorld('electronAPI', { ... })` in [preload.js](preload.js).
  3. Call `window.electronAPI.<name>()` from the renderer; thin wrappers live in [src/utils/services.js](src/utils/services.js) (window control) and [src/utils/requests.js](src/utils/requests.js) (Flask via fetch).
- `get-port-number` is the only sync channel (uses `event.returnValue` so the renderer can read the port at module load).
- Currently registered channels: `app-maximize`, `app-minimize`, `app-quit`, `app-unmaximize`, `get-port-number`. Find them in `createMainWindow()` in [main.js](main.js).

### Linting
- ESLint 8 extends `airbnb` + `airbnb/hooks` + `plugin:react/recommended` ([.eslintrc.js](.eslintrc.js)). Parser is `@babel/eslint-parser` with `@babel/preset-react` for JSX.
- airbnb 19 brings many error-level rules: `sort-keys`, `react/button-has-type`, `react/function-component-definition`, `no-promise-executor-return`, etc. Run `yarn lint` (or `yarn lint --fix`) to surface them.
- CRA 5 ships its own `eslint-config-react-app` and would conflict with `.eslintrc.js`'s `react` plugin. We disable CRA's plugin via `DISABLE_ESLINT_PLUGIN=true` in dev/build (see [scripts/start.js](scripts/start.js) and [scripts/build.js](scripts/build.js)). Standalone `yarn lint` still runs the airbnb config.
- `serviceWorker.js` (CRA boilerplate) gets an override allowing `console`; demo `alert` in [App.js](src/components/App.js) carries a single `eslint-disable-next-line`.

## Verification (run after every change)

After any change to source files (`src/`, `app.py`, `main.js`, `preload.js`, `scripts/`, `package.json`, `requirements*.txt`), the contract is:

```bash
yarn verify         # lint → jest → pytest → React build
```

This is the single command the [change-verifier](.claude/agents/change-verifier.md) agent runs. The agent fires automatically via the `PostToolUse` hook in [.claude/settings.json](.claude/settings.json) on every Edit/Write/MultiEdit to in-scope files. The hook script ([.claude/hooks/verify-on-change.py](.claude/hooks/verify-on-change.py)) excludes Markdown, `.claude/`, `node_modules/`, build/dist/resources output, and unrelated assets — see `.claude/hooks/test_verify_on_change.py` for the scope rules.

If `yarn verify` fails:
- Lint failures: usually mechanical (key order, button type, missing import). Fix and rerun. `yarn lint --fix` handles many automatically.
- Jest failures: read the assertion message. Snapshot updates need explicit user approval.
- Pytest failures: see [tests/test_app.py](tests/test_app.py). Covers `/example` happy path, 404, CORS allowlist + denial, and `/quit` shutdown scheduling.
- React build failures: read the webpack error. CRA 5 / webpack 5 do not need the old `--openssl-legacy-provider` workaround.

Never silence a failure (`// eslint-disable`, `xtest`, swallowed exceptions). Fix or escalate.

The CI workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) runs the same chain on push and PR (Node 20, Python 3.11). Local agent + remote CI = two independent checks.

## Build & package

```bash
yarn start                       # dev: React + Electron + Flask together
yarn build                       # React production build + PyInstaller bundle
yarn build:package:windows       # MSI via electron-wix-msi  (requires WiX on PATH)
yarn build:package:mac           # DMG via electron-installer-dmg
yarn build:package:linux         # DEB via electron-installer-debian (needs fakeroot, dpkg)
yarn clean                       # remove build/test artifacts (build/, dist/, coverage/, __pycache__, etc.)
yarn clean:all                   # also remove node_modules + lockfiles (forces full reinstall)
yarn build:docs                  # JSDoc → ./docs (custom template in utilities/jsdoc)
yarn lint                        # ESLint (airbnb + react) over src/
yarn test                        # CRA jest runner
yarn test:python                 # pytest against tests/
yarn verify                      # full chain: lint + jest + pytest + react build
```

Prerequisites:
- `pip install -r requirements.txt` (Flask, flask-cors, pyinstaller, pytest).
- WiX Toolset on PATH for Windows MSI.
- Installer metadata (name, version, description, manufacturer) is read from `package.json`. Edit those fields once and the MSI/DMG/DEB pick them up.

Output paths:
- `./build/` — React production bundle
- `./resources/` — PyInstaller dist
- `./dist/<platform>/` — packaged app
- `./dist/<platform>/setup/` — installer

## Known sharp edges

- **Electron security flags are permissive.** `webPreferences` in [main.js](main.js) sets `contextIsolation: false`, `enableRemoteModule: true`, `nodeIntegration: true`. The renderer relies on `window.require('electron')` directly. If you flip these to harden, renderer code (`src/utils/requests.js`, `src/utils/services.js`) needs to move to `contextBridge.exposeInMainWorld`. **Don't flip without explicit user consent.**
- **`/quit` uses `werkzeug.server.shutdown`** ([app.py:43](app.py:43)) which is removed in Werkzeug 2.1+. If a user upgrades Werkzeug and hits `RuntimeError: Not running with the Werkzeug Server`, that's why.
- **`packageMacOS` passes `--win32` to electron-packager** ([scripts/package.js:78](scripts/package.js:78)). Looks like a copy-paste from the Windows branch. Flag this if mac packaging produces a Windows artifact rather than silently fixing.
- **Old dependency versions:** React 16, react-scripts 3.4, Electron 13, axios 0.21, react-redux 7. This is the template author's pinning. Don't blanket-upgrade; user may want stability over freshness.
- **`yarn clean` removes `yarn.lock` and `node_modules`.** That's deliberate per `cleanProject()` in [scripts/dispatch.js](scripts/dispatch.js), but warn the user before running it — versions can drift on reinstall.

## Available agents (`.claude/agents/`)

| Agent | When to invoke |
|---|---|
| `electron-ipc-engineer` | adding/removing IPC channels, modifying `BrowserWindow` config, titlebar/window controls |
| `flask-route-builder` | adding or debugging Flask endpoints in `app.py` |
| `redux-slice-author` | scaffolding new slices + store registration following `counterSlice` pattern |
| `packager-troubleshooter` | packaging failures (`build:package:*`), PyInstaller/electron-packager/WiX/DMG/DEB errors |
| `change-verifier` | invoke after every change in `src/`, `app.py`, `main.js`, `scripts/`, etc. — runs lint → jest → pytest → React build and reports/fixes |

## Available skills (`.claude/skills/`)

| Skill | When to invoke |
|---|---|
| `dev-start` | dev-mode boot, "loader hangs", port-in-use, Flask not responding |
| `add-flask-route` | full round-trip: Python endpoint + React caller + rebuild reminder |
| `add-react-component` | scaffolding a new component following folder/import/SCSS conventions |
| `clean-rebuild` | what `yarn clean` removes, fresh-rebuild sequence, stale-artifact diagnosis |
| `audit-claude-md` | verify CLAUDE.md claims still match code; run after refactors / dep bumps |

## Out of scope (don't add unprompted)

- TypeScript migration.
- A router (single-window app today).
- Database, auth, or session middleware on the Flask side.
- Code-signing config for macOS — currently produces unsigned builds.
- CSS-in-JS libraries — committed to SCSS Modules.
