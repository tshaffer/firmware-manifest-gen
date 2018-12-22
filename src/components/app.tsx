import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as React from 'react';

import * as path from 'path';
import * as fs from 'fs';

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

interface FWFile {
  family: string;
  fileLength: string;
  sha1: string;
  type: string;
  version: number;
  versionNumber: string;
}

export default class App extends React.Component<any, object> {

  state: any;

  constructor(props: any) {
    super(props);

    this.state = {
      manifestFolder: '/Users/tedshaffer/Documents/BrightAuthor/CloudData',
      inputFile: '',
      outputFile: '',
      fwFiles: [],
    };

    this.handleBrowseForInputFile = this.handleBrowseForInputFile.bind(this);
    this.handleBrowseForOutputFile = this.handleBrowseForOutputFile.bind(this);
    this.handleVersionChange = this.handleVersionChange.bind(this);
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
        const inputFile: string = selectedPaths[0];
        this.setState({
          manifestFolder: path.dirname(selectedPaths[0]),
          inputFile,
        });

        const contents = fs.readFileSync(inputFile);
        const fwFiles = JSON.parse(contents.toString());
        this.setState({fwFiles: fwFiles.firmwareFile});
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

  handleVersionChange = (row: any, event: any, value: any) => {
    const fwFiles: FWFile[] = this.state.fwFiles;
    const fwFile: FWFile = fwFiles[row];
    fwFile.version = value;
    this.setState({fwFiles});
  }

  buildRow = (fwFile: FWFile, index: number) => {

    const version: string = this.state.fwFiles[index].version;

    return (
      <TableRow key={index}>
        <TableRowColumn>
          {fwFile.family}
        </TableRowColumn>
        <TableRowColumn>
          {fwFile.type}
        </TableRowColumn>
        <TableRowColumn>
          <TextField
            id={index.toString()}
            key={index}
            value={version}
            onChange={this.handleVersionChange.bind(this, index)}
          />
        </TableRowColumn>
      </TableRow>
    );
  }

  buildRows = (): any => {

    const fwFileRows: any[] = this.state.fwFiles.map( (fwFile: FWFile, index: number) => {
      return this.buildRow(fwFile, index);
    })

    return fwFileRows;
  }

  render() {

    console.log(this.state.fwFiles);
    
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
