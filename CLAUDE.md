# CLAUDE.md

Guidance for Claude Code working in this repo. Project is a starter template for desktop apps that combine **Electron** (shell), **React + Redux Toolkit** (UI), and **Python/Flask** (backend microservice). Three processes run together; the wiring is the interesting part. The renderer, Electron main + preload, and build scripts are all TypeScript.

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
- Node runtime deps used by `main.ts` / `preload.ts` go in `dependencies`, not `devDependencies` (devDeps don't ship in the asar).
- Production code paths must not shell out to `pip`, `npm`, `node`, `python`, `git`, `make`, or any binary that may be absent on a clean Windows / macOS / Linux machine.
- No first-run installers, no postinstall download steps, no "install Python first" prompts.
- If a feature genuinely cannot ship without forcing an end-user install, stop and surface the constraint **before** implementing it.

Memory: `feedback_packaged_app_zero_runtime_deps.md`.

## Quick map

| Layer | Entry | Notes |
|---|---|---|
| Electron main | [main.ts](main.ts) | window creation, IPC handlers, Flask spawn, port assignment, shutdown. Compiles to `dist-electron/main.js` via `tsconfig.electron.json`. |
| Preload | [preload.ts](preload.ts) | exposes a typed `window.electronAPI` to renderer via `contextBridge` (renderer has `nodeIntegration: false`, `contextIsolation: true`). Imports the contract from `src/types/electron-api.ts`. |
| ElectronAPI contract | [src/types/electron-api.ts](src/types/electron-api.ts) | single source of truth for the bridge surface. Augments `Window` via `declare global`. |
| Renderer entry | [src/index.tsx](src/index.tsx) | mounts React 18 under Redux `<Provider>` via `createRoot` |
| React app | [src/components/App.tsx](src/components/App.tsx) | example Flask `get<string>('example')` call on mount, ref-guarded for StrictMode |
| Typed Redux hooks | [src/state/hooks.ts](src/state/hooks.ts) | `useAppSelector` + `useAppDispatch` — components use these instead of plain `react-redux` hooks |
| Flask | [app.py](app.py) | single file, port from `sys.argv[1]`, binds 127.0.0.1, dev-only CORS for both `localhost:3000` and `127.0.0.1:3000` |
| Build/start scripts | [scripts/dispatch.ts](scripts/dispatch.ts) | command router for build/clean/package/start. Run via `tsx`. |

## How the three processes connect

1. `yarn start` → `tsx ./scripts/dispatch.ts start` → `Starter.developerMode()` ([scripts/start.ts](scripts/start.ts)) — kills port 3000, boots `react-scripts start` (HOST=127.0.0.1, BROWSER=none, DISABLE_ESLINT_PLUGIN=true), runs `tsc -p tsconfig.electron.json` to (re)compile `main.ts` + `preload.ts` to `dist-electron/`, boots `electron .`. Filters known-noisy stderr from both children.
2. Electron `dist-electron/main.js` (compiled from [main.ts](main.ts)) picks a free port in **3001–3999** via `get-port`, opens a frameless main window (loads `http://127.0.0.1:3000`) + a redux-themed loading window, and spawns `python app.py <port>`.
3. The renderer reads the port via `window.electronAPI.getPort()` (preload bridges to the sync IPC channel `get-port-number`) and calls Flask at `http://127.0.0.1:<port>`.
4. On shutdown, Electron hits `GET /quit` so Flask `os._exit`s itself, then `app.quit()` runs. A 3-second `app.exit(0)` fallback in `shutdown()` covers cases where `app.quit` silently no-ops.

## Conventions you must respect

### TypeScript
- Three tsconfig projects, all `strict: true`:
  - [tsconfig.json](tsconfig.json) — renderer (`src/`), `noEmit`, `jsx: react-jsx`. CRA + ts-jest read this.
  - [tsconfig.electron.json](tsconfig.electron.json) — `main.ts` + `preload.ts`, CommonJS, emits to `dist-electron/`. `lib: ["ES2022", "DOM"]` (preload uses `window`/`document`).
  - [tsconfig.scripts.json](tsconfig.scripts.json) — `scripts/**/*.ts`, `noEmit` (executed via `tsx`).
- `yarn typecheck` runs all three with `tsc --noEmit`.
- Wildcard module declarations live in [src/global.d.ts](src/global.d.ts) (`*.module.scss`, `*.svg`, `*.png`, `*.jpg`). The `Window` augmentation lives in [src/types/electron-api.ts](src/types/electron-api.ts) — keeping it next to the `ElectronAPI` interface so the two cannot drift.
- No `propTypes` / `prop-types` — the dependency was dropped during the TS migration. Use `interface XProps` instead.

### Imports
- Use **relative paths** for all in-project imports (`./counterSlice`, `../utils/requests`). Bare imports like `'components/foo'` do not resolve — `baseUrl` was never set in `tsconfig.json` and the project does not use path aliases.
- Same convention applies inside any new files.

### Styling
- SCSS Modules only. File must be named `<Component>.module.scss` and imported as `styles from '...'`. Wildcard typing in `src/global.d.ts`.
- Theme tokens in [src/theme/palette.ts](src/theme/palette.ts) (Fluent UI shape, exported as `customTheme: Palette`) and [src/theme/variables.scss](src/theme/variables.scss).

### React
- Function components + hooks. No class components anywhere in the codebase.
- Named export for feature components (`export function Counter`), default export for top-level page-ish components (`export default Titlebar`, `export default App`).
- One folder per feature under `src/components/<feature>/`. Slice file (`<feature>Slice.ts`) sits next to its component.
- For components that spread HTML attributes onto a native element, type props with `React.ComponentPropsWithoutRef<'button'>` (see [TitlebarButtons.tsx](src/components/titlebar/TitlebarButtons.tsx)).

### Redux
- `@reduxjs/toolkit`. Slice = `createSlice`, store registered in [src/state/store.ts](src/state/store.ts).
- Components use **typed hooks** from [src/state/hooks.ts](src/state/hooks.ts): `useAppSelector(selectFoo)` and `useAppDispatch()`. Do NOT import `useSelector`/`useDispatch` directly from `react-redux`.
- `RootState` and `AppDispatch` are exported from `store.ts` (derived via `ReturnType<typeof store.getState>` / `typeof store.dispatch`). `AppThunk<R = void>` is the manual-thunk return type.
- Async actions written as manual thunks `(arg) => (dispatch) => { ... }` returning `AppThunk` (see `incrementAsync` in [counterSlice.ts](src/components/counter/counterSlice.ts)). `createAsyncThunk` is **not** the established pattern here.
- Selectors prefixed `select`. Take full `RootState` and drill into the slice key. Import `RootState` via `import type` to avoid runtime cycles.
- Slice state shapes are exported as named interfaces (e.g. `CounterState`) so consumers can compose state types.

### Flask
- `app.py` is single-file by design. Don't introduce blueprints or app factories.
- Port comes from `sys.argv[1]`. Don't hardcode.
- Dev-only branch: `if "app.py" in sys.argv[0]:` enables debug + CORS. PyInstaller-built binary skips this. Preserve the gate.
- All responses go through `jsonify(...)`; the renderer helpers call `.json()` on the response.

### IPC
- Renderer **cannot** call Electron directly (`contextIsolation: true`, `nodeIntegration: false`). All IPC goes through the bridge defined in [preload.ts](preload.ts) and exposed as `window.electronAPI`. To add a renderer-callable channel:
  1. Add the method signature to the `ElectronAPI` interface in [src/types/electron-api.ts](src/types/electron-api.ts).
  2. Register the listener in `createMainWindow()` in [main.ts](main.ts).
  3. Expose a wrapper inside `contextBridge.exposeInMainWorld('electronAPI', { ... } as ElectronAPI)` in [preload.ts](preload.ts) — the `as ElectronAPI` (or `: ElectronAPI` annotation on the value) enforces the bridge surface matches the interface.
  4. Call `window.electronAPI.<name>()` from the renderer; thin wrappers live in [src/utils/services.ts](src/utils/services.ts) (window control) and [src/utils/requests.ts](src/utils/requests.ts) (Flask via fetch).
- `get-port-number` is the only sync channel (uses `event.returnValue` so the renderer can read the port at module load).
- Currently registered channels: `app-maximize`, `app-minimize`, `app-quit`, `app-unmaximize`, `get-port-number`. Find them in `createMainWindow()` in [main.ts](main.ts).
- The `webPreferences.preload` path resolves to `path.join(__dirname, 'preload.js')` — works in dev (`dist-electron/main.js` next to `dist-electron/preload.js`) and inside the asar (`app.asar/dist-electron/main.js` next to `app.asar/dist-electron/preload.js`).

### Linting
- ESLint 8 extends `airbnb` + `plugin:react/recommended` for `.js`/`.jsx` ([.eslintrc.js](.eslintrc.js)). The `**/*.ts`/`**/*.tsx` override switches to `@typescript-eslint/parser` + `airbnb-typescript`. Both blocks share a TS-aware import resolver (`.ts`/`.tsx` resolved alongside `.js`/`.jsx`).
- airbnb 19 brings many error-level rules: `sort-keys`, `react/button-has-type`, `react/function-component-definition`, `no-promise-executor-return`, etc. Run `yarn lint` (or `yarn lint --fix`) to surface them.
- `airbnb-typescript@18` references several `@typescript-eslint` style rules that v8 removed (`comma-dangle`, `indent`, `quotes`, `semi`, `brace-style`, etc.) — those are turned off in the TS override block; the base ESLint equivalents are re-enabled below them. If a future bump re-introduces the rules, ESLint will fail with "Definition for rule … was not found"; drop the offending entries from the override.
- CRA 5 ships its own `eslint-config-react-app` and would conflict with `.eslintrc.js`'s `react` plugin. We disable CRA's plugin via `DISABLE_ESLINT_PLUGIN=true` in dev/build (see [scripts/start.ts](scripts/start.ts) and [scripts/build.ts](scripts/build.ts)). Standalone `yarn lint` still runs the airbnb config.
- `serviceWorker.ts` (CRA boilerplate) gets a file-specific override allowing `console`. The override is placed AFTER the TS override so it wins.
- `lint` scope: `eslint src scripts main.ts preload.ts --ext .js,.jsx,.ts,.tsx`. Generated output (`dist-electron/`, `build/`, `dist/`, `resources/`, `docs/`, `utilities/jsdoc/`) is excluded via `ignorePatterns`.

## Verification (run after every change)

After any change to source files (`src/`, `app.py`, `main.ts`, `preload.ts`, `scripts/`, `package.json`, `tsconfig*.json`, `requirements*.txt`), the contract is:

```bash
yarn verify         # lint → typecheck (3 projects) → jest → pytest → React build
```

This is the single command the [change-verifier](.claude/agents/change-verifier.md) agent runs. The agent fires automatically via the `PostToolUse` hook in [.claude/settings.json](.claude/settings.json) on every Edit/Write/MultiEdit to in-scope files. The hook script ([.claude/hooks/verify-on-change.py](.claude/hooks/verify-on-change.py)) excludes Markdown, `.claude/`, `node_modules/`, `dist-electron/`, build/dist/resources output, and unrelated assets — see `.claude/hooks/test_verify_on_change.py` for the scope rules.

If `yarn verify` fails:
- Lint failures: usually mechanical (key order, button type, missing import). Fix and rerun. `yarn lint --fix` handles many automatically.
- Typecheck failures: surfaces as `error TSnnnn` with a file:line. The three tsconfig projects run sequentially; the failing one is always named in the output.
- Jest failures: read the assertion message. Snapshot updates need explicit user approval.
- Pytest failures: see [tests/test_app.py](tests/test_app.py). Covers `/example` happy path, 404, CORS allowlist + denial, and `/quit` shutdown scheduling.
- React build failures: read the webpack error.

Never silence a failure (`// eslint-disable`, `xtest`, swallowed exceptions). Fix or escalate.

The CI workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) runs the same chain on push and PR (Node 20, Python 3.11). Local agent + remote CI = two independent checks.

## Build & package

```bash
yarn start                       # dev: React + Electron + Flask together (compiles main.ts/preload.ts first)
yarn build                       # Electron tsc + PyInstaller bundle + React production build
yarn build:electron              # tsc -p tsconfig.electron.json → dist-electron/
yarn build:react                 # CRA production build → build/
yarn build:python                # PyInstaller bundle → resources/app/
yarn build:package:windows       # MSI via electron-wix-msi  (requires WiX on PATH)
yarn build:package:mac           # DMG via electron-installer-dmg
yarn build:package:linux         # DEB via electron-installer-debian (needs fakeroot, dpkg)
yarn clean                       # remove build/test artifacts (build/, dist/, dist-electron/, coverage/, __pycache__, .pyi-build/, etc.)
yarn clean:all                   # also remove node_modules + lockfiles (forces full reinstall)
yarn build:docs                  # JSDoc → ./docs (custom template in utilities/jsdoc)
yarn lint                        # ESLint (airbnb + airbnb-typescript) over src/ + scripts/ + main.ts + preload.ts
yarn typecheck                   # tsc --noEmit for all three tsconfig projects
yarn test                        # CRA jest runner
yarn test:python                 # pytest against tests/
yarn verify                      # full chain: lint + typecheck + jest + pytest + react build
```

Prerequisites:
- `pip install -r requirements.txt` (Flask, flask-cors, pyinstaller, pytest).
- WiX Toolset on PATH for Windows MSI.
- Installer metadata (name, version, description, manufacturer) is read from `package.json`. Edit those fields once and the MSI/DMG/DEB pick them up.

Output paths:
- `./dist-electron/` — compiled Electron main + preload (TS → JS)
- `./build/` — React production bundle
- `./resources/` — PyInstaller dist
- `./dist/<platform>/` — packaged app
- `./dist/<platform>/setup/` — installer

## Known sharp edges

- **`/quit` uses `werkzeug.server.shutdown`** ([app.py](app.py)) which is removed in Werkzeug 2.1+. If a user upgrades Werkzeug and hits `RuntimeError: Not running with the Werkzeug Server`, that's why.
- **`packageMacOS` passes `--win32` to electron-packager** in [scripts/package.ts](scripts/package.ts). Looks like a copy-paste from the Windows branch. Flag this if mac packaging produces a Windows artifact rather than silently fixing.
- **`airbnb-typescript@18` ↔ `@typescript-eslint@8` rule drift** — v8 removed the extension style rules airbnb-typescript still references. Disabled in the TS override block of [.eslintrc.js](.eslintrc.js); base ESLint equivalents re-enabled. Don't re-bump airbnb-typescript without checking compatibility.
- **`get-port@5` namespace export** — `main.ts` and `scripts/start.ts` consume it via `import getPort = require('get-port')` because v5 publishes the `makeRange` helper as a CommonJS namespace. v6+ went ESM-only and would break this pattern. Pin v5.
- **Asar bloat** — current `--ignore` regex in [scripts/package.ts](scripts/package.ts) excludes `src/`, `resources/`, `dist/`, etc., but NOT raw `main.ts`/`preload.ts` at root, `tsconfig*.json`, or `dist-electron/src/types/electron-api.js` (an empty type-only emit). Harmless but the asar carries a few KB it doesn't need.
- **Old dependency pinning intent:** the user pins exact versions (no carets/tildes). Don't blanket-upgrade; user prefers stability over freshness. See `feedback_pin_versions_exactly.md` memory.
- **`yarn clean` removes `yarn.lock` and `node_modules`** when run as `yarn clean:all`. Plain `yarn clean` does not — only artifacts. Both are deliberate per `cleanProject()` in [scripts/dispatch.ts](scripts/dispatch.ts), but warn the user before `clean:all` — versions can drift on reinstall.

## Available agents (`.claude/agents/`)

| Agent | When to invoke |
|---|---|
| `electron-ipc-engineer` | adding/removing IPC channels, modifying `BrowserWindow` config, titlebar/window controls, updating the `ElectronAPI` contract |
| `flask-route-builder` | adding or debugging Flask endpoints in `app.py` |
| `redux-slice-author` | scaffolding new slices + store registration following `counterSlice` pattern, with typed hooks |
| `packager-troubleshooter` | packaging failures (`build:package:*`), PyInstaller / electron-packager / WiX / DMG / DEB / electron tsc errors |
| `change-verifier` | invoke after every change in `src/`, `app.py`, `main.ts`, `preload.ts`, `scripts/`, `tsconfig*.json`, etc. — runs lint → typecheck → jest → pytest → React build and reports/fixes |

## Available skills (`.claude/skills/`)

| Skill | When to invoke |
|---|---|
| `dev-start` | dev-mode boot, "loader hangs", port-in-use, Flask not responding, Electron exits at boot from tsc failure |
| `add-flask-route` | full round-trip: Python endpoint + typed React caller + rebuild reminder |
| `add-react-component` | scaffolding a new `.tsx` component following folder/import/SCSS/typed-props conventions |
| `clean-rebuild` | what `yarn clean` removes (now includes `dist-electron/`), fresh-rebuild sequence, stale-artifact diagnosis |
| `audit-claude-md` | verify CLAUDE.md claims still match code; run after refactors / dep bumps |

## Out of scope (don't add unprompted)

- A router (single-window app today).
- Database, auth, or session middleware on the Flask side.
- Code-signing config for macOS — currently produces unsigned builds.
- CSS-in-JS libraries — committed to SCSS Modules.
