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

      const rawTags: any = shell.exec('git tag');
      console.log('Tags for ', packageName);

      const splitTags: string[] = rawTags.split('\n');

      const tags: string[] = [];
      splitTags.forEach((tag) => {
        if (tag !== '') {
          tags.push(tag);
        }
      });

      if (tags.length === 0) {
        console.log(packageName, ' has no tags.');
      }
      else {
        console.log('Tags for ', packageName, ': ', tags);
      }
    });
  }

  render() {
    return (
      <div>Pizza</div>
    );
  }
}
