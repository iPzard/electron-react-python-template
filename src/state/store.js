import { combineReducers, createStore } from 'redux';

import { counterReducer } from 'state/reducers';

const rootReducer = combineReducers({
  count: counterReducer
});

export const store = createStore(rootReducer);