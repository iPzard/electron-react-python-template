import type { Mock } from 'vitest';
import type { ElectronAPI } from '../types/electron-api';

type RequestsModule = typeof import('../utils/requests');

describe('utils/requests', () => {
  let getPort: Mock<() => number>;
  let fetchMock: Mock;
  let get: RequestsModule['get'];
  let post: RequestsModule['post'];

  beforeEach(async () => {
    getPort = vi.fn<() => number>(() => 3042);
    const api: ElectronAPI = {
      getPort,
      maximize: vi.fn(),
      minimize: vi.fn(),
      quit: vi.fn(),
      unmaximize: vi.fn()
    };
    window.electronAPI = api;
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    // Reset the module registry so the import-time side effect
    // (electronAPI.getPort()) re-fires with the freshly-mocked getPort
    // for every test. Without this, the module is cached from the first
    // import and getPort registers a single call regardless of test count.
    vi.resetModules();
    ({ get, post } = await vi.importActual<RequestsModule>('../utils/requests'));
  });

  test('reads port from electronAPI.getPort on import', () => {
    expect(getPort).toHaveBeenCalledTimes(1);
  });

  test('get hits localhost:<port>/<route> and invokes success callback with parsed JSON', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ ok: true }) });
    const cb = vi.fn();

    get('example', cb);
    await new Promise<void>((r) => { setTimeout(r, 0); });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3042/example');
    expect(cb).toHaveBeenCalledWith({ ok: true });
  });

  test('get invokes errorCallback on fetch failure', async () => {
    const err = new Error('boom');
    fetchMock.mockRejectedValue(err);
    const cb = vi.fn();
    const errCb = vi.fn();

    get('example', cb, errCb);
    await new Promise<void>((r) => { setTimeout(r, 0); });

    expect(cb).not.toHaveBeenCalled();
    expect(errCb).toHaveBeenCalledWith(err);
  });

  test('post sends body, JSON content-type, and POST method', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve('done') });
    const cb = vi.fn();
    const body = JSON.stringify({ a: 1 });

    post(body, 'submit', cb);
    await new Promise<void>((r) => { setTimeout(r, 0); });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3042/submit',
      {
        body,
        headers: { 'Content-type': 'application/json' },
        method: 'POST'
      }
    );
    expect(cb).toHaveBeenCalledWith('done');
  });
});
