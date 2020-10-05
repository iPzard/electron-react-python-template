const { spawnSync } = require('child_process');
const [ , , ...sysArgs ] = process.argv;
const [ os ] = sysArgs;

/**
 * @namespace Packaging
 * @description - Packages app for various operating systems.
 * @argument os - OS you would like to build for (e.g., windows or mac).
 */

switch(os) {
  case 'windows':
    return packageWindows();

  case 'mac':
    return packageMacOS();

  default:
    return console.error('No operating system selected.')
}

function packageMacOS(){

  // TODO: Add installer
  const options = [
    'app',
    '--asar',
    '--extra-resource=./resources/app',
    '--icon ./public/favicon.ico',
    '--darwin',
    '--out',
    './dist/macOS',
    '--overwrite'
  ].join(' ');

  // Run Electron package manager
  spawnSync(`electron-packager . ${options}`, { detached: false, shell: true, stdio: 'inherit' });
};

function packageWindows(){

  console.log('Building windows package...');

  // Build Python & React distribution files
  require('./build');

  // Options for electron packager
  const options = [
    'app',
    '--asar',
    '--extra-resource=./resources/app',
    '--icon ./public/favicon.ico',
    '--win32',
    '--out',
    './dist/windows',
    '--overwrite'
  ].join(' ');

  // Run Electron package manager
  spawnSync(`electron-packager . ${options}`, { detached: false, shell: true, stdio: 'inherit' });

  // Import Modules
  const { MSICreator } = require('electron-wix-msi');
  const path = (directory) => require('path').resolve(__dirname, directory);

  // Define input and output directory.
  const appDirectory = path('../dist/windows/app-win32-x64');
  const outputDirectory = path('../dist/windows/setup');
  const appIconPath = path('../utilities/msi/images/icon.ico');
  const appBackgroundPath = path('../utilities/msi/images/background.png');
  const appBannerPath = path('../utilities/msi/images/banner.png');


  // Instantiate the MSICreator
  const msiCreator = new MSICreator({
      appDirectory,
      appIconPath,
      outputDirectory,
      description: 'Example app',
      exe: 'app',
      manufacturer: 'Example Manufacturer',
      name: 'Example name',
      ui: {
        chooseDirectory: true,
        images: {
          background: appBackgroundPath,
          banner: appBannerPath,
        }
      },
      version: '1.0.0',
  });


  // Customized MSI template
  msiCreator.wixTemplate = msiCreator.wixTemplate
    .replace(/ \(Machine - MSI\)/gi, '')
    .replace(/ \(Machine\)/gi, '')
    .replace(/ \(User - MSI\)/gi, '')
    .replace(/ \(User\)/gi, '');


  // Create a .wxs template for MSI
  msiCreator.create().then(() => {

    // Compile .msi file
    msiCreator.compile();
  });
};
