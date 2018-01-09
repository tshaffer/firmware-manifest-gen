import { BsPackage } from '../interfaces';

// ------------------------------------
// Constants
// ------------------------------------
export const ADD_PACKAGE = 'ADD_PACKAGE';
export const SET_SELECTED_TAG_INDEX = 'SET_SELECTED_TAG_INDEX';

// ------------------------------------
// Actions
// ------------------------------------
export function addPackage(bsPackage: BsPackage) {
  return {
    type: ADD_PACKAGE,
    payload: bsPackage
  };
}

export function setSelectedTagIndex(packageName: string, selectedTagIndex: number) {
  return {
    type: SET_SELECTED_TAG_INDEX,
    payload: {
      packageName,
      selectedTagIndex
    }
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
    case SET_SELECTED_TAG_INDEX: {
      const newBsPackagesByPackageName: any = Object.assign({}, state.bsPackagesByPackageName);

      newBsPackagesByPackageName[action.payload.packageName].selectedTagIndex = action.payload.selectedTagIndex;

      const newState = {
        bsPackagesByPackageName: newBsPackagesByPackageName
      };

      return newState;
    }

  }

  return state;
}
