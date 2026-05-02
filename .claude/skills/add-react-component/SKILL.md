---
name: add-react-component
description: Use this skill when the user wants to scaffold a new React component in this project. Triggers include "add a component", "create a new React component", "scaffold a feature page". Follows the project's folder-per-feature, CSS-Modules-with-SCSS, relative-path import conventions used by `Counter` and `Titlebar`.
---

# Add a React component

**Scope rule (load-bearing):** see [CLAUDE.md](../../../CLAUDE.md) "Scope discipline". Create only what the user asked for — one component, its `.module.scss`, and the import where it's used. Do NOT add a router, a state-management library, a CSS-in-JS lib, a TypeScript migration, or a test fixture folder while in the area.

## Folder layout

Components live under `src/components/<feature>/`. One folder per feature, even for a single file. Two existing examples:

- `src/components/counter/` — `Counter.js`, `Counter.module.scss`, `counterSlice.js`
- `src/components/titlebar/` — `Titlebar.js`, `TitlebarButtons.js`, `img/`, `scss/`

Pick the simpler layout (counter-style) unless the component needs subassets (then mirror titlebar).

## Files to create

For a feature called `widget`:

```
src/components/widget/
  Widget.js
  Widget.module.scss
```

`Widget.js` template (functional, hooks, named export to match `Counter`):

```jsx
import React from 'react';

import styles from './Widget.module.scss';

export function Widget() {
  return (
    <div className={ styles.widget }>
      {/* ... */}
    </div>
  );
}
```

If the component is the page-level export (like `App` or `Titlebar`), use `export default`. If it's a feature inside a parent (like `Counter`), use a named export. Match the surrounding convention.

## Import rules

- Use **relative paths** for in-project imports (`./counterSlice`, `../utils/requests`). Bare imports like `'components/foo'` no longer resolve — `baseUrl` was removed from `jsconfig.json`.
- CSS Modules: import as `import styles from './Widget.module.scss'`. Reference with `styles.widget` for camelCase, `styles['some-thing']` for kebab-case.
- SCSS variables and theme: `src/theme/variables.scss` and `src/theme/palette.js` are available; `palette.js` is shaped for Microsoft Fluent UI's theme designer.

## Wiring it in

Most new components get rendered inside `src/components/App.js`. Add the import and the JSX in the `<header>` block. If the component needs Redux state, use a slice (see `redux-slice-author` agent or scaffold one alongside the component, mirroring `counterSlice.js`).

## Tests

`src/tests/App.test.js` is the single existing test, using `@testing-library/react`. Tests run via `yarn test` (which is `react-scripts test`). New tests can live in `src/tests/` or alongside the component — both work with the CRA test runner.

## What NOT to do

- Don't add class components — every existing component is a function component with hooks.
- Don't introduce styled-components, emotion, or a CSS-in-JS lib. The codebase is committed to SCSS Modules.
- Don't introduce TypeScript files. `prop-types` is the validation tool here (`react/prop-types` warn rule).
- Don't introduce a router. There is none yet; the app is a single window.
