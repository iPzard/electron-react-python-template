const { spawnSync } = require('child_process');
const spawnOptions = { detached: false, shell: true, stdio: 'inherit' };

/**
 * @namespace Builder
 * @description - Builds React & Python builds of project so Electron can be used.
 */
class Builder {

  /**
   * @description - Creates Electron, React, and Python production builds.
   * @memberof Builder
   */
  buildAll = () => {
    const { buildElectron, buildPython, buildReact } = this;

    buildElectron();
    buildPython();
    buildReact();
  }

  /**
   * @description - Compiles main.ts + preload.ts to dist-electron/.
   * package.json "main" points at dist-electron/main.js, so this output must
   * exist before electron-packager bundles the asar.
   * @memberof Builder
   */
  buildElectron = () => {
    console.log('Compiling Electron main + preload (TypeScript)...');
    spawnSync('tsc -p tsconfig.electron.json', spawnOptions);
  }

  /**
   * @description - Creates production build of Python back end. Uses
   * app.spec (committed) so hiddenimports and bundled data files survive
   * PyInstaller's static-analysis blind spots — see the comment block at
   * the top of app.spec.
   * @memberof Builder
   */
  buildPython = () => {
    console.log('Creating Python distribution files...');

    const options = [
      '--noconfirm', // Don't confirm overwrite
      '--distpath ./resources', // Dist (out) path
      // PyInstaller's intermediate workpath defaults to ./build/<name>/.
      // That collides with CRA's `react-scripts build` which clears ./build/
      // and refuses to rmdir a non-empty subdirectory — yarn build:package:*
      // would fail with "ENOTEMPTY: directory not empty, rmdir 'build/app'".
      // Route PyInstaller's scratch dir outside ./build/.
      '--workpath ./.pyi-build'
    ].join(' ');

    // Invoke via `python -m PyInstaller` so the build works even when
    // pip's user scripts directory isn't on PATH (common on Windows).
    spawnSync(`python -m PyInstaller ${options} app.spec`, spawnOptions);
  }

  /**
   * @description - Creates production build of React front end.
   *
   * DISABLE_ESLINT_PLUGIN=true: CRA 5 ships eslint-config-react-app and
   * loads it inside the webpack ESLint plugin. Combined with this project's
   * .eslintrc.js (which already lists `plugins: ['react']`), the build fails
   * with "Plugin 'react' was conflicted between …". Disabling CRA's plugin
   * keeps the build clean; standalone `yarn lint` still runs the airbnb
   * config we want.
   * @memberof Builder
   */
  buildReact = () => {
    console.log('Creating React distribution files...');
    spawnSync('cross-env DISABLE_ESLINT_PLUGIN=true react-scripts build', spawnOptions);
  }
}

module.exports.Builder = Builder;