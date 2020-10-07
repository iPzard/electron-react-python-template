import * as reducerModules from 'state/reducers';

import { combineReducers, createStore } from 'redux';

export const store = createStore(combineReducers({ ...reducerModules }));