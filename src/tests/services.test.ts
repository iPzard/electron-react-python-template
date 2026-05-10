import type { ElectronAPI } from '../types/electron-api';

type ServicesModule = typeof import('../utils/services');

describe('utils/services', () => {
  let api: ElectronAPI;
  let app: ServicesModule['app'];

  beforeEach(() => {
    api = {
      getPort: jest.fn(() => 3001),
      maximize: jest.fn(),
      minimize: jest.fn(),
      quit: jest.fn(),
      unmaximize: jest.fn()
    };
    window.electronAPI = api;

    jest.isolateModules(() => {
      const mod = jest.requireActual<ServicesModule>('../utils/services');
      ({ app } = mod);
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
