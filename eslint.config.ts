// Flat config (ESLint 9+) authored in TypeScript. ESLint 9.18+ loads
// eslint.config.ts via `jiti` (declared in devDependencies).
//
// Replaces the airbnb + airbnb-typescript chain previously in
// .eslintrc.cjs. Hand-rolled rule set preserves the project's
// intentional strictness (sort-keys: error, button-has-type,
// function-component-definition) without inheriting the
// airbnb-typescript@18 ↔ @typescript-eslint@8 rule-drift workarounds.
//
// Rule keys are alphabetized within the rules object — sort-keys is set
// to error project-wide, so this config must satisfy its own rule.

import js from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // -------------------------------------------------------------------
  // Ignored paths — replaces .eslintignore + the old `ignorePatterns`.
  // -------------------------------------------------------------------
  {
    ignores: [
      '.pyi-build/',
      'build/',
      'coverage/',
      'dist-electron/',
      'dist/',
      'docs/',
      'node_modules/',
      'resources/'
    ]
  },

  // -------------------------------------------------------------------
  // Base JS recommendations — applies to every linted file.
  // -------------------------------------------------------------------
  js.configs.recommended,

  // -------------------------------------------------------------------
  // typescript-eslint recommendations (type-aware).
  // -------------------------------------------------------------------
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  // -------------------------------------------------------------------
  // Project-wide configuration applied to source files.
  // -------------------------------------------------------------------
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Three tsconfigs cover the three contexts: renderer (src/),
        // electron (main.ts + preload.ts), and scripts (scripts/**/*.ts).
        // typescript-eslint walks them in order until one includes the
        // linted file. eslint.config.ts itself is excluded from
        // type-aware linting via the override block below.
        project: [
          './tsconfig.json',
          './tsconfig.electron.json',
          './tsconfig.scripts.json'
        ],
        tsconfigRootDir: import.meta.dirname
      },
      sourceType: 'module'
    },
    plugins: {
      'import-x': importX,
      'jsx-a11y': jsxA11y,
      react,
      'react-hooks': reactHooks
    },
    rules: {
      // Spread presets first — keys before/after a spread are sorted
      // independently, so this group lives outside the literal-key block.
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs['recommended-latest'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // Literal keys, alphabetized (sort-keys: error enforces this).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
      'comma-dangle': ['warn', 'never'],
      'import-x/extensions': ['warn', 'ignorePackages', {
        js: 'never', jsx: 'never', ts: 'never', tsx: 'never'
      }],
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/prefer-default-export': 'off',
      indent: ['warn', 2, { SwitchCase: 1 }],
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-promise-executor-return': 'error',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'object-curly-spacing': ['warn', 'always'],
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      quotes: ['warn', 'single', { avoidEscape: true }],
      'react/button-has-type': 'error',
      'react/destructuring-assignment': 'off',
      'react/function-component-definition': ['error', {
        namedComponents: 'function-declaration',
        unnamedComponents: 'arrow-function'
      }],
      'react/jsx-curly-spacing': ['warn', 'always'],
      'react/jsx-filename-extension': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      semi: ['warn', 'always'],
      'sort-keys': ['error', 'asc', { caseSensitive: false }]
    },
    settings: {
      'import-x/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
      },
      react: { version: 'detect' }
    }
  },

  // -------------------------------------------------------------------
  // Per-area overrides.
  // -------------------------------------------------------------------
  {
    // Build/dev scripts intentionally console.log progress and errors —
    // they are CLI entry points, not production code.
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' }
  },
  {
    // Test files: relax type-aware rules that fight common test patterns,
    // and inject Vitest globals (describe/test/expect/vi/beforeEach/...)
    // because vite.config.ts sets `test.globals: true`.
    files: ['**/*.test.{ts,tsx}', 'src/setupTests.ts'],
    languageOptions: {
      globals: { ...globals.vitest }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  },
  {
    // eslint.config.ts and vite.config.ts aren't in any tsconfig — disable
    // type-aware rules so the parser doesn't complain about missing project
    // info. Both files are executed via their own runners (jiti for ESLint,
    // Vite itself for vite.config.ts) rather than `tsc`.
    extends: [tseslint.configs.disableTypeChecked],
    files: ['eslint.config.ts', 'vite.config.ts']
  }
);
