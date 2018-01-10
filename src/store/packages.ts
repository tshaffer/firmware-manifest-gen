import { BsPackage } from '../interfaces';

// ------------------------------------
// Constants
// ------------------------------------
export const ADD_PACKAGE = 'ADD_PACKAGE';
export const SET_PACKAGE_VERSION_SELECTOR = 'SET_PACKAGE_VERSION_SELECTOR';
export const SET_SELECTED_TAG_INDEX = 'SET_SELECTED_TAG_INDEX';
export const SET_SELECTED_BRANCH_NAME = 'SET_SELECTED_BRANCH_NAME';
export const SET_SPECIFIED_COMMIT_HASH = 'SET_SPECIFIED_COMMIT_HASH';

// ------------------------------------
// Actions
// ------------------------------------
export function addPackage(bsPackage: BsPackage) {
  return {
    type: ADD_PACKAGE,
    payload: bsPackage
  };
}

export function setPackageVersionSelector(packageName: string, packageVersionSelector: string) {
  return {
    type: SET_PACKAGE_VERSION_SELECTOR,
    payload: {
      packageName,
      packageVersionSelector
    }
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

export function setSelectedBranchName(packageName: string, selectedBranchName: string) {
  return {
    type: SET_SELECTED_BRANCH_NAME,
    payload: {
      packageName,
      selectedBranchName
    }
  };
}

export function setSpecifiedCommitHash(packageName: string, specifiedCommitHash: string) {
  return {
    type: SET_SPECIFIED_COMMIT_HASH,
    payload: {
      packageName,
      specifiedCommitHash
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
    case SET_PACKAGE_VERSION_SELECTOR: {
      const newBsPackagesByPackageName: any = Object.assign({}, state.bsPackagesByPackageName);

      newBsPackagesByPackageName[action.payload.packageName].packageVersionSelector =
        action.payload.packageVersionSelector;

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
    case SET_SELECTED_BRANCH_NAME: {
      const newBsPackagesByPackageName: any = Object.assign({}, state.bsPackagesByPackageName);

      newBsPackagesByPackageName[action.payload.packageName].selectedBranchName = action.payload.selectedBranchName;

      const newState = {
        bsPackagesByPackageName: newBsPackagesByPackageName
      };

      return newState;
    }
    case SET_SPECIFIED_COMMIT_HASH: {
      const newBsPackagesByPackageName: any = Object.assign({}, state.bsPackagesByPackageName);

      newBsPackagesByPackageName[action.payload.packageName].specifiedCommitHash = action.payload.specifiedCommitHash;

      const newState = {
        bsPackagesByPackageName: newBsPackagesByPackageName
      };

      return newState;
    }
  }

  return state;
}
