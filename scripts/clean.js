const {
  existsSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync
} = require('fs');

/**
 * @namespace Cleaner
 * @description - Cleans project by removing several files & folders.
 * @see scripts\dispatch.js cleanProject() for complete list
 */
class Cleaner {
  removePath = (pathToRemove) => {

    if (existsSync(pathToRemove)) {
      console.log(`Removing: ${pathToRemove}`);

      if (statSync(pathToRemove).isFile()) unlinkSync(pathToRemove);
      else {
        const files = readdirSync(pathToRemove);

        files.forEach((file) => {
          const filePath = `${pathToRemove}/${file}`;

          if (statSync(filePath).isDirectory()) this.removePath(filePath);
          else unlinkSync(filePath);
        });
        rmdirSync(pathToRemove);
      }
    }
  };
}

module.exports.Cleaner = Cleaner;
