---
name: audit-claude-md
description: Use this skill when the user wants to verify CLAUDE.md is still accurate, or after significant code changes that may have invalidated documented claims. Triggers include "audit CLAUDE.md", "is CLAUDE.md still correct", "check docs drift", "verify claude.md", or after dep bumps / refactors. Diffs every concrete claim in CLAUDE.md against current code reality and reports stale/missing entries.
---

# Audit CLAUDE.md against current codebase

Goal: catch documentation drift. CLAUDE.md makes specific claims (file paths, line numbers, channel names, dep versions, build scripts, sharp edges). Each one is a verifiable assertion. Walk through them, verify, report.

## Run order

1. Read [CLAUDE.md](../../../CLAUDE.md) top to bottom. Extract every concrete claim.
2. For each claim, verify against current code. Categories below.
3. Produce a report: confirmed / stale / missing.
4. If user approves, update CLAUDE.md inline. Don't rewrite the file structure unless drift is widespread.

## Claim categories and how to verify

### Path / line-number references
Format used in CLAUDE.md: `[main.js:18](main.js:18)`, `[scripts/package.js:78](scripts/package.js:78)`, etc.
- Verify file exists.
- Read the cited line. Does code there still match the described behavior?

### IPC channel inventory
CLAUDE.md lists: `app-maximize`, `app-minimize`, `app-quit`, `app-unmaximize`, `get-port-number`.
- `grep -n "ipcMain.on\|ipcMain.handle" main.js` — compare set.
- `grep -n "ipcRenderer.send\|ipcRenderer.sendSync\|ipcRenderer.invoke" src/` — confirm renderer side.
- Report adds, removals, async↔sync changes.

### Build / package commands
CLAUDE.md lists `yarn start`, `yarn build`, `yarn build:package:windows|mac|linux`, `yarn clean`, `yarn build:docs`, `yarn test`.
- Cross-check against `scripts` block in [package.json](../../../package.json).
- Cross-check against switch cases in [scripts/dispatch.js](../../../scripts/dispatch.js).

### Output paths
Documented: `./build/`, `./resources/`, `./dist/<platform>/`, `./dist/<platform>/setup/`.
- Confirm against [scripts/build.js](../../../scripts/build.js) and [scripts/package.js](../../../scripts/package.js).

### Conventions
- Import style (relative paths): check no bare `from 'components/...'` / `from 'utils/...'` imports remain (CLAUDE.md says relative paths only). `grep -rn "from 'components/" src/` should be empty.
- SCSS Modules: `grep -rn "import .* from .*\.module\.scss" src/` should show convention is alive; flag any styled-components / emotion imports.
- Function components only: `grep -n "extends React.Component\|extends Component" src/` should be empty.
- Manual thunk pattern: `grep -n "createAsyncThunk" src/` should be empty (or note adoption).

### Lint rules
CLAUDE.md claims `'sort-keys': ['error', 'asc']` is the only error-level rule.
- Read [.eslintrc.js](../../../.eslintrc.js), filter rules whose value is `'error'` or `['error', ...]`.

### Dependency versions
CLAUDE.md cites: React 16, react-scripts 3.4, Electron 13, axios 0.21, react-redux 7.
- Read [package.json](../../../package.json) `dependencies` + `devDependencies`. Compare major versions.
- Report any major bumps; minor bumps usually fine.

### Sharp edges
CLAUDE.md flags four:
1. Permissive `webPreferences` — verify in `main.js` `BrowserWindow` config.
2. `werkzeug.server.shutdown` in `/quit` — verify [app.py](../../../app.py).
3. `--win32` in `packageMacOS` — verify line in [scripts/package.js](../../../scripts/package.js).
4. Old dep pinning — covered above.

If any are fixed, remove from CLAUDE.md. If new sharp edges appeared, add them.

### Agent and skill index
CLAUDE.md tables list 4 agents and 4+ skills.
- `ls .claude/agents/` and `ls .claude/skills/`. Compare. Report adds/removes/renames.

## Report format

Output a single block with three sections:

```
CONFIRMED (still accurate):
- <bullet per verified claim, terse>

STALE (claim no longer matches code):
- <claim> — <what changed> — <CLAUDE.md location>

MISSING (code reality not yet documented):
- <new convention/file/channel/script> — <suggested CLAUDE.md section>
```

Then ask: "Apply fixes inline?" Wait for approval before editing CLAUDE.md.

## Update rules

- Edit CLAUDE.md surgically. Use `Edit` tool, not `Write`. Preserve structure and tone.
- For renamed files / moved line numbers, update the markdown link target.
- For removed sharp edges, delete the bullet entirely — don't strike-through or annotate.
- For added agents/skills, append to the matching table row in the same format.
- Don't expand scope — if a section grew large enough to warrant its own doc, suggest it but don't move content unprompted.
