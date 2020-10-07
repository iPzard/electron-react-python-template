import * as reducerModules from 'state/reducers';

import { combineReducers, createStore } from 'redux';

const reducers = combineReducers({ ...reducerModules });
export const store = createStore(reducers);