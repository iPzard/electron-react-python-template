describe('utils/requests', () => {
  let getPort;
  let fetchMock;
  let get;
  let post;

  beforeEach(() => {
    getPort = jest.fn(() => 3042);
    global.window = global.window || {};
    global.window.electronAPI = {
      getPort,
      maximize: jest.fn(),
      minimize: jest.fn(),
      quit: jest.fn(),
      unmaximize: jest.fn()
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      ({ get, post } = require('../utils/requests'));
    });
  });

  test('reads port from electronAPI.getPort on import', () => {
    expect(getPort).toHaveBeenCalledTimes(1);
  });

  test('get hits localhost:<port>/<route> and invokes success callback with parsed JSON', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve({ ok: true }) });
    const cb = jest.fn();

    get('example', cb);
    await new Promise((r) => { setTimeout(r, 0); });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3042/example');
    expect(cb).toHaveBeenCalledWith({ ok: true });
  });

  test('get invokes errorCallback on fetch failure', async () => {
    const err = new Error('boom');
    fetchMock.mockRejectedValue(err);
    const cb = jest.fn();
    const errCb = jest.fn();

    get('example', cb, errCb);
    await new Promise((r) => { setTimeout(r, 0); });

    expect(cb).not.toHaveBeenCalled();
    expect(errCb).toHaveBeenCalledWith(err);
  });

  test('post sends body, JSON content-type, and POST method', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve('done') });
    const cb = jest.fn();
    const body = JSON.stringify({ a: 1 });

    post(body, 'submit', cb);
    await new Promise((r) => { setTimeout(r, 0); });

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
