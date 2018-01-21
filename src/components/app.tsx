import { isNil } from 'lodash';

import * as React from 'react';

import * as path from 'path';
import isomorphicPath from 'isomorphic-path';
import * as fs from 'fs-extra';

import * as recursive from 'recursive-readdir';

import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import MenuItem from 'material-ui/MenuItem';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import RaisedButton from 'material-ui/RaisedButton';
import SelectField from 'material-ui/SelectField';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import TextField from 'material-ui/TextField';

import * as nodeWrappers from '../nodeWrappers';

import {
  FileInfo,
  FileToTransfer,
} from '../interfaces';

import {
  getFileInfo
} from '../utilities';

class App extends React.Component<any, object> {

  state: any;

  constructor(props: any){
    super(props);

    this.state = {
      contentFolder: '/Users/tedshaffer/Desktop/aa',
      brightSignIpAddress: '',
      status: '',
    };

    this.handleContentFolderChange = this.handleContentFolderChange.bind(this);
    this.handleBrightSignIpAddressChange = this.handleBrightSignIpAddressChange.bind(this);
    this.handleBeginTransfer = this.handleBeginTransfer.bind(this);
  }

  handleContentFolderChange = (event: any) => {
    this.setState({
      contentFolder: event.target.value,
    });
  }

  handleBrightSignIpAddressChange = (event: any) => {
    this.setState({
      brightSignIpAddress: event.target.value,
    });
  }

  getContentFiles(contentFolder: string) : Promise<FileToTransfer[]> {

    return new Promise( (resolve, reject) => {
      const promises: any[] = [];

      recursive(contentFolder,  (err: Error, files: string[]) => {

        // `files` is an array of absolute file paths
        console.log(err);
        console.log(files);

        files.forEach( (fullPath) => {
          promises.push(getFileInfo(fullPath));
        });

        const filesToTransfer: FileToTransfer[] = [];

        Promise.all(promises).then( (filesInfo: FileInfo[]) => {
          filesInfo.forEach( (fileInfo: FileInfo) => {
            const filePath: string = fileInfo.filePath;
            const fileName: string = path.basename(fileInfo.filePath);
            const relativePath: string = fileInfo.filePath.substr(this.state.contentFolder.length + 1);

            const fileToTransfer: FileToTransfer = {
              name: fileName,
              relativePath,
              size: fileInfo.size,
              sha1: fileInfo.sha1
            };

            filesToTransfer.push(fileToTransfer);
          });

          resolve(filesToTransfer);
        });

      });

    });
  }

  generateFilesInSite(filesToTransfer: FileToTransfer[]) : Promise<string> {

    return new Promise((resolve, reject) => {

      const tmpDir = '//Users/tedshaffer/Documents/Projects/contentSynchronizer/tmp';
      const filePath = isomorphicPath.join(tmpDir, 'listOfFiles.json');

      const listOfFiles : any = {};
      listOfFiles.file = [];

      filesToTransfer.forEach( (fileToTransfer) => {

        const file: any = {};
        file.fileName = fileToTransfer.name;
        file.filePath = fileToTransfer.relativePath;
        file.hashValue = fileToTransfer.sha1;
        file.fileSize = fileToTransfer.size;

        listOfFiles.file.push(file);
      });

      const listOfFilesStr = JSON.stringify(listOfFiles, null, '\t');
      nodeWrappers.writeFile(filePath, listOfFilesStr).then(() => {
        console.log('listOfFiles.json successfully written');
        resolve(filePath);
      }).catch( (err: Error) => {
        reject(err);
      });
    });
  }

  handleBeginTransfer() {
    console.log('handleBeginTranfer invoked');

    // List<FileToTransfer> filesInSite = GetSiteFiles(siteFolder);
    this.getContentFiles(this.state.contentFolder).then( (filesToTransfer: FileToTransfer[]) => {
      console.log('File info retrieved');

      // string xmlPath = GenerateFilesInSite(filesInSite);
      this.generateFilesInSite(filesToTransfer).then( (filePath) => {
        // List<string> relativePathsToTransfer = GetFilesToTransfer(ipAddress, xmlPath);
        debugger;
      });
    });
  }

  render() {

    const self = this;

    return (
      <MuiThemeProvider>
        <div>
          <div>
            Content folder:
            <TextField
              id={'contentFolder'}
              value={self.state.contentFolder}
              onChange={self.handleContentFolderChange}
            />
          </div>
          <div>
            BrightSign IP Address:
            <TextField
              id={'brightSignIpAddress'}
              value={this.state.brightSignIpAddress}
              onChange={this.handleBrightSignIpAddressChange}
            />
          </div>
          <div>
            <RaisedButton label='Begin Transfer' onClick={self.handleBeginTransfer}/>
          </div>
          <div>
            <TextField
              id='statusArea'
              multiLine={true}
              rows={12}
              rowsMax={12}
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
  };
}

export default connect(mapStateToProps)(App);
