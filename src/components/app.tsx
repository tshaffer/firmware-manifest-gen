import {
  remote,
} from 'electron';

import { cloneDeep, isNil } from 'lodash';

import * as React from 'react';

import * as path from 'path';
import * as fs from 'fs';

// https://stackoverflow.com/questions/15877362/declare-and-initialize-a-dictionary-in-typescript

// https://v0.material-ui.com/#/
// https://v0.material-ui.com/#/components/dialog
// https://material-ui.com/api/list-item/
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';

import {
  FileInfo,
} from '../interfaces';

import {
  getFileInfo
} from '../utilities';

interface FWFile {
  family: string;
  fileLength: string;
  sha1: string;
  type: string;
  version: number;
  versionNumber: string;
}

interface FWFileLUT {
  [key: string]: FWFile
};

export default class App extends React.Component<any, object> {

  state: any;
  baseFWFiles: FWFile[] = [];
  fwFilesByFamilyVersion: FWFileLUT = {};
  fwFilesToLocate: string[] = [];


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
    this.handleGenerateManifest = this.handleGenerateManifest.bind(this);
  }

  getFWFiles(): Promise<void> {

    let numberOfFWFiles = this.fwFilesToLocate.length;

    const getNextFWFile = (fileIndex: number): Promise<void> => {

      return new Promise((resolve, reject) => {
        const dialog: any = remote.dialog;
        dialog.showOpenDialog({
          defaultPath: this.state.manifestFolder,
          properties: [
            'openFile',
          ]
        }, (selectedPaths: string[]) => {
          if (!isNil(selectedPaths) && selectedPaths.length === 1) {
            const inputFile: string = selectedPaths[0];
            console.log(inputFile);
            fileIndex++;
            if (fileIndex >= numberOfFWFiles) {
              // return Promise.resolve();
              return resolve();
            }
            else {
              return getNextFWFile(fileIndex);
            }
          }
        });
      });
    }

    return getNextFWFile(0).then( () => {
      // return;
      return Promise.resolve();
    });

  }

  handleGenerateManifest = () => {

    let manifestDirty = false;

    const self = this;

    this.fwFilesToLocate = [];

    // compare baseline against current
    this.state.fwFiles.forEach( (fwFile: FWFile, index: number) => {
      
      // version has changed from baseline
      if (fwFile.version !== self.baseFWFiles[index].version) {
        
        console.log('entry at: ', index, ' changed');
        manifestDirty = true;

        // does family / version exist elsewhere?
        const fwFileName = fwFile.family.toLowerCase() + '-' + fwFile.version + '-update.bsfw';
        if (!this.fwFilesByFamilyVersion.hasOwnProperty(fwFileName)) {
          // no, add it to the list of fw files that must be added to the manifest
          if (this.fwFilesToLocate.indexOf(fwFileName) < 0) {
            this.fwFilesToLocate.push(fwFileName);
          }
        }
      }
    });

    console.log(this.fwFilesToLocate);

    if (this.fwFilesToLocate.length > 0) {
      this.getFWFiles().then( () => {
        console.log('all files found - update and write');
      })
    }

    const manifest: any = {
      firmwareFile: this.state.fwFiles
    };

    // const fwFiles = JSON.stringify(manifest, null, 2);
    // const manifestPath = path.join(this.state.manifestFolder, 'FirmwareManifestOut.json');

    // const fwPath = '/Users/tedshaffer/Documents/BrightAuthor/CloudData/FirmwareGen2-12-17-2018/pagani-8.0.6.6-update.bsfw';
    // getFileInfo(fwPath).then( (fileInfo: FileInfo) => {
    //   console.log(fileInfo);
    //   fs.writeFile(manifestPath, fwFiles, 'utf8', function(err) {
    //     if (err) throw err;
    //     console.log('write complete');
    //   });
    // })
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
        this.baseFWFiles = cloneDeep(fwFiles).firmwareFile;

        // purpose of this data structure is to know if a fw file already exists for a given family and version.
        // if yes, a new fw file does not need to be interrogated. the existing information can be reused.
        this.baseFWFiles.forEach( (fwFile) => {
          this.fwFilesByFamilyVersion[fwFile.family + fwFile.version] = fwFile;
        })
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
          <RaisedButton label='Generate Manifest' onClick={self.handleGenerateManifest} />

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
