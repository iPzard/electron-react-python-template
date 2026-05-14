import { spawnSync, type SpawnSyncOptions } from 'child_process';

const spawnOptions: SpawnSyncOptions = {
  shell: true,
  stdio: 'inherit'
};

/**
 * Builds React & Python builds of project so Electron can be used.
 */
export class Builder {

  /**
   * Creates Electron, React, and Python production builds.
   */
  buildAll = (): void => {
    const { buildElectron, buildPython, buildReact } = this;

    buildElectron();
    buildPython();
    buildReact();
  };

  /**
   * Compiles main.ts + preload.ts to dist-electron/.
   * package.json "main" points at dist-electron/main.js, so this output must
   * exist before electron-packager bundles the asar.
   */
  buildElectron = (): void => {
    console.log('Compiling Electron main + preload (TypeScript)...');
    spawnSync('tsc -p tsconfig.electron.json', spawnOptions);
  };

  /**
   * Creates production build of Python back end. Uses
   * app.spec (committed) so hiddenimports and bundled data files survive
   * PyInstaller's static-analysis blind spots — see the comment block at
   * the top of app.spec.
   */
  buildPython = (): void => {
    console.log('Creating Python distribution files...');

    const options = [
      '--noconfirm', // Don't confirm overwrite
      '--distpath ./resources', // Dist (out) path
      // PyInstaller's intermediate workpath defaults to ./build/<name>/.
      // That collides with Vite's `vite build` output dir (./build/), which
      // would refuse to rmdir a non-empty subdirectory — yarn build:package:*
      // would fail with "ENOTEMPTY: directory not empty, rmdir 'build/app'".
      // Route PyInstaller's scratch dir outside ./build/.
      '--workpath ./.pyi-build'
    ].join(' ');

    // Invoke via `python -m PyInstaller` so the build works even when
    // pip's user scripts directory isn't on PATH (common on Windows).
    spawnSync(`python -m PyInstaller ${options} app.spec`, spawnOptions);
  };

  /**
   * Creates production build of React front end via Vite.
   *
   * Output goes to ./build/ (configured in vite.config.ts) so the
   * Electron prod load path `loadFile('build/index.html')` continues to
   * work without changes. `base: './'` in the Vite config keeps emitted
   * asset URLs relative — required for loading via file:// from the asar.
   */
  buildReact = (): void => {
    console.log('Creating React distribution files...');
    spawnSync('vite build', spawnOptions);
  };
}
