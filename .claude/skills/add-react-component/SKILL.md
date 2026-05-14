---
name: add-react-component
description: Use this skill when the user wants to scaffold a new React component in this project. Triggers include "add a component", "create a new React component", "scaffold a feature page". Follows the project's folder-per-feature, CSS-Modules-with-SCSS, relative-path import conventions used by `Counter` and `Titlebar`. Components are TypeScript (`.tsx`); the project completed its TS migration.
---

# Add a React component

**Scope rule (load-bearing):** see [CLAUDE.md](../../../CLAUDE.md) "Scope discipline". Create only what the user asked for — one component, its `.module.scss`, and the import where it's used. Do NOT add a router, a state-management library, or a CSS-in-JS lib while in the area.

## Folder layout

Components live under `src/components/<feature>/`. One folder per feature, even for a single file. Two existing examples:

- `src/components/counter/` — `Counter.tsx`, `Counter.module.scss`, `counterSlice.ts`
- `src/components/titlebar/` — `Titlebar.tsx`, `TitlebarButtons.tsx`, `img/`, `scss/`

Pick the simpler layout (counter-style) unless the component needs subassets (then mirror titlebar).

## Files to create

For a feature called `widget`:

```
src/components/widget/
  Widget.tsx
  Widget.module.scss
```

`Widget.tsx` template (functional, hooks, named export to match `Counter`, no propTypes — types replace them):

```tsx
import React from 'react';

import styles from './Widget.module.scss';

interface WidgetProps {
  // ... typed props go here; omit if the component takes none
}

export function Widget(_props: WidgetProps) {
  return (
    <div className={ styles.widget }>
      {/* ... */}
    </div>
  );
}
```

If the component is the page-level export (like `App` or `Titlebar`), use `export default`. If it's a feature inside a parent (like `Counter`), use a named export. Match the surrounding convention.

If the component spreads HTML attributes onto a native element, use `React.ComponentPropsWithoutRef<'button'>` (or whatever element) like `TitlebarButtons.tsx` does — gives full HTML attribute typing for free.

## Import rules

- Use **relative paths** for in-project imports (`./counterSlice`, `../utils/requests`). Bare imports like `'components/foo'` do not resolve.
- CSS Modules: import as `import styles from './Widget.module.scss'`. The wildcard `declare module '*.module.scss'` in `src/global.d.ts` types these to `{ readonly [key: string]: string }`. Reference with `styles.widget` for camelCase, `styles['some-thing']` for kebab-case.
- SCSS variables and theme: `src/theme/variables.scss` and `src/theme/palette.ts` are available; `palette.ts` exports a typed `customTheme: Palette` shaped for Microsoft Fluent UI's theme designer.

## Wiring it in

Most new components get rendered inside `src/components/App.tsx`. Add the import and the JSX in the `<header>` block. If the component needs Redux state, use a slice (see `redux-slice-author` agent or scaffold one alongside the component, mirroring `counterSlice.ts`) and the typed hooks `useAppSelector` / `useAppDispatch` from `src/state/hooks.ts`.

## Tests

`src/tests/App.test.tsx` is the existing example; tests use `@testing-library/react`. Tests run via `yarn test` (which is `vitest run`). New tests can live in `src/tests/` or alongside the component (use `Widget.test.tsx`); Vitest picks up `**/*.test.{ts,tsx}` by default. Vitest globals (`describe`/`test`/`expect`/`vi`) are enabled via `vite.config.ts` `test.globals: true`.

## What NOT to do

- Don't add class components — every existing component is a function component with hooks.
- Don't introduce styled-components, emotion, or a CSS-in-JS lib. The codebase is committed to SCSS Modules.
- Don't reintroduce `prop-types` / `propTypes` — the dependency was dropped during the TS migration. Use `interface XProps` instead.
- Don't introduce a router. There is none yet; the app is a single window.
