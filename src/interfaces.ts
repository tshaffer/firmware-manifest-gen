export interface RecentCommitData {
  commitHash: string;
  commitMessage: string;
}

export interface BsPackage {
  name: string;
}

export type BstPackage = BsPackage | {};
