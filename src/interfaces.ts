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
  selectedTagIndex: number;
  tags: BsTag[];
}

export type BstPackage = BsPackage | {};
