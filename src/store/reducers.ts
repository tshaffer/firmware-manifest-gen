import { combineReducers } from 'redux';

import packagesReducer from './packages';

const rootReducer = combineReducers({
  bsPackages: packagesReducer,
});

export default rootReducer;

