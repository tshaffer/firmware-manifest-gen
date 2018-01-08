import * as React from 'react';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import * as shell from 'shelljs';

import {
  BsPackage,
  BstPackage,
  RecentCommitData
} from '../interfaces';

export default class App extends React.Component<any, object> {

  state: any;
  
  constructor(props: any){
    super(props);
    this.state = {
      bsPackages: [],
      value: '',
      isEditing: false,
      isInitialized: false,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  // 1 row per package
  // columns
  //    package name
  //    tag select - displays tag label
  //    tag commit info - displays commit info for selected tag

  componentDidMount() {

    const bsPackages: BsPackage[] = [];

    const packageBaseDir: string = '/Users/tedshaffer/Documents/Projects/';

    const packageNames: string[] = [];
    packageNames.push('bpfImporter');
    packageNames.push('bsPublisher');

    packageNames.forEach((packageName) => {

      const bsPackage: BstPackage = {};
      (bsPackage as BsPackage).name = packageName;
      bsPackages.push(bsPackage as BsPackage);

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
      const numRecentCommits = 3;
      const recentCommits: RecentCommitData[] = [];
      for (let i = 0; i < (numRecentCommits - 1); i++) {
        const commitMessage = shell.exec('git log -1 --skip=' + i.toString()).stdout;
        const commitHash = commitMessage.substr(7, 40);
        recentCommits.push( {
          commitHash,
          commitMessage
        });
      }

      console.log('Recent commit messages:');
      console.log(recentCommits);
      console.log('');
    });

    this.setState({ bsPackages });
  }

  buttonClicked() {
    console.log('buttonClicked');
  }

  handleChange(event: any, index: any, value: any) {
    console.log('handleChange');
    this.setState({value});
  }

  buildPackageRow(bsPackage: BsPackage) {

    console.log('buildPackageRow: ', bsPackage);

    return (
      <TableRow key={bsPackage.name}>
        <TableRowColumn>
          {bsPackage.name}
        </TableRowColumn>
        <TableRowColumn>
          <SelectField
            floatingLabelText='Frequency'
            value={this.state.value}
            onChange={this.handleChange}
          >
            <MenuItem value={1} primaryText='Never' />
            <MenuItem value={2} primaryText='Every Night' />
            <MenuItem value={3} primaryText='Weeknights' />
            <MenuItem value={4} primaryText='Weekends' />
            <MenuItem value={5} primaryText='Weekly' />
          </SelectField>
        </TableRowColumn>
      </TableRow>
    );
  }

  buildPackageRows() {

    const bsPackageRows: any = [];

    this.state.bsPackages.forEach((bsPackage: BsPackage) => {
      bsPackageRows.push(this.buildPackageRow(bsPackage));
    })

    return bsPackageRows;
  }

  render() {

    const bsPackageRows: any[] = this.buildPackageRows();

    return (
      <MuiThemeProvider>
        <div>

          <div>Pizza</div>

          <Table>
            <TableHeader
              displaySelectAll={false}
              adjustForCheckbox={false}
              enableSelectAll={false}
            >
              <TableRow>
                <TableHeaderColumn>Name</TableHeaderColumn>
                <TableHeaderColumn>Tags</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody
              displayRowCheckbox={false}
            >
              {bsPackageRows}
            </TableBody>
          </Table>

          <RaisedButton label='Delete' onClick={this.buttonClicked.bind(this)}/>
        </div>
      </MuiThemeProvider>
    );
  }
}
