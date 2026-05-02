import { spawnSync, type SpawnSyncOptions } from 'child_process';
import * as nodePath from 'path';
import { Builder } from './build';

const builder = new Builder();

// Define input and output directories
const path = (directory: string): string => nodePath.resolve(__dirname, directory);

// Read app metadata from package.json so the installers always reflect the
// current name/version/description/author. Template users only need to edit
// package.json — these values flow through to the MSI/DMG/DEB output.
//
// `manufacturer` falls back to `author.name` if `author` is an object, or
// the raw author string. Set `author` in package.json to your company /
// publisher name; it shows up in Add/Remove Programs on Windows.
interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string | { name?: string };
}
// eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
const pkg: PackageJson = require('../package.json');
const APP_NAME = pkg.name;
const APP_VERSION = pkg.version;
const APP_DESCRIPTION = pkg.description || pkg.name;
const APP_MANUFACTURER = (typeof pkg.author === 'string')
  ? pkg.author
  : (pkg.author && pkg.author.name) || pkg.name;

const baseSpawnOptions: SpawnSyncOptions = {
  shell: true,
  stdio: 'inherit'
};

/**
 * @namespace Packager
 * @description - Packages app for various operating systems.
 */
export class Packager {

  /**
   * @description - Creates DEB installer for linux.
   * @memberof Packager
   *
   * @tutorial https://github.com/electron-userland/electron-installer-debian
   */
  packageLinux = (): void => {

    // Build Python & React distribution files
    builder.buildAll();

    const buildArgs = [
      'app',
      // PyInstaller's resources/app/ dir is dropped into the bundle's
      // Resources/ alongside (NOT inside) the asar. main.js resolves it
      // via process.resourcesPath, so the runtime path is
      //   <install>/resources/app/<binary>
      '--extra-resource=./resources/app',
      // Keep the asar lean: project source dirs and PyInstaller scratch
      // are not needed at runtime — the CRA build/ output is.
      '--ignore="^/(resources|dist|\\.pyi-build|src|public|tests|utilities|docs)(/|$)"',
      '--icon ./public/favicon.ico',
      '--platform linux',
      '--arch x64',
      '--out',
      './dist/linux',
      '--overwrite'
    ].join(' ');

    const packageArgs = [
      `--src ${path('../dist/linux/app-linux-x64/')}`,
      APP_NAME,
      `--dest ${path('../dist/linux/setup')}`,
      '--arch amd64',
      `--icon ${path('../utilities/deb/images/icon.ico')}`,
      `--background ${path('../utilities/deb/images/background.png')}`,
      `--title "${APP_DESCRIPTION}"`,
      '--overwrite'
    ].join(' ');

    spawnSync(`electron-packager . ${buildArgs}`, baseSpawnOptions);
    spawnSync(`electron-installer-debian ${packageArgs}`, baseSpawnOptions);
  };


  /**
   * @description - Creates DMG installer for macOS.
   * @memberof Packager
   *
   * @tutorial https://github.com/electron-userland/electron-installer-dmg
   */
  packageMacOS = (): void => {

    // Build Python & React distribution files
    builder.buildAll();

    const buildArgs = [
      'app',
      // See packageLinux comment; same Resources/app/ layout on macOS,
      // resolved at runtime via process.resourcesPath.
      '--extra-resource=./resources/app',
      '--ignore="^/(resources|dist|\\.pyi-build|src|public|tests|utilities|docs)(/|$)"',
      '--icon ./public/favicon.ico',
      '--platform=darwin',
      '--arch=x64',
      '--out',
      './dist/mac',
      '--overwrite'
    ].join(' ');

    const packageArgs = [
      path('../dist/mac/app-darwin-x64/app.app'),
      APP_NAME,
      `--out=${path('../dist/mac/setup')}`,
      `--icon=${path('../utilities/dmg/images/icon.icns')}`,
      `--background=${path('../utilities/dmg/images/background.png')}`,
      `--title="${APP_DESCRIPTION}"`,
      '--overwrite'
    ].join(' ');

    spawnSync(`electron-packager . ${buildArgs}`, baseSpawnOptions);
    spawnSync(`electron-installer-dmg ${packageArgs}`, baseSpawnOptions);
  };


  /**
   * @description - Creates MSI installer for Windows.
   * @memberof Packager
   *
   * @tutorial https://github.com/felixrieseberg/electron-wix-msi
   */
  packageWindows = (): void => {

    console.log('Building windows package...');

    // Build Python & React distribution files
    builder.buildAll();

    const appArgs = [
      'app',
      '--asar',
      // PyInstaller dist lands at <install>/resources/app/, resolved at
      // runtime via process.resourcesPath in main.js.
      '--extra-resource=./resources/app',
      '--ignore="^/(resources|dist|\\.pyi-build|src|public|tests|utilities|docs)(/|$)"',
      '--icon ./public/favicon.ico',
      '--win32',
      '--out',
      './dist/windows',
      '--overwrite'
    ].join(' ');

    spawnSync(`electron-packager . ${appArgs}`, baseSpawnOptions);

    // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
    const { MSICreator } = require('electron-wix-msi');

    const msiCreator = new MSICreator({
      appDirectory: path('../dist/windows/app-win32-x64'),
      appIconPath: path('../utilities/msi/images/icon.ico'),
      description: APP_DESCRIPTION,
      exe: 'app',
      manufacturer: APP_MANUFACTURER,
      name: APP_NAME,
      outputDirectory: path('../dist/windows/setup'),
      ui: {
        chooseDirectory: true,
        images: {
          background: path('../utilities/msi/images/background.png'),
          banner: path('../utilities/msi/images/banner.png')
        }
      },
      version: APP_VERSION
    });

    // Customized MSI template
    msiCreator.wixTemplate = msiCreator.wixTemplate
      .replace(/ \(Machine - MSI\)/gi, '')
      .replace(/ \(Machine\)/gi, '');


    // Create .wxs template and compile MSI
    msiCreator.create().then(() => msiCreator.compile());
  };

}
