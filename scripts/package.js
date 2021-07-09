const { spawnSync } = require('child_process');
const { Builder } = require('./build');

const builder = new Builder();

// Define input and output directories
const path = (directory) => {
  return require('path').resolve(__dirname, directory);
};

/**
 * @namespace Packager
 * @description - Packages app for various operating systems.
 */
class Packager {

  /**
   * @description - Creates DEB installer for linux.
   * @memberof Packager
   *
   * @tutorial https://github.com/electron-userland/electron-installer-debian
   */
  packageLinux = () => {

    // Build Python & React distribution files
    builder.buildAll();

    const options = {
      build: [
        'app',
        '--extra-resource=./resources',
        '--icon ./public/favicon.ico',
        '--platform linux',
        '--arch x64',
        '--out',
        './dist/linux',
        '--overwrite'
      ].join(' '),

      package: [
        `--src ${path('../dist/linux/app-linux-x64/')}`,
        'Example app',
        `--dest ${path('../dist/linux/setup')}`,
        '--arch amd64',
        `--icon ${path('../utilities/deb/images/icon.ico')}`,
        `--background ${path('../utilities/deb/images/background.png')}`,
        '--title "Example App"',
        '--overwrite'
      ].join(' '),

      spawn: { detached: false, shell: true, stdio: 'inherit' }
    };

    spawnSync(`electron-packager . ${options.build}`, options.spawn);
    spawnSync(`electron-installer-debian ${options.package}`, options.spawn);
  };


  /**
   * @description - Creates DMG installer for macOS.
   * @memberof Packager
   *
   * @tutorial https://github.com/electron-userland/electron-installer-dmg
   */
  packageMacOS = () => {

    // Build Python & React distribution files
    builder.buildAll();

    const options = {
      build: [
        'app',
        '--extra-resource=./resources',
        '--icon ./public/favicon.ico',
        '--win32',
        '--out',
        './dist/mac',
        '--overwrite'
      ].join(' '),

      package: [
        path('../dist/mac/app-darwin-x64/app.app'),
        'Example app',
        `--out=${path('../dist/mac/setup')}`,
        `--icon=${path('../utilities/dmg/images/icon.icns')}`,
        `--background=${path('../utilities/dmg/images/background.png')}`,
        '--title="Example App"',
        '--overwrite'
      ].join(' '),

      spawn: { detached: false, shell: true, stdio: 'inherit' }
    };

    spawnSync(`electron-packager . ${options.build}`, options.spawn);
    spawnSync(`electron-installer-dmg ${options.package}`, options.spawn);
  };


  /**
   * @description - Creates MSI installer for Windows.
   * @memberof Packager
   *
   * @tutorial https://github.com/felixrieseberg/electron-wix-msi
   */
  packageWindows = () => {

    console.log('Building windows package...');

    // Build Python & React distribution files
    builder.buildAll();

    const options = {
      app: [
        'app',
        '--asar',
        '--extra-resource=./resources/app',
        '--icon ./public/favicon.ico',
        '--win32',
        '--out',
        './dist/windows',
        '--overwrite'
      ].join(' '),

      spawn: { detached: false, shell: true, stdio: 'inherit' }
    };

    spawnSync(`electron-packager . ${options.app}`, options.spawn);

    const { MSICreator } = require('electron-wix-msi');

    const msiCreator = new MSICreator({
      appDirectory: path('../dist/windows/app-win32-x64'),
      appIconPath: path('../utilities/msi/images/icon.ico'),
      outputDirectory: path('../dist/windows/setup'),
      description: 'Example app',
      exe: 'app',
      manufacturer: 'Example Manufacturer',
      name: 'Example App',
      ui: {
        chooseDirectory: true,
        images: {
          background: path('../utilities/msi/images/background.png'),
          banner: path('../utilities/msi/images/banner.png')
        }
      },
      version: '1.0.0'
    });

    // Customized MSI template
    msiCreator.wixTemplate = msiCreator.wixTemplate
      .replace(/ \(Machine - MSI\)/gi, '')
      .replace(/ \(Machine\)/gi, '');


    // Create .wxs template and compile MSI
    msiCreator.create().then(() => msiCreator.compile());
  };

}

module.exports.Packager = Packager;