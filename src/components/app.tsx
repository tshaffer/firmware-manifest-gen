import * as React from 'react';

// import { cd } from 'shelljs';
import * as shell from 'shelljs';

export default class App extends React.Component<any, object> {

  componentDidMount() {

    const packageBaseDir: string = '/Users/tedshaffer/Documents/Projects/';

    const packageNames: string[] = [];
    packageNames.push('bpfImporter');
    packageNames.push('bsPublisher');

    packageNames.forEach((packageName) => {

      const packagePath = packageBaseDir.concat(packageName);

      console.log('packageName: ', packageName);
      console.log('packagePath: ', packagePath);

      shell.cd(packagePath);
      shell.pwd();

      // Get tags for this package
      // tags=$(git tag)
      const rawTags: any = shell.exec('git tag');

      const splitTags: string[] = rawTags.split('\n');

      const tags: string[] = [];
      splitTags.forEach((tag) => {
        if (tag !== '') {
          tags.push(tag);
        }
      });

      tags.forEach((tag) => {

        // get the commit information for the tag
        // commitLine=$(git show $tag | grep commit)
        const gitShowCmd: string = 'git show ' + tag + ' | grep commit'
        const commitLine: string = shell.exec(gitShowCmd).stdout;
        const commitHash: string = commitLine.split(' ')[1];

        // commitInfo=$(git log -1 $commitHash)
        const gitLogCmd: string = 'git log -1 ' + commitHash;
        const commitInfo: string = shell.exec(gitLogCmd).stdout;

        console.log('Tag:', tag);
        console.log(commitInfo);
        console.log('');
      });

      // get the last n commits on the current branch for this package
      // currentBranch=$(git branch | grep \* | cut -d ' ' -f2)
      let currentBranch: string = '';
      const rawBranches: string = shell.exec('git branch').stdout;
      const branches: string[] = rawBranches.split('\n');
      branches.forEach((branchName) => {
        if (branchName.startsWith('* ')) {
          currentBranch = branchName.substring(2);
        }
      })
      console.log('currentBranch: ', currentBranch);

      // git log -$numCommits
      const recentCommitMessages: string = shell.exec('git log -3').stdout;
      console.log('Recent commit messages:');
      console.log(recentCommitMessages);
      console.log('');
    });
  }

  render() {
    return (
      <div>Pizza</div>
    );
  }
}
