import { isNil } from 'lodash';

import * as React from 'react';

import * as fs from 'fs-extra';


import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import MenuItem from 'material-ui/MenuItem';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import RaisedButton from 'material-ui/RaisedButton';
import SelectField from 'material-ui/SelectField';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import TextField from 'material-ui/TextField';


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

  constructor(props: any){
    super(props);

    this.handleBeginTransfer = this.handleBeginTransfer.bind(this);
  }

  handleBeginTransfer() {
    console.log('handleBeginTranfer invoked');
  }

  render() {
    return (
      <MuiThemeProvider>
        <div>
          <div>
            Content folder:
            <TextField
              id={'contentFolder'}
              defaultValue=''
            />
          </div>
          <div>
            BrightSign IP Address:
            <TextField
              id={'brightSignIPAddress'}
              defaultValue=''
            />
          </div>
          <div>
            <RaisedButton label='Begin Transfer' onClick={this.handleBeginTransfer}/>
          </div>
          <div>
            <TextField
              id='statusArea'
              value={'flibbet\nflubbet\nline3\nline4\nline5'}
              multiLine={true}
              rows={2}
              rowsMax={4}
            /><br />
            <br />
          </div>
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
