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
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';

import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import Dialog from 'material-ui/Dialog';

import {
  FileInfo,
} from '../interfaces';

import {
  getFileInfo
} from '../utilities';

interface FWFile {
  family: string;
  type: string;
  version: string;
  versionNumber: string;
  link: string;
  sha1: string;
  fileLength: string;
}

interface FWFileLUT {
  [key: string]: FWFile
};

interface AppState {
  manifestFolder: string;
  fileName: string;
  backupManifest: boolean;
  fwFiles: FWFile[];
  writeCompleteDlgOpen: boolean;
}
export default class App extends React.Component<any, object> {

  state: AppState;
  baseFWFiles: FWFile[] = [];
  fwFilesByFamilyVersion: FWFileLUT = {};
  fwFileIndicesToLocate: number[] = [];

  constructor(props: any) {
    super(props);

    this.state = {
      manifestFolder: '/Users/tedshaffer/Documents/BrightAuthor/FirmwareManifest',
      fileName: 'firmwareManifest.json',
      backupManifest: true,
      fwFiles: [],
      writeCompleteDlgOpen: false,
    };

    this.handleManifestFolderChange = this.handleManifestFolderChange.bind(this);
    this.handleFileNameChange = this.handleFileNameChange.bind(this);
    this.handleBackupManifestChange = this.handleBackupManifestChange.bind(this);

    this.handleBrowseForInputFile = this.handleBrowseForInputFile.bind(this);
    this.handleBrowseForOutputFile = this.handleBrowseForOutputFile.bind(this);
    this.handleVersionChange = this.handleVersionChange.bind(this);
    this.handleGenerateManifest = this.handleGenerateManifest.bind(this);
    this.handleCloseWriteCompleteDlg = this.handleCloseWriteCompleteDlg.bind(this);

    this.getFWFiles = this.getFWFiles.bind(this);
  }

  handleCloseWriteCompleteDlg = () => {
    this.setState({ writeCompleteDlgOpen: false });
  };

  getFWFiles(): Promise<void> {

    const numberOfFWFiles = this.fwFileIndicesToLocate.length;

    return new Promise((resolve, reject) => {

      const getNextFWFile = (self: any, fileIndex: number) => {

        if (fileIndex >= numberOfFWFiles) {
          return resolve();
        }

        const fwFileIndex = self.fwFileIndicesToLocate[fileIndex];
        const fwFileToMatch: FWFile = self.state.fwFiles[fwFileIndex];
        const fwFileName = fwFileToMatch.family.toLowerCase() + '-' + fwFileToMatch.version + '-update.bsfw';

        const dialog: any = remote.dialog;
        dialog.showOpenDialog({
          title: 'Locate file ' + fwFileName,
          defaultPath: self.state.manifestFolder,
          message: 'Locate file ' + fwFileName,
          properties: [
            'openFile',
          ]
        }, (selectedPaths: string[]) => {
          if (!isNil(selectedPaths) && selectedPaths.length === 1) {
            const filePath: string = selectedPaths[0];
            getFileInfo(filePath).then((fileInfo: FileInfo) => {

              fwFileToMatch.versionNumber = this.getVersionNumber(fwFileToMatch.version);
              fwFileToMatch.link = 'http://bsnm.s3.amazonaws.com/public/' + fwFileName;
              fwFileToMatch.fileLength = fileInfo.size.toString();;
              fwFileToMatch.sha1 = fileInfo.sha1;

              getNextFWFile(self, fileIndex + 1);
            });
          }
          else {
            debugger;
          }
        });
      };

      getNextFWFile(this, 0);
    });
  }

  getVersionNumber(fwVersion: string): string {

    const splitFWVersion: string[] = fwVersion.split('.');

    const versionNumber: number =
      Number(splitFWVersion[0]) * 65536 +
      Number(splitFWVersion[1]) * 256 +
      Number(splitFWVersion[2]);

    return versionNumber.toString();
  }

  handleGenerateManifest = () => {

    const self = this;

    this.fwFileIndicesToLocate = [];

    // compare baseline against current
    this.state.fwFiles.forEach((fwFile: FWFile, index: number) => {

      // version has changed from baseline
      if (fwFile.version !== self.baseFWFiles[index].version) {

        // does family / version exist elsewhere?
        const fwFileName = fwFile.family.toLowerCase() + '-' + fwFile.version + '-update.bsfw';
        if (!this.fwFilesByFamilyVersion.hasOwnProperty(fwFileName)) {
          // no, add it to the list of fw files that must be added to the manifest
          if (this.fwFileIndicesToLocate.indexOf(index) < 0) {
            this.fwFileIndicesToLocate.push(index);
          }
        }
      }
    });

    if (this.fwFileIndicesToLocate.length > 0) {
      this.getFWFiles().then(() => {
        this.writeFile();
      })
    }
    else {
      this.writeFile();
    }
  }

  writeFile() {

    const self = this;

    // const manifest: any = {
    //   firmwareFile: this.state.fwFiles
    // };

    // const fwFiles = JSON.stringify(manifest, null, 2);
    // fs.writeFile(this.state.outputFile, fwFiles, 'utf8', (err) => {
    //   if (err)  { throw err; };
    //   console.log('write complete');
    //   self.setState({ writeCompleteDlgOpen: true });
    // });
  }

  handleManifestFolderChange = () => {
    const dialog: any = remote.dialog;
    dialog.showOpenDialog({
      defaultPath: this.state.manifestFolder,
      properties: [
        'openDirectory',
      ]
    }, (selectedPaths: string[]) => {
      this.setState({
        manifestFolder: selectedPaths[0],
      });
    });
  }

  handleFileNameChange = (event: any) => {
    this.setState({
      fileName: event.target.value,
    });
  }

  handleBackupManifestChange() {
    this.setState({
      backupManifest: !this.state.backupManifest,
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
        this.setState({ fwFiles: fwFiles.firmwareFile });
        this.baseFWFiles = cloneDeep(fwFiles).firmwareFile;

        // purpose of this data structure is to know if a fw file already exists for a given family and version.
        // if yes, a new fw file does not need to be interrogated. the existing information can be reused.
        this.baseFWFiles.forEach((fwFile) => {
          this.fwFilesByFamilyVersion[fwFile.family + fwFile.version] = fwFile;
        })
      }
    });
  }

  handleBrowseForOutputFile = () => {
    const dialog: any = remote.dialog;
    dialog.showSaveDialog({
      defaultPath: this.state.manifestFolder,
    }, (outputFile: string) => {
      this.setState({
        outputFile,
      });
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
    this.setState({ fwFiles });
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

    const fwFileRows: any[] = this.state.fwFiles.map((fwFile: FWFile, index: number) => {
      return this.buildRow(fwFile, index);
    })

    return fwFileRows;
  }

  renderManifestFolderLocation() {

    const self = this;

    return (
      <div className='container'>
        <span style={{ width: '120px' }}>Manifest folder:</span>
        <TextField
          id={'manifestFolder'}
          value={self.state.manifestFolder}
          onChange={self.handleManifestFolderChange}
          style={{
            width: '800px',
            marginLeft: '10px',
            marginRight: '10px',
          }}
        />
        <RaisedButton label='Browse' onClick={self.handleManifestFolderChange} />
      </div>
    );
  }

  // backup: label, check box
  // fw location: label, text box (with default)

  renderManifestFileName() {

    const self = this;

    return (
      <div className='container'>
        <span style={{ width: '120px' }}>File name:</span>
        <TextField
          id={'manifestFile'}
          value={self.state.fileName}
          onChange={self.handleFileNameChange}
          style={{
            width: '800px',
            marginLeft: '10px',
            marginRight: '10px',
          }}
        />
      </div>
    );
  }

  renderBackupManifest() {

    const self = this;

    const styles = {
      checkbox: {
        marginBottom: 16,
      },
    };
    return (
      <Checkbox
        label='Make copy of manifest file?'
        checked={this.state.backupManifest}
        onCheck={this.handleBackupManifestChange}
        style={styles.checkbox}
      />
    )
  }
  render() {

    const self = this;

    const actions = [
      <FlatButton
        label="OK"
        primary={true}
        onClick={this.handleCloseWriteCompleteDlg}
      />,
    ];

    // const fwRows = this.buildRows();
    return (
      <MuiThemeProvider>
        <div>
          {self.renderManifestFolderLocation()}
          {self.renderManifestFileName()}
          {self.renderBackupManifest()}
        </div>
      </MuiThemeProvider>
    );
  }
}

/*
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

          <div>
            <Dialog
              title="Firmware manifest file saved"
              actions={actions}
              modal={false}
              open={this.state.writeCompleteDlgOpen}
              onRequestClose={this.handleCloseWriteCompleteDlg}
            >
              Firmware manifest file saved
          </Dialog>
          </div>
        </div>
*/
