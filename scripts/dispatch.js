const [ , , script, command ] = process.argv;
const { existsSync, readdirSync } = require('fs');
const path = require('path');

const { Builder } = require('./build');
const { Cleaner } = require('./clean');
const { Packager } = require('./package');
const { Starter } = require('./start');


/**
 * @namespace Dispatcher
 * @description - Dispatches script commands to various scripts.
 * @argument script - Script manager to use (e.g., build or package).
 * @argument command - Command argument describing exact script to run.
 */

switch (script) {
  case 'build':
    return buildApp();

  case 'clean':
    return cleanProject({ removeDeps: command === 'all' });

  case 'package':
    return packageApp();

  case 'start':
    return startDeveloperMode();

  // no default
}


/**
 * @description - Builds various production builds (e.g., Python, React).
 * @memberof Dispatcher
 */
function buildApp() {
  const builder = new Builder();

  switch (command) {
    case 'react':
      return builder.buildReact();

    case 'python':
      return builder.buildPython();

    case 'all':
      return builder.buildAll();

    // no default
  }
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
function cleanProject({ removeDeps = false } = {}) {
  const cleaner = new Cleaner();
  const getPath = (...filePaths) => path.join(__dirname, '..', ...filePaths);

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

    // PyInstaller intermediate workpath (see scripts/build.js)
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
function packageApp() {
  const packager = new Packager();

  switch (command) {
    case 'linux':
      return packager.packageLinux();

    case 'mac':
      return packager.packageMacOS();

    case 'windows':
      return packager.packageWindows();

    // no default
  }
}


/**
 * @description - Starts developer mode of app.
 * Including; React, Electron, and Python/Flask.
 * @memberof Dispatcher
 */
function startDeveloperMode() {
  const start = new Starter();
  start.developerMode();
}