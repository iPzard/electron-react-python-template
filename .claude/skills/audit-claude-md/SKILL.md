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
Format used in CLAUDE.md: `[main.ts:18](main.ts:18)`, `[scripts/package.ts:78](scripts/package.ts:78)`, etc.
- Verify file exists.
- Read the cited line. Does code there still match the described behavior?

### IPC channel inventory
CLAUDE.md lists: `app-maximize`, `app-minimize`, `app-quit`, `app-unmaximize`, `get-port-number`.
- `grep -n "ipcMain.on\|ipcMain.handle" main.ts` — compare set.
- `grep -rn "ipcRenderer.send\|ipcRenderer.sendSync\|ipcRenderer.invoke" preload.ts src/` — confirm renderer side and preload bridge surface.
- Cross-check the `ElectronAPI` interface in [src/types/electron-api.ts](../../../src/types/electron-api.ts) — every channel must be reflected there.
- Report adds, removals, async↔sync changes.

### Build / package commands
CLAUDE.md lists `yarn start`, `yarn build`, `yarn build:electron`, `yarn build:package:windows|mac|linux`, `yarn clean`, `yarn build:docs`, `yarn test`, `yarn typecheck`, `yarn verify`.
- Cross-check against `scripts` block in [package.json](../../../package.json).
- Cross-check against switch cases in [scripts/dispatch.ts](../../../scripts/dispatch.ts).

### Output paths
Documented: `./build/`, `./dist-electron/`, `./resources/`, `./dist/<platform>/`, `./dist/<platform>/setup/`.
- Confirm against [scripts/build.ts](../../../scripts/build.ts) and [scripts/package.ts](../../../scripts/package.ts).
- `dist-electron/` is the TS-compiled Electron output (added during the TS migration). Not present pre-migration.

### TypeScript projects
- CLAUDE.md should mention three tsconfig projects: renderer ([tsconfig.json](../../../tsconfig.json)), electron ([tsconfig.electron.json](../../../tsconfig.electron.json)), scripts ([tsconfig.scripts.json](../../../tsconfig.scripts.json)).
- `yarn typecheck` runs `tsc --noEmit` against all three.
- `ElectronAPI` interface in `src/types/electron-api.ts` is the single source of truth for the preload bridge surface. Window augmentation via `declare global` lives in the same file.

### Conventions
- Import style (relative paths): check no bare `from 'components/...'` / `from 'utils/...'` imports remain. `grep -rn "from 'components/" src/` should be empty.
- SCSS Modules: `grep -rn "import .* from .*\.module\.scss" src/` should show convention is alive; flag any styled-components / emotion imports.
- Function components only: `grep -rn "extends React.Component\|extends Component" src/` should be empty.
- Manual thunk pattern: `grep -rn "createAsyncThunk" src/` should be empty (or note adoption).
- propTypes removed: `grep -rn "propTypes\|prop-types\|PropTypes" src/` should be empty after the TS migration. If anything matches, that's drift.
- Typed Redux hooks: `grep -rn "useDispatch\|useSelector" src/` should be empty (use `useAppDispatch`/`useAppSelector` from `src/state/hooks.ts` instead). Bare `react-redux` hook imports indicate drift.

### Lint rules
CLAUDE.md claims `'sort-keys': ['error', 'asc']` is the only error-level rule (in the base config; the TS override adds `@typescript-eslint/no-use-before-define`).
- Read [.eslintrc.cjs](../../../.eslintrc.cjs), filter rules whose value is `'error'` or `['error', ...]`. Check both the root `rules` block and the TS overrides block.

### Dependency versions
CLAUDE.md cites: React 18, react-scripts 5, Electron 30, react-redux 9, typescript 5.6, tsx 4.19.
- Read [package.json](../../../package.json) `dependencies` + `devDependencies`. Compare major versions.
- Report any major bumps; minor bumps usually fine. The user pins exact versions — flag any silent caret/tilde additions.

### Sharp edges
CLAUDE.md flags these:
1. `werkzeug.server.shutdown` in `/quit` — verify [app.py](../../../app.py).
2. `--win32` in `packageMacOS` — verify line in [scripts/package.ts](../../../scripts/package.ts).
3. Asar bloat from raw `.ts` and tsconfigs at root — verify [scripts/package.ts](../../../scripts/package.ts) `--ignore` regex.
4. `airbnb-typescript@18` ↔ `@typescript-eslint@8` rule drift — verify the TS override in [.eslintrc.cjs](../../../.eslintrc.cjs) still has the offending style rules turned off.
5. Old dep pinning — covered above.

If any are fixed, remove from CLAUDE.md. If new sharp edges appeared, add them.

### Agent and skill index
CLAUDE.md tables list 5 agents and 5 skills.
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
