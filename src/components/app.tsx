import * as React from 'react';

import * as fs from 'fs-extra';

import * as semver from 'semver';

import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import MenuItem from 'material-ui/MenuItem';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import RaisedButton from 'material-ui/RaisedButton';
import SelectField from 'material-ui/SelectField';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import TextField from 'material-ui/TextField';

import * as shell from 'shelljs';

import {
  addPackage,
  setPackageVersionSelector,
  setSelectedBranchName,
  setSelectedTagIndex,
  setSpecifiedCommitHash,
} from '../store/packages';

import {
  BsPackage,
  BsTag,
  RecentCommitData,
  SpecifiedBsPackage,
  SpecifiedBsPackageMap,
  VersionSpecType,
} from '../interfaces';

const specifiedPackages: SpecifiedBsPackage[] = [];
// let specifiedPackagesMap: SpecifiedBsPackageMap = {};
const specifiedPackagesMap: any = {};

class App extends React.Component<any, object> {

  packageBaseDir: string = '/Users/tedshaffer/Documents/Projects/bacon-comp/';

  constructor(props: any){
    super(props);
    this.setPackageVersionSelector = this.setPackageVersionSelector.bind(this);
    this.selectTag = this.selectTag.bind(this);
    this.setBranchName = this.setBranchName.bind(this);
    this.setCommitHash = this.setCommitHash.bind(this);
    this.configureButtonClicked = this.configureButtonClicked.bind(this);
  }

  componentDidMount() {

    // get info about bacon's package.json
    const baconPackageJsonPath = this.packageBaseDir.concat('bacon/package.json');
    const baconPackageJson = fs.readJsonSync(baconPackageJsonPath);
    console.log(baconPackageJson);
    console.log(baconPackageJson.dependencies);

    console.log('bacon package.json contains the following BrightSign packages / versions:');

    for (const dependencyName in baconPackageJson.dependencies) {
      if (baconPackageJson.dependencies.hasOwnProperty(dependencyName)) {
        if (dependencyName.startsWith('@brightsign/')) {
          const bsPackageName: string = dependencyName.substr(12);
          console.log(bsPackageName);
          const bsPackageVersionSpec: string = baconPackageJson.dependencies[dependencyName];
          console.log(bsPackageVersionSpec);

          let versionSpecType: string;
          const versionSpecFirstChar = bsPackageVersionSpec.substr(0, 1);
          if (isNaN(Number(versionSpecFirstChar))) {
            switch (versionSpecFirstChar) {
              case '>': {
                versionSpecType = VersionSpecType.GreaterThan;
                break;
              }
              case '~': {
                versionSpecType = VersionSpecType.Tilde;
                break;
              }
              case '^': {
                versionSpecType = VersionSpecType.Caret;
                break;
              }
            }
          }
          else {
            versionSpecType = VersionSpecType.Equality;
          }

          const specifiedBsPackage: SpecifiedBsPackage = {
            name: bsPackageName,
            version: bsPackageVersionSpec
          };
          specifiedPackages.push(specifiedBsPackage);
          specifiedPackagesMap[bsPackageName] = specifiedBsPackage;
        }
      }
    }

    const bsPackages: BsPackage[] = [];

    const packageNames: string[] = [];
    // packageNames.push('bpfImporter');
    // packageNames.push('bsPublisher');
    packageNames.push('baconcore');
    packageNames.push('bpfimporter');
    packageNames.push('bspublisher');
    packageNames.push('bs-content-manager');

    packageNames.forEach((packageName) => {

      const packagePath = this.packageBaseDir.concat(packageName);

      // console.log('packageName: ', packageName);
      // console.log('packagePath: ', packagePath);

      shell.cd(packagePath);
      shell.pwd();

      const bsTags: BsTag[] = this.getTags();
      // this.getBranches();

      const bsPackage: BsPackage = {
        name: packageName,
        packageVersionSelector: 'tag',
        selectedTagIndex: 0,
        selectedBranchName: 'master',
        specifiedCommitHash: '',
        tags: bsTags
      };
      bsPackages.push(bsPackage);
      this.props.addPackage(bsPackage);

      // see if there's a tag in the list of tags that match what's in package.json
      const specifiedBsPackage = specifiedPackagesMap[packageName];
      const specifiedBsPackageVersion = specifiedBsPackage.version;

      console.log('bsPackage: ', packageName);
      bsTags.forEach( (tag: BsTag) => {
        const tagName = tag.name;
        const packageVersionForTag = tagName.substr(1);

        if (semver.intersects(specifiedBsPackageVersion, packageVersionForTag)) {
            console.log('Candidate for package ', packageName);
            console.log('tag version: ', packageVersionForTag);
            console.log('package.json version: ', specifiedBsPackageVersion);
        }
        // debugger;
        // const major = semver.major(specifiedBsPackageVersion);
        // const minor = semver.minor(specifiedBsPackageVersion);
        // const patch = semver.patch(specifiedBsPackageVersion);
        // const diff = semver.diff(packageVersionForTag, specifiedBsPackageVersion);
        // use a combination of semver.gte and semver.diff
        // if gte === true and semver.diff === null || 'patch', version can be used
        // think about if multiple meet this criteria. choose the one that is equal?

        // if (semver.gte(packageVersionForTag, specifiedBsPackageVersion) &&
        //   ((diff === null) ||
        //     (diff === 'patch'))) {
        //   console.log('Candidate for package ', packageName);
        //   console.log('tag version: ', packageVersionForTag);
        //   console.log('package.json version: ', specifiedBsPackageVersion);
        // }
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
      });
      // console.log('currentBranch: ', currentBranch);

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

      // console.log('Recent commit messages:');
      // console.log(recentCommits);
      // console.log('');
    });
  }

  getTags() {

    const rawTags: any = shell.exec('git tag');

    const splitTags: string[] = rawTags.split('\n');

    const tags: string[] = [];
    splitTags.forEach((tag) => {
      if (tag !== '') {
        tags.push(tag);
      }
    });

    const bsTags: BsTag[] = [];

    tags.forEach((tag) => {

      // get the commit information for the tag
      // commitLine=$(git show $tag | grep commit)
      const gitShowCmd: string = 'git show ' + tag + ' | grep commit'
      const commitLine: string = shell.exec(gitShowCmd).stdout;
      const commitHash: string = commitLine.split(' ')[1];

      // commitInfo=$(git log -1 $commitHash)
      const gitLogCmd: string = 'git log -1 ' + commitHash;
      const commitInfo: string = shell.exec(gitLogCmd).stdout;

      // console.log('BsTag:', tag);
      // console.log(commitInfo);
      // console.log('');

      bsTags.push( {
        name: tag,
        commit: commitInfo
      });
    });

    return bsTags;
  }

  getBranches() {

    // Future implementation

    // local or remote?
    const rawBranches: any = shell.exec('git branch -a');
    console.log(rawBranches.stdout);

  }

  setPackageVersionSelector(event: any, value: any) {
    const params: string[] = value.split(':');
    this.props.setPackageVersionSelector(params[0], params[1]);
  }

  selectTag(event: any, key: number, payload: any) {
    const params: string[] = payload.split(':');
    this.props.setSelectedTagIndex(params[0], Number(params[1]));
  }

  setBranchName(event: any, newValue: string) {
    const params: string[] = event.target.id.split(':');
    const packageName: string = params[0];
    const branchName: string = newValue;
    this.props.setSelectedBranchName(packageName, branchName);
  }

  setCommitHash(event: any, newValue: string) {
    const params: string[] = event.target.id.split(':');
    const packageName: string = params[0];
    const commitHash: string = newValue;
    this.props.setSpecifiedCommitHash(packageName, commitHash);
  }

  configureButtonClicked() {

    const bsPackagesByPackageName: any = this.props.bsPackages.bsPackagesByPackageName;
    for (const packageName in bsPackagesByPackageName) {
      if (bsPackagesByPackageName.hasOwnProperty(packageName)) {
        const bsPackage: BsPackage = bsPackagesByPackageName[packageName];
        console.log(bsPackage);

        const packagePath = this.packageBaseDir.concat(bsPackage.name);

        let checkoutSpecifier: string = '';

        shell.cd(packagePath);
        shell.pwd();

        const gitFetchOutput: string = shell.exec('git fetch').stdout;
        console.log('gitFetchOutput: ', gitFetchOutput);

        switch (bsPackage.packageVersionSelector) {
          case 'tag': {
            const bsTag: BsTag = bsPackage.tags[bsPackage.selectedTagIndex];
            checkoutSpecifier = bsTag.commit.substr(7, 40);
            console.log('commit: ', checkoutSpecifier);
            break;
          }
          case 'branch': {
            checkoutSpecifier = bsPackage.selectedBranchName;
            console.log('branchName: ', checkoutSpecifier);
            break;
          }
          case 'commit': {
            checkoutSpecifier = bsPackage.specifiedCommitHash;
            console.log('commit: ', checkoutSpecifier);
            break;
          }
        }

        const gitCheckoutOutput: string = shell.exec('git checkout ' + checkoutSpecifier).stdout;
        console.log('gitCheckoutOutput: ', gitFetchOutput);
      }
    }
  }

  buildTagOption(tag: BsTag, bsPackageName: string, tagIndex: number) {

    return (
      <MenuItem key={tag.name} value={bsPackageName + ':' + tagIndex.toString()} primaryText={tag.name}/>
    );
  }

  buildTagOptions(bsPackage: BsPackage) {

    const tagOptions: any[] = [];

    bsPackage.tags.forEach((tag, index) => {
      const tagOption: any = this.buildTagOption(tag, bsPackage.name, index);
      tagOptions.push(tagOption);
    });

    return tagOptions;
  }

  buildPackageRow(bsPackage: BsPackage) {

    console.log('buildPackageRow: ', bsPackage);

    const tagOptions: any = this.buildTagOptions(bsPackage);

    const self: any = this;

    const tagValue = bsPackage.name + ':' + bsPackage.selectedTagIndex.toString();

    return (
      <TableRow key={bsPackage.name}>
        <TableRowColumn>
          {bsPackage.name}
        </TableRowColumn>
        <TableRowColumn>
          <RadioButtonGroup
            name='packageIdType'
            defaultSelected={bsPackage.name + ':tag'}
            onChange={self.setPackageVersionSelector}
          >
            <RadioButton
              value={bsPackage.name + ':tag'}
              label='Tag'
            />
            <RadioButton
              value={bsPackage.name + ':branch'}
              label='Branch'
            />
            <RadioButton
              value={bsPackage.name + ':commit'}
              label='Commit'
            />
          </RadioButtonGroup>
        </TableRowColumn>
        <TableRowColumn>
          <SelectField
            floatingLabelText='Tag'
            value={tagValue}
            onChange={self.selectTag}
          >
            {tagOptions}
          </SelectField>
        </TableRowColumn>
        <TableRowColumn>
          <TextField
            id={bsPackage.name + ':branchName'}
            defaultValue='master'
            onChange={self.setBranchName}
          />
        </TableRowColumn>
        <TableRowColumn>
          <TextField
            id={bsPackage.name + ':commitHash'}
            defaultValue=''
            onChange={self.setCommitHash}
          />
        </TableRowColumn>
      </TableRow>
    );
  }

  buildPackageRows() {

    const bsPackageRows: any = [];

    const bsPackagesByPackageName: any = this.props.bsPackages.bsPackagesByPackageName;
    for (const packageName in bsPackagesByPackageName) {
      if (bsPackagesByPackageName.hasOwnProperty(packageName)) {
        const bsPackage: BsPackage = bsPackagesByPackageName[packageName];
        bsPackageRows.push(this.buildPackageRow(bsPackage));
      }
    }

    return bsPackageRows;
  }

// <TableHeaderColumn>Tag Commit</TableHeaderColumn>
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
                <TableHeaderColumn>Package name</TableHeaderColumn>
                <TableHeaderColumn>Package Version Selector</TableHeaderColumn>
                <TableHeaderColumn>Tags</TableHeaderColumn>
                <TableHeaderColumn>Branch</TableHeaderColumn>
                <TableHeaderColumn>Commit Hash</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody
              displayRowCheckbox={false}
            >
              {bsPackageRows}
            </TableBody>
          </Table>

          <RaisedButton label='Configure' onClick={this.configureButtonClicked}/>
        </div>
      </MuiThemeProvider>
    );
  }
}

function mapStateToProps(state : any) {
  return {
    bsPackages: state.bsPackages,
  };
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => {
  return bindActionCreators({
    addPackage,
    setPackageVersionSelector,
    setSelectedBranchName,
    setSelectedTagIndex,
    setSpecifiedCommitHash,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
