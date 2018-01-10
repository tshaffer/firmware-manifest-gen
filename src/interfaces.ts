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

export type BstPackage = BsPackage | {};
