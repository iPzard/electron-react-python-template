# Electron, React & Python Template

[![CI](https://img.shields.io/github/actions/workflow/status/iPzard/electron-react-python-template/ci.yml?branch=master&color=704cb6&style=for-the-badge)](https://github.com/iPzard/electron-react-python-template/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/iPzard/electron-react-python-template?color=704cb6&style=for-the-badge)](https://github.com/iPzard/electron-react-python-template/blob/master/LICENSE)

> Multi-platform Electron template, using React & Redux Toolkit with Python/Flask microservices.

![electron_react_python](https://user-images.githubusercontent.com/8584126/95290114-59e42900-0821-11eb-8e43-a708959e8449.gif)

## 🛠️ Setup

> These setup steps are for **developers** building on top of the template. End users who install your packaged app (MSI / DMG / DEB) need none of this — the installer ships everything.

### Prerequisites

| Tool | Recommended | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/en/download/) | 20.19+ LTS (or 22.12+) | Required by Vite 7. ESLint 9 also enforces a modern Node. No `--openssl-legacy-provider` workaround needed. |
| [Yarn 1](https://classic.yarnpkg.com/) | 1.22.x | `npm install` works too, but lockfile + scripts are tested against Yarn 1. |
| [Python](https://www.python.org/downloads/) | 3.10 – 3.12 | Used for the Flask service in dev and bundled by PyInstaller for production. |
| [pip](https://pip.pypa.io/) | bundled with Python | Use `pip`, `pip3`, or `py -m pip` — whichever your install exposes. |

**Platform-specific (only when packaging installers):**

- **Windows MSI:** [WiX Toolset 3.x](https://github.com/wixtoolset/wix3/releases) on `PATH` (e.g., `C:\Program Files (x86)\WiX Toolset v3.14.1\bin`).
- **Linux DEB:** `fakeroot` and `dpkg` on `PATH` (`sudo apt install fakeroot dpkg`).
- **macOS DMG:** no extra tools needed for an unsigned build. Code signing requires an Apple Developer ID.

### Install dependencies

Clone the repo and from the project root:

**Python deps** (Flask, flask-cors, PyInstaller, pytest):
```bash
pip install -r requirements.txt
```

**Node deps:**
```bash
yarn install
```

<br>

## ⚙️ Config

**Electron:** Electron's `main.ts` and `preload.ts` files can be found in the project's root directory. They compile to `dist-electron/` via `tsc -p tsconfig.electron.json` (run automatically by `yarn start` and `yarn build`).

**React:** React files can be found in the `./src/` folder, the custom titlebar is in `./src/components/titlebar`.

**Python:** Python scripts can be created in the `./app.py` file and used on events via [REST](https://developer.mozilla.org/en-US/docs/Glossary/REST) calls.

<br>

## 📜 Scripts

Below are the scripts you'll need to run and package your application, as well as build out TypeDoc documentation, if you choose to do so. An exhaustive list of scripts that are available can be found in the `package.json` file of the project's root directory, in the `scripts` section.

| ⚠️ &nbsp;PyInstaller is included in `requirements.txt`, so a separate install is no longer required. Installer metadata (name, version, manufacturer, description) is pulled from the matching fields in `package.json` automatically. |
| --- |

**Start Developer Mode:**
```bash
yarn run start
```

**Package Windows: <sup>*1*</sup>**
```bash
yarn run build:package:windows
```

**Package macOS:**
```bash
yarn run build:package:mac
```

**Package Linux:**
```bash
yarn run build:package:linux
```

**Build Documentation:**
```bash
yarn run build:docs
```

*<sup>1</sup>Windows uses [electron-wix-msi](https://github.com/felixrieseberg/electron-wix-msi), you must install and add its path to your environment variables.*
<br><br>

## ✅ Verify

Run before pushing — same chain CI runs.

**Full chain (lint → typecheck → vitest → pytest → Vite build):**
```bash
yarn verify
```

**Individual steps:**
```bash
yarn lint        # ESLint 9 flat config (eslint.config.ts)
yarn typecheck   # tsc --noEmit across renderer / electron / scripts tsconfigs
yarn test        # Vitest (non-watch via `vitest run`)
yarn test:python # pytest against tests/test_app.py
```
<br>

## 🐱‍👓 Docs
Code documentation for this template, created with [TypeDoc](https://typedoc.org/), can be found here:<br>
[Electron, React, & Python Template](https://ipzard.github.io/electron-react-python-template/)
<br><br>

## 🦟 Bugs
Bugs reported on the project's [issues page](https://github.com/iPzard/electron-react-python-template/issues) will be exterminated as quickly as possible, be sure to include steps to reproduce so they can be spotted easily.
<br><br>

## 🏷️ License
MIT © [iPzard](https://github.com/iPzard/electron-react-python-template/blob/master/LICENSE)
