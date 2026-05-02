---
name: clean-rebuild
description: Use this skill when the user wants to wipe build artifacts and rebuild from scratch, or when stale `build/`, `dist/`, `resources/`, `node_modules/`, or PyInstaller `__pycache__` is causing weird failures. Triggers include "clean the project", "fresh build", "yarn clean", "stale artifacts", "PyInstaller cache problem". Explains exactly what `yarn clean` and `yarn clean:all` remove and what they do NOT.
---

# Clean and rebuild

**Scope rule (load-bearing):** see [CLAUDE.md](../../../CLAUDE.md) "Scope discipline".

## Two clean commands

| Command | Removes | Use when |
|---|---|---|
| `yarn clean` | Build/test artifacts only | Routine — quick recovery from stale builds |
| `yarn clean:all` | Artifacts **plus** `node_modules`, `yarn.lock`, `package-lock.json`, `.pnp` | Hard reset — forces reinstall, may drift dep versions if lockfile loss matters |

## What `yarn clean` removes

Implemented in `scripts/dispatch.js` `cleanProject()` and `scripts/clean.js` `Cleaner.removePath`.

**Python cache:** `app.pyc`, `__pycache__`
**Debug logs:** `npm-debug.log`, `yarn-debug.log`, `yarn-error.log`
**Test output:** `coverage/`
**Production output:** `build/`, `dist/`
**Misc:** `.DS_Store`
**Resources:** `resources/app/` always; `resources/` itself only if it ends up empty.

## What `yarn clean:all` ALSO removes

**Dependencies:** `.pnp`, `.pnp.js`, `node_modules/`, `package-lock.json`, `yarn.lock`

After `clean:all` you must `yarn install` again. Losing `yarn.lock` can drift dependency versions on reinstall — only run it if you intend that.

## What NEITHER command removes

- `app.spec` — committed PyInstaller spec, treated as source.
- `docs/` — published JSDoc reference, tracked in git.
- `.git/`, `.github/`, `.eslintrc.js`, `.babelrc`, anything under `src/`, `scripts/`, `utilities/`, `public/` — source.
- Python virtualenvs (`venv/`, `.venv/`) — the script does not know about them.

## Typical fresh-rebuild sequence

```bash
yarn clean              # quick reset
yarn build              # rebuild React + PyInstaller dist
# or
yarn clean:all          # hard reset (rare)
yarn install
pip install -r requirements.txt
yarn start
```

## When to suspect a stale-artifact bug

- React change doesn't show up in packaged installer → `build/` stale; rerun `yarn build:react`.
- `app.py` change doesn't show up in packaged installer → `resources/` stale; rerun `yarn build:python`.
- PyInstaller weirdness → `yarn clean` then `yarn build:python` (cleans `__pycache__`, keeps `app.spec`).
- Native module errors after Electron version bump → `yarn clean:all`, then reinstall.

## What clean does not fix

- Source bugs.
- Permission errors writing into `dist/` (Windows installer can hold locks; close any running app instance).
- Missing prerequisites (PyInstaller, WiX, `fakeroot`) — clean does nothing for these.
