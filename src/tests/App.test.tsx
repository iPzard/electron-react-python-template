import { Provider } from 'react-redux';
import React from 'react';
import { render } from '@testing-library/react';
import App from '../components/App';
import store from '../state/store';

// utils/requests and utils/services call window.electronAPI at module load
// time (after the contextBridge migration). Vitest's jsdom env has no preload
// bridge, so we mock those modules. vi.mock calls are hoisted above imports
// automatically. The wrappers themselves are covered by their own tests.
vi.mock('../utils/requests', () => ({
  get: vi.fn(),
  post: vi.fn()
}));
vi.mock('../utils/services', () => ({
  app: {
    maximize: vi.fn(),
    minimize: vi.fn(),
    quit: vi.fn(),
    unmaximize: vi.fn()
  }
}));

test('renders learn react link', () => {
  const { getByText } = render(
    <Provider store={ store }>
      <App />
    </Provider>
  );

  expect(getByText(/learn/i)).toBeInTheDocument();
});
