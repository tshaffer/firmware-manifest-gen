export interface RecentCommitData {
  commitHash: string;
  commitMessage: string;
}

export interface BsTag {
  name: string;
  commit: string;
}

export interface BsPackage {
  name: string;
  tags: BsTag[];
  packageVersionSelector: PackageVersionSelectorType;
  selectedTagIndex: number;
  selectedBranchName: string;
  specifiedCommitHash: string;
  tagIndexForPackageDotJsonPackageVersion?: number;
  specifiedBsPackage?: SpecifiedBsPackage;
}

export interface SpecifiedBsPackage {
  name: string;
  version: string;
}
export interface SBPMap<T extends SpecifiedBsPackage> {
  [bsPackageName: string]: T;
}
export type SpecifiedBsPackageMap = SBPMap<SpecifiedBsPackage> | {};

export class PackageVersionSelectorType {
  static Tag = 'tag';
  static Branch = 'branch';
  static Commit = 'commit';
  static PackageDotJsonVersion = 'packageDotJsonVersion';
}
Object.freeze(PackageVersionSelectorType);
