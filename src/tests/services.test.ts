import type { ElectronAPI } from '../types/electron-api';

type ServicesModule = typeof import('../utils/services');

describe('utils/services', () => {
  let api: ElectronAPI;
  let app: ServicesModule['app'];

  beforeEach(async () => {
    api = {
      getPort: vi.fn(() => 3001),
      maximize: vi.fn(),
      minimize: vi.fn(),
      quit: vi.fn(),
      unmaximize: vi.fn()
    };
    window.electronAPI = api;

    // Reset the module registry so each test gets a fresh `app` proxy
    // bound to the per-test electronAPI mocks.
    vi.resetModules();
    ({ app } = await vi.importActual<ServicesModule>('../utils/services'));
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
