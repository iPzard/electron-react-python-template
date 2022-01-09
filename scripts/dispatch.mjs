const [, , script, command] = process.argv;
import { existsSync, readdirSync } from "fs";
import path from "path";

import Builder from "./build.mjs";
import Cleaner from "./clean.mjs";
import Packager from "./package.mjs";
import Starter from "./start.mjs";

/**
 * @namespace Dispatcher
 * @description - Dispatches script commands to various scripts.
 * @argument script - Script manager to use (e.g., build or package).
 * @argument command - Command argument describing exact script to run.
 */

switch (script) {
  case "build":
    buildApp();

  case "clean":
    cleanProject();

  case "package":
    packageApp();

  case "start":
    startDeveloperMode();

  // no default
}

/**
 * @description - Builds various production builds (e.g., Python, React).
 * @memberof Dispatcher
 */
function buildApp() {
  const builder = new Builder();

  switch (command) {
    case "react":
      return builder.buildReact();

    case "python":
      return builder.buildPython();

    case "all":
      return builder.buildAll();

    // no default
  }
}

/**
 * @description - Cleans project by removing various files and folders.
 * @memberof Dispatcher
 */
function cleanProject() {
  const cleaner = new Cleaner();
  const getPath = (...filePaths) => path.join(__dirname, "..", ...filePaths);

  // Files to remove during cleaning
  [
    // Cache
    getPath("app.pyc"),
    getPath("app.spec"),
    getPath("__pycache__"),

    // Debug
    getPath("npm-debug.log"),
    getPath("yarn-debug.log"),
    getPath("yarn-error.log"),

    // Dependencies
    getPath(".pnp"),
    getPath(".pnp.js"),
    getPath("node_modules"),
    getPath("package-lock.json"),
    getPath("yarn.lock"),

    // Testing
    getPath("coverage"),

    // Production
    getPath("build"),
    getPath("dist"),
    getPath("docs"),

    // Misc
    getPath(".DS_Store")
  ]
    // Iterate and remove process
    .forEach(cleaner.removePath);

  /**
   * Remove resources/app if it exists, then if the resources
   * folder isn't used for any other Python modules, delete it too.
   */
  const resourcesDir = getPath("resources");
  const isResourcesDirExist = existsSync(resourcesDir);

  if (isResourcesDirExist) {
    // Remove 'resources/app' directory if it exists
    const resourcesAppDir = path.join(resourcesDir, "app");
    const isResourcesAppDir = existsSync(resourcesAppDir);

    if (isResourcesAppDir) cleaner.removePath(resourcesAppDir);

    // Remove 'resources' directory if it's empty
    const isResourcesDirEmpty = Boolean(!readdirSync(resourcesDir).length);
    if (isResourcesDirEmpty) cleaner.removePath(resourcesDir);
  }

  console.log("Project is clean.");
}

/**
 * @description - Builds various installers (e.g., DMG, MSI).
 * @memberof Dispatcher
 */
function packageApp() {
  const packager = new Packager();

  switch (command) {
    case "linux":
      return packager.packageLinux();

    case "mac":
      return packager.packageMacOS();

    case "windows":
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
