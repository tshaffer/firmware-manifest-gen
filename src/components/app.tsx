import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as React from 'react';

import * as path from 'path';
import isomorphicPath from 'isomorphic-path';

import * as recursive from 'recursive-readdir';

// https://v0.material-ui.com/#/
// https://v0.material-ui.com/#/components/dialog
// https://material-ui.com/api/list-item/
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';

import * as nodeWrappers from '../nodeWrappers';

import {
  FileInfo,
  FileToTransfer,
  FileToTransferBs,
} from '../interfaces';

import {
  getFileInfo,
  httpUploadFile,
} from '../utilities';

export default class App extends React.Component<any, object> {

  state: any;

  constructor(props: any) {
    super(props);

    this.state = {
      manifestFolder: '/Users/tedshaffer/Documents/BrightAuthor/CloudData',
      inputFile: '',
      outputFile: '',
    };

    this.handleBrowseForInputFile = this.handleBrowseForInputFile.bind(this);
    this.handleBrowseForOutputFile = this.handleBrowseForOutputFile.bind(this);
  }

  setStatus(status: string) {
    this.setState({
      status,
    });
  }

  handleBrowseForInputFile = () => {
    const dialog: any = remote.dialog;
    dialog.showOpenDialog({
      defaultPath: this.state.manifestFolder,
      properties: [
        'openFile',
      ]
    }, (selectedPaths: string[]) => {
      if (!isNil(selectedPaths) && selectedPaths.length === 1) {
        this.setState({
          manifestFolder: path.dirname(selectedPaths[0]),
          inputFile: selectedPaths[0],
        });
      }
    });
  }

  handleBrowseForOutputFile = () => {
    const dialog: any = remote.dialog;
    dialog.showSaveDialog({
      defaultPath: this.state.manifestFolder,
    }, (fileName: string) => {
      console.log(fileName);
    });
  }

  handleInputFileChange = (event: any) => {
    this.setState({
      inputFile: event.target.value,
    });
  }

  handleOutputFileChange = (event: any) => {
    this.setState({
      outputFile: event.target.value,
    });
  }

  buildRows = (): any => {
    return null;
  }

  render() {

    const self = this;

    const fwRows = this.buildRows();
    return (
      <MuiThemeProvider>
        <div>
          <div className="container">
            <span style={{ width: '80px' }}>Input file:</span>
            <TextField
              id={'inputFile'}
              value={self.state.inputFile}
              onChange={self.handleInputFileChange}
              style={{
                width: '800px',
                marginLeft: '10px',
                marginRight: '10px',
              }}
            />
            <RaisedButton label='Browse' onClick={self.handleBrowseForInputFile} />
          </div>
          <div className="container">
            <span style={{ width: '80px' }}>Output file:</span>
            <TextField
              id={'outputFile'}
              value={self.state.outputFile}
              onChange={self.handleOutputFileChange}
              style={{
                width: '800px',
                marginLeft: '10px',
                marginRight: '10px',
              }}
            />
            <RaisedButton label='Browse' onClick={self.handleBrowseForOutputFile} />
          </div>
          <Table>
            <TableHeader
              displaySelectAll={false}
              adjustForCheckbox={false}
              enableSelectAll={false}
            >
              <TableRow>
                <TableHeaderColumn>Family</TableHeaderColumn>
                <TableHeaderColumn>Type</TableHeaderColumn>
                <TableHeaderColumn>Version</TableHeaderColumn>
              </TableRow>

            </TableHeader>
            <TableBody
              displayRowCheckbox={false}
            >
              {fwRows}
            </TableBody>
          </Table>
        </div>
      </MuiThemeProvider>
    );
  }
}
