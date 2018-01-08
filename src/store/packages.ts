import { BsPackage } from '../interfaces';

// ------------------------------------
// Constants
// ------------------------------------
export const ADD_PACKAGE = 'ADD_PACKAGE';

// ------------------------------------
// Actions
// ------------------------------------
export function addPackage(bsPackage: BsPackage) {
  return {
    type: ADD_PACKAGE,
    payload: bsPackage
  };
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState =
  {
    bsPackagesByPackageName: {}
  };

export default function(state = initialState, action: any) {

  switch (action.type) {

    case ADD_PACKAGE: {
      const newBsPackagesByPackageName: any = Object.assign({}, state.bsPackagesByPackageName);

      const bsPackage: any = action.payload;
      newBsPackagesByPackageName[bsPackage.name] = bsPackage;

      const newState = {
        bsPackagesByPackageName: newBsPackagesByPackageName
      };

      return newState;
    }
  }

  return state;
}
