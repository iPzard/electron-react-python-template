import { existsSync, readdirSync } from 'fs';
import * as path from 'path';

import { Builder } from './build';
import { Cleaner } from './clean';
import { Packager } from './package';
import { Starter } from './start';

const [, , script, command] = process.argv;

/**
 * @namespace Dispatcher
 * @description - Dispatches script commands to various scripts.
 * @argument script - Script manager to use (e.g., build or package).
 * @argument command - Command argument describing exact script to run.
 */
function main(): void {
  switch (script) {
    case 'build':
      buildApp();
      return;

    case 'clean':
      cleanProject({ removeDeps: command === 'all' });
      return;

    case 'package':
      packageApp();
      return;

    case 'start':
      startDeveloperMode();
      return;

    // no default
  }
}


/**
 * @description - Builds various production builds (e.g., Python, React).
 * @memberof Dispatcher
 */
function buildApp(): void {
  const builder = new Builder();

  switch (command) {
    case 'react':
      builder.buildReact();
      return;

    case 'python':
      builder.buildPython();
      return;

    case 'all':
      builder.buildAll();
      return;

    // no default
  }
}


interface CleanProjectOptions {
  removeDeps?: boolean;
}

/**
 * @description - Cleans project by removing build/test artifacts.
 * `yarn clean` removes only generated artifacts (safe; quick to recover from).
 * `yarn clean:all` additionally removes node_modules + lockfiles, requiring
 * a full reinstall — pass `{ removeDeps: true }`.
 *
 * Notes:
 *  - app.spec is committed source (PyInstaller spec), do NOT delete.
 *  - docs/ is the published JSDoc reference, do NOT delete.
 * @memberof Dispatcher
 */
function cleanProject({ removeDeps = false }: CleanProjectOptions = {}): void {
  const cleaner = new Cleaner();
  const getPath = (...filePaths: string[]): string => path.join(__dirname, '..', ...filePaths);

  // Generated artifacts — always removed.
  const artifactPaths = [
    // Python cache
    getPath('app.pyc'),
    getPath('__pycache__'),

    // Debug logs
    getPath('npm-debug.log'),
    getPath('yarn-debug.log'),
    getPath('yarn-error.log'),

    // Test output
    getPath('coverage'),

    // Production output
    getPath('build'),
    getPath('dist'),

    // Compiled Electron main + preload (TS → JS via tsconfig.electron.json)
    getPath('dist-electron'),

    // PyInstaller intermediate workpath (see scripts/build.ts)
    getPath('.pyi-build'),

    // Misc
    getPath('.DS_Store')
  ];

  // Dependency caches and lockfiles — only removed by `yarn clean:all`.
  // Removing yarn.lock + node_modules forces a full reinstall and may drift
  // dependency versions, so we gate it behind an explicit opt-in.
  const dependencyPaths = [
    getPath('.pnp'),
    getPath('.pnp.js'),
    getPath('node_modules'),
    getPath('package-lock.json'),
    getPath('yarn.lock')
  ];

  const pathsToRemove = removeDeps
    ? [...artifactPaths, ...dependencyPaths]
    : artifactPaths;

  pathsToRemove.forEach(cleaner.removePath);

  /**
   * Remove resources/app if it exists, then if the resources
   * folder isn't used for any other Python modules, delete it too.
   */
  const resourcesDir = getPath('resources');
  const isResourcesDirExist = existsSync(resourcesDir);

  if (isResourcesDirExist) {

    // Remove 'resources/app' directory if it exists
    const resourcesAppDir = path.join(resourcesDir, 'app');
    const isResourcesAppDir = existsSync(resourcesAppDir);

    if (isResourcesAppDir) cleaner.removePath(resourcesAppDir);

    // Remove 'resources' directory if it's empty
    const isResourcesDirEmpty = Boolean(!readdirSync(resourcesDir).length);
    if (isResourcesDirEmpty) cleaner.removePath(resourcesDir);
  }

  console.log(removeDeps ? 'Project fully cleaned (deps removed).' : 'Project artifacts cleaned.');
}


/**
 * @description - Builds various installers (e.g., DMG, MSI).
 * @memberof Dispatcher
 */
function packageApp(): void {
  const packager = new Packager();

  switch (command) {
    case 'linux':
      packager.packageLinux();
      return;

    case 'mac':
      packager.packageMacOS();
      return;

    case 'windows':
      packager.packageWindows();
      return;

    // no default
  }
}


/**
 * @description - Starts developer mode of app.
 * Including; React, Electron, and Python/Flask.
 * @memberof Dispatcher
 */
function startDeveloperMode(): void {
  const start = new Starter();
  start.developerMode();
}

main();
