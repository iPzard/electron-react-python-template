describe('utils/services', () => {
  let api;
  let app;

  beforeEach(() => {
    api = {
      getPort: jest.fn(() => 3001),
      maximize: jest.fn(),
      minimize: jest.fn(),
      quit: jest.fn(),
      unmaximize: jest.fn()
    };
    global.window = global.window || {};
    global.window.electronAPI = api;

    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      ({ app } = require('../utils/services'));
    });
  });

  test('maximize calls electronAPI.maximize', () => {
    app.maximize();
    expect(api.maximize).toHaveBeenCalledTimes(1);
  });

  test('minimize calls electronAPI.minimize', () => {
    app.minimize();
    expect(api.minimize).toHaveBeenCalledTimes(1);
  });

  test('quit calls electronAPI.quit', () => {
    app.quit();
    expect(api.quit).toHaveBeenCalledTimes(1);
  });

  test('unmaximize calls electronAPI.unmaximize', () => {
    app.unmaximize();
    expect(api.unmaximize).toHaveBeenCalledTimes(1);
  });
});
