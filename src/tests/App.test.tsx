import { Provider } from 'react-redux';
import React from 'react';
import { render } from '@testing-library/react';
import App from '../components/App';
import store from '../state/store';

// utils/requests and utils/services call window.electronAPI at module load
// time (after the contextBridge migration). Jest's jsdom env has no preload
// bridge, so we mock those modules. jest.mock calls are hoisted above imports
// automatically. The wrappers themselves are covered by their own tests.
jest.mock('../utils/requests', () => ({
  get: jest.fn(),
  post: jest.fn()
}));
jest.mock('../utils/services', () => ({
  app: {
    maximize: jest.fn(),
    minimize: jest.fn(),
    quit: jest.fn(),
    unmaximize: jest.fn()
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
