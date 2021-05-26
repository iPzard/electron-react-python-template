const getPort = require('get-port');

const openPort = async () => await getPort({
  port: getPort.makeRange(3001, 3999)
});

module.exports.openPort = openPort;