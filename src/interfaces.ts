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
  packageVersionSelector: string;
  selectedTagIndex: number;
  selectedBranchName: string;
  specifiedCommitHash: string;
}

export class VersionSpecType {
  static Equality = 'equality';
  static GreaterThan = 'gt';
  static Tilde = 'tilde';
  static Caret = 'caret';
}
Object.freeze(VersionSpecType);

export interface SpecifiedBsPackage {
  name: string;
  version: string;
}
export interface SBPMap<T extends SpecifiedBsPackage> {
  [bsPackageName: string]: T;
}
export type SpecifiedBsPackageMap = SBPMap<SpecifiedBsPackage> | {};
