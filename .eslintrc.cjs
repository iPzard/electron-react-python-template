module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    mocha: true,
    node: true
  },
  extends: ['plugin:react/recommended', 'airbnb'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    // No babel.config.js / .babelrc in repo (CRA 5 owns its own babel config),
    // so tell the parser not to look one up. Also pass the JSX preset
    // explicitly so .jsx-style files lint without "Parsing error: This
    // experimental syntax requires enabling 'jsx'" errors.
    babelOptions: {
      babelrc: false,
      configFile: false,
      presets: ['@babel/preset-react']
    },
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    requireConfigFile: false,
    sourceType: 'module'
  },
  plugins: ['react'],
  rules: {
    'array-bracket-spacing': [0],
    'arrow-body-style': [0],
    'arrow-parens': ['warn'],
    'brace-style': [0],
    'comma-dangle': ['warn', 'never'],
    'consistent-return': [0],
    'eol-last': [0],
    'func-names': ['warn', 'always', {
      generators: 'as-needed'
    }],
    'global-require': [0],
    'implicit-arrow-linebreak': [0],
    'import/extensions': ['warn', 'ignorePackages', {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never'
    }],
    'import/no-dynamic-require': ['warn'],
    'import/no-extraneous-dependencies': [0],
    'import/order': ['warn'],
    'import/prefer-default-export': [0],
    'indent': ['warn', 2, {
      SwitchCase: 1
    }],
    'jsx-a11y/anchor-is-valid': ['warn'],
    'jsx-a11y/click-events-have-key-events': [0],
    'jsx-a11y/interactive-supports-focus': [0],
    'jsx-a11y/label-has-associated-control': [0],
    'jsx-a11y/no-noninteractive-element-interactions': [0],
    'keyword-spacing': ['warn'],
    'linebreak-style': [0],
    'max-len': ['warn'],
    'no-console': ['warn', {
      allow: ['warn', 'error']
    }],
    'no-mixed-spaces-and-tabs': ['warn'],
    'no-multi-spaces': ['warn'],
    'no-multiple-empty-lines': [0],
    'no-nested-ternary': [0],
    'no-param-reassign': [0],
    'no-restricted-syntax': [0],
    'no-tabs': ['warn'],
    'no-trailing-spaces': ['warn'],
    'no-underscore-dangle': ['warn'],
    'no-unneeded-ternary': ['warn'],
    'no-unused-expressions': [0],
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-use-before-define': ['error', {
      'functions': false
    }],
    'object-curly-newline': [0],
    'object-curly-spacing': ['warn'],
    'object-shorthand': ['warn', 'always'],
    'one-var': ['warn', {
      'initialized': 'never'
    }],
    'one-var-declaration-per-line': ['warn', 'initializations'],
    'operator-linebreak': ['warn'],
    'padded-blocks': [0],
    'prefer-arrow-callback': ['warn'],
    'prefer-const': ['warn'],
    'prefer-destructuring': [
      'warn',
      {
        array: true,
        object: true
      },
      {
        enforceForRenamedProperties: false
      }
    ],
    'prefer-template': ['warn'],
    'quote-props': ['warn', 'consistent'],
    'quotes': ['warn'],
    'react/destructuring-assignment': [0],
    'react/forbid-prop-types': [0],
    'react/jsx-closing-bracket-location': ['warn'],
    'react/jsx-curly-newline': ['warn'],
    'react/jsx-curly-spacing': ['warn', 'always'],
    'react/jsx-equals-spacing': ['warn'],
    'react/jsx-filename-extension': [0],
    'react/jsx-fragments': [0],
    'react/jsx-indent': ['warn', 2],
    'react/jsx-one-expression-per-line': ['warn'],
    'react/jsx-props-no-spreading': [0],
    'react/jsx-tag-spacing': ['warn'],
    'react/jsx-wrap-multilines': ['warn'],
    'react/no-access-state-in-setstate': [0],
    'react/no-array-index-key': [0],
    'react/no-unused-state': ['warn'],
    'react/prefer-stateless-function': ['warn'],
    'react/prop-types': ['warn'],
    'react/require-default-props': ['warn'],
    'react/sort-comp': [0],
    'react/state-in-constructor': ['warn', 'never'],
    'rest-spread-spacing': ['warn', 'never'],
    'semi': ['warn'],
    'sort-keys': ['error', 'asc', { 'caseSensitive': false }],
    'space-before-function-paren': ['warn'],
    'spaced-comment': ['warn']
  },
  ignorePatterns: [
    // Generated build output — don't lint compiled JS.
    'dist-electron/',
    'build/',
    'dist/',
    'resources/',
    'docs/',
    'utilities/jsdoc/'
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['./', 'src']
      }
    }
  },
  overrides: [
    {
      // TypeScript files use the TS parser + airbnb-typescript rules.
      // .js/.jsx files keep the babel parser configured above.
      // Placed first so the file-specific serviceWorker override below
      // wins for that single file (later overrides take precedence).
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        'plugin:react/recommended',
        'airbnb',
        'airbnb-typescript'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 12,
        // Three projects: renderer (src/), electron main+preload, scripts/.
        // ESLint tries each until it finds one that includes the linted file.
        project: ['./tsconfig.json', './tsconfig.electron.json', './tsconfig.scripts.json'],
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint', 'react'],
      rules: {
        // @typescript-eslint v8 removed the "style" extension rules that were
        // present in v5/v6 and that airbnb-typescript@18 still references.
        // Turn them off here so ESLint does not error with "Definition for rule
        // ... was not found". The base ESLint equivalents (comma-dangle, indent,
        // etc.) are re-enabled below so TS files still get style-checked.
        '@typescript-eslint/brace-style': 'off',
        '@typescript-eslint/comma-dangle': 'off',
        '@typescript-eslint/comma-spacing': 'off',
        '@typescript-eslint/func-call-spacing': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/keyword-spacing': 'off',
        '@typescript-eslint/lines-between-class-members': 'off',
        '@typescript-eslint/no-extra-semi': 'off',
        '@typescript-eslint/no-throw-literal': 'off',
        '@typescript-eslint/object-curly-spacing': 'off',
        '@typescript-eslint/quotes': 'off',
        '@typescript-eslint/semi': 'off',
        '@typescript-eslint/space-before-blocks': 'off',
        '@typescript-eslint/space-before-function-paren': 'off',
        '@typescript-eslint/space-infix-ops': 'off',
        // Re-enable base ESLint style rules for TS files (airbnb-typescript
        // turned them off expecting the TS versions to handle them above).
        'comma-dangle': ['warn', 'never'],
        'indent': ['warn', 2, { SwitchCase: 1 }],
        'quotes': ['warn'],
        'semi': ['warn'],
        // Keep the no-unused-vars TS version (still exists in v8).
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        // propTypes are removed during TS conversion; runtime check is the
        // type system itself.
        '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
        'arrow-body-style': [0],
        'class-methods-use-this': [0],
        'import/newline-after-import': [0],
        'import/no-extraneous-dependencies': 'off',
        'import/prefer-default-export': 'off',
        'linebreak-style': [0],
        'no-multiple-empty-lines': [0],
        'no-param-reassign': [0],
        'no-useless-return': [0],
        'padded-blocks': [0],
        'react/jsx-curly-spacing': ['warn', 'always'],
        'react/jsx-props-no-spreading': [0],
        'react/prop-types': 'off',
        'react/require-default-props': 'off'
      }
    },
    {
      // Build/dev scripts intentionally console.log progress and errors —
      // they're CLI entry points, not production code. Allow.
      files: ['scripts/**/*.ts'],
      rules: { 'no-console': 'off' }
    },
    {
      // CRA boilerplate file; console.log calls are part of the upstream
      // reference implementation. Allow them rather than touch CRA code.
      // Placed after the TS override so it wins (later overrides take
      // precedence) — the TS override extends airbnb which resets no-console.
      files: ['src/serviceWorker.js', 'src/serviceWorker.ts'],
      rules: { 'no-console': 'off' }
    }
  ]
};