import { isNil } from 'lodash';

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
  PackageVersionSelectorType,
  RecentCommitData,
  SpecifiedBsPackage,
  // SpecifiedBsPackageMap,
} from '../interfaces';

class App extends React.Component<any, object> {

  packageBaseDir: string = '/Users/tedshaffer/Documents/Projects/bacon-comp/';
  packageNames: string[] = [];

  constructor(props: any){
    super(props);

    // specify packages
    this.packageNames.push('baconcore');
    this.packageNames.push('bpfimporter');
    this.packageNames.push('bspublisher');
    // this.packageNames.push('bsdatamodel');
    // this.packageNames.push('bs-content-manager');

    this.setPackageVersionSelector = this.setPackageVersionSelector.bind(this);
    this.selectTag = this.selectTag.bind(this);
    this.setBranchName = this.setBranchName.bind(this);
    this.setCommitHash = this.setCommitHash.bind(this);
    this.configureButtonClicked = this.configureButtonClicked.bind(this);
  }

  componentDidMount() {

    // get version (version of published name package) of each package as specified in bacon's package.json
    const packageDotJsonVersionsMap: any = this.parseBaconPackageDotJson();

    const bsPackages: BsPackage[] = [];

    this.packageNames.forEach((packageName) => {

      console.log('processing ', packageName);

      const packagePath = this.packageBaseDir.concat(packageName);

      shell.cd(packagePath);
      shell.pwd();

      const bsTags: BsTag[] = this.getTags();

      // this.getBranches();

      const currentVersion = this.getPackageCurrentVersion(bsTags);

      const bsPackage: BsPackage = {
        name: packageName,
        currentVersion,
        packageDotJsonSpecifiedPackage: packageDotJsonVersionsMap[packageName],   //  ever null? (causing a crash?)
        tags: bsTags,
        packageVersionSelector: 'tag',
        selectedTagIndex: 0,
        selectedBranchName: 'master',
        specifiedCommitHash: '',
      };
      bsPackages.push(bsPackage);
      this.props.addPackage(bsPackage);

      // see if there's a tag in the list of tags that match what's in package.json
      const specifiedBsPackage = packageDotJsonVersionsMap[packageName];
      const specifiedBsPackageVersion = specifiedBsPackage.version;

      bsTags.forEach( (tag: BsTag, tagIndex) => {
        const tagName = tag.name;
        const packageVersionForTag = tagName.substr(1);

        if (semver.intersects(specifiedBsPackageVersion, packageVersionForTag)) {

          // if a compatible package has already been found, use the higher numbered package
          if (!isNil(bsPackage.tagIndexForPackageDotJsonPackageVersion)) {
            const tagIndexForPackageDotJsonPackageVersion = bsPackage.tagIndexForPackageDotJsonPackageVersion;
            const tagForPackageDotJsonPackageVersion = bsTags[tagIndexForPackageDotJsonPackageVersion];
            const packageDotJsonPackageVersion = tagForPackageDotJsonPackageVersion.name.substr(1);
            if (semver.gt(packageVersionForTag, packageDotJsonPackageVersion)) {
              bsPackage.tagIndexForPackageDotJsonPackageVersion = tagIndex;
            }
          }
          else {
            bsPackage.tagIndexForPackageDotJsonPackageVersion = tagIndex;
          }
        }
      });

      console.log(bsPackage);

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
      // const numRecentCommits = 3;
      // const recentCommits: RecentCommitData[] = [];
      // for (let i = 0; i < (numRecentCommits - 1); i++) {
      //   const commitMessage = shell.exec('git log -1 --skip=' + i.toString()).stdout;
      //   const commitHash = this.getCommitHashFromCommitMessage(commitMessage);
      //   recentCommits.push( {
      //     commitHash,
      //     commitMessage
      //   });
      // }
    });
  }

  // return the current version of the current package - either the tag name or the commit hash
  getPackageCurrentVersion(bsTags: BsTag[]): string {
    let currentVersion: string = '';
    const commitMessage = shell.exec('git log -1').stdout;
    const commitHash = this.getCommitHashFromCommitMessage(commitMessage);
    bsTags.forEach( (tag, index) => {
      if (tag.commitHash === commitHash) {
        currentVersion = tag.name;
      }
    });
    if (currentVersion === '') {
      currentVersion = commitHash;
    }

    return currentVersion;
  }

  // return a structure mapping a package name to an object that contains
  //    packageName
  //    the version (semver format) specified in package.json
  parseBaconPackageDotJson(): any {
    const packageDotJsonVersionsMap: any = {};
    const baconPackageJsonPath = this.packageBaseDir.concat('bacon/package.json');
    const baconPackageJson = fs.readJsonSync(baconPackageJsonPath);

    for (const dependencyName in baconPackageJson.dependencies) {
      if (baconPackageJson.dependencies.hasOwnProperty(dependencyName)) {
        if (dependencyName.startsWith('@brightsign/')) {

          const bsPackageName: string = dependencyName.substr(12);
          const bsPackageVersionSpec: string = baconPackageJson.dependencies[dependencyName];

          const specifiedBsPackage: SpecifiedBsPackage = {
            name: bsPackageName,
            version: bsPackageVersionSpec
          };
          packageDotJsonVersionsMap[bsPackageName] = specifiedBsPackage;
        }
      }
    }

    return packageDotJsonVersionsMap;
  }

  getCommitHashFromCommitMessage(commitMessage: string) : string {
    return commitMessage.substr(7, 40);
  }

  // get all tags for the active branch
  //    tag name
  //    commitMessage

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

      // get the commitMessage information for the tag
      // commitLine=$(git show $tag | grep commitMessage)
      const gitShowCmd: string = 'git show ' + tag + ' | grep commit'
      const commitLine: string = shell.exec(gitShowCmd).stdout;
      let commitHash: string = commitLine.split(' ')[1];
      if (commitHash.endsWith('\n')) {
        commitHash = commitHash.trim();
      }

      // commitInfo=$(git log -1 $commitHash)
      const gitLogCmd: string = 'git log -1 ' + commitHash;
      const commitInfo: string = shell.exec(gitLogCmd).stdout;

      bsTags.push( {
        name: tag,
        commitMessage: commitInfo,
        commitHash
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
          case PackageVersionSelectorType.Tag: {
            const bsTag: BsTag = bsPackage.tags[bsPackage.selectedTagIndex];
            checkoutSpecifier = this.getCommitHashFromCommitMessage(bsTag.commitMessage);
            console.log('commitMessage: ', checkoutSpecifier);
            break;
          }
          case PackageVersionSelectorType.Branch: {
            checkoutSpecifier = bsPackage.selectedBranchName;
            console.log('branchName: ', checkoutSpecifier);
            break;
          }
          case PackageVersionSelectorType.Commit: {
            checkoutSpecifier = bsPackage.specifiedCommitHash;
            console.log('commitMessage: ', checkoutSpecifier);
            break;
          }
          case PackageVersionSelectorType.PackageDotJsonVersion: {
            const packageVersion = bsPackage.packageDotJsonSpecifiedPackage.version;
            // find the tag, and therefore the commitMessage that corresponds to this version
            // fix me up
            bsPackage.tags.forEach( (bsTag) => {
              if (bsTag.name.substr(1) === packageVersion) {
                checkoutSpecifier = this.getCommitHashFromCommitMessage(bsTag.commitMessage);
                console.log('packageVersionSelector: ', checkoutSpecifier);
              }
            });
            break;
          }
          case PackageVersionSelectorType.NoChange: {
            // no change
          }
          default: {
            debugger;
          }
        }

        if (checkoutSpecifier !== '') {
          const gitCheckoutOutput: string = shell.exec('git checkout ' + checkoutSpecifier).stdout;
          console.log('gitCheckoutOutput: ', gitFetchOutput);
        }
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

  getCompatiblePackageDotJsonVersion(bsPackage: BsPackage): string {

    if (!isNil(bsPackage.tagIndexForPackageDotJsonPackageVersion)) {
      const bsTag = bsPackage.tags[bsPackage.tagIndexForPackageDotJsonPackageVersion];
      return bsTag.name;
    }
    return '';
  }

  buildPackageRow(bsPackage: BsPackage) {

    const tagOptions: any = this.buildTagOptions(bsPackage);

    const self: any = this;

    const tagValue = bsPackage.name + ':' + bsPackage.selectedTagIndex.toString();

    let compatiblePackageDotJsonVersion: string = this.getCompatiblePackageDotJsonVersion(bsPackage);
    const disabled: boolean = compatiblePackageDotJsonVersion === '';
    if (disabled) {
      compatiblePackageDotJsonVersion = 'n/a';
    }

    return (
      <TableRow key={bsPackage.name}>
        <TableRowColumn>
          {bsPackage.name}
        </TableRowColumn>
        <TableRowColumn>
          {bsPackage.currentVersion}
        </TableRowColumn>
        <TableRowColumn>
          {bsPackage.packageDotJsonSpecifiedPackage.version}
        </TableRowColumn>
        <TableRowColumn>
          <RadioButtonGroup
            name='packageIdType'
            defaultSelected={bsPackage.name + ':' + PackageVersionSelectorType.Tag}
            onChange={self.setPackageVersionSelector}
          >
            <RadioButton
              value={bsPackage.name + ':' + PackageVersionSelectorType.NoChange}
              label='Current version'
            />
            <RadioButton
              value={bsPackage.name + ':' + PackageVersionSelectorType.PackageDotJsonVersion}
              label='Package.json version'
              disabled={disabled}
            />
            <RadioButton
              value={bsPackage.name + ':' + PackageVersionSelectorType.Tag}
              label='Tag'
            />
            <RadioButton
              value={bsPackage.name + ':' + PackageVersionSelectorType.Commit}
              label='Commit'
            />
            <RadioButton
              value={bsPackage.name + ':' + PackageVersionSelectorType.Branch}
              label='Branch'
            />
          </RadioButtonGroup>
        </TableRowColumn>
        <TableRowColumn>
          {compatiblePackageDotJsonVersion}
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
            id={bsPackage.name + ':commitHash'}
            defaultValue=''
            onChange={self.setCommitHash}
          />
        </TableRowColumn>
        <TableRowColumn>
          <TextField
            id={bsPackage.name + ':branchName'}
            defaultValue='master'
            onChange={self.setBranchName}
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

          <Table>
            <TableHeader
              displaySelectAll={false}
              adjustForCheckbox={false}
              enableSelectAll={false}
            >
              <TableRow>
                <TableHeaderColumn>Package name</TableHeaderColumn>
                <TableHeaderColumn>Current version</TableHeaderColumn>
                <TableHeaderColumn>Version in bacon's package.json</TableHeaderColumn>
                <TableHeaderColumn>Package Version Selector</TableHeaderColumn>
                <TableHeaderColumn>>= Bacon Package.json</TableHeaderColumn>
                <TableHeaderColumn>Tags</TableHeaderColumn>
                <TableHeaderColumn>Commit Hash</TableHeaderColumn>
                <TableHeaderColumn>Branch</TableHeaderColumn>
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
