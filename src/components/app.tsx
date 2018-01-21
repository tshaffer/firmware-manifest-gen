import { isNil } from 'lodash';

import * as React from 'react';

import * as path from 'path';
import isomorphicPath from 'isomorphic-path';

import * as fse from 'fs-extra';
import * as isomorphicFetch from 'isomorphic-fetch';

import * as FormData from 'form-data';

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
      brightSignIpAddress: '192.168.0.104',
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

  httpUploadFile(hostname: string,
                 endpoint: string,
                 filePath: string,
                 uploadHeaders: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = 'http://' + hostname + ':8080' + endpoint; // TODO this should be a global const

      // TODO get headers should be a utility function
      const headers: any = {};
      uploadHeaders.forEach((uploadHeader) => {
        headers[uploadHeader.key] = uploadHeader.value;
      });

      // const fileContentsBuffer: Buffer = fse.readFileSync(filePath);
      // const fileContents: string = fileContentsBuffer.toString();
      // debugger;

      // TODO get formData should be a utility function
      const formData = new FormData();
      formData.append('files', fse.createReadStream(filePath));
      isomorphicFetch(url, {
        method: 'POST',
        headers,
        body: formData
      }).then((response: any) => {
// TODO this should return response.json(). However, there are currently clients of this function
// which make device api calls that respond with empty or non JSON bodies. These calls should be
// handled through a different function.
        resolve(response);
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  getFilesToTransfer(ipAddress: string, filePath: string) : Promise<FileToTransferBs[]> {

    return new Promise((resolve, reject) => {

      this.httpUploadFile(ipAddress, '/GetFilesToTransfer', filePath, []).then((response: any) => {
        return response.json();
      }).then((filesToTransfer: any[]) => {
        resolve(filesToTransfer);
      });
    });
  }

  handleBeginTransfer() {

    console.log('handleBeginTranfer invoked');

    // List<FileToTransfer> filesInSite = GetSiteFiles(siteFolder);
    this.getContentFiles(this.state.contentFolder).then( (contentFiles: FileToTransfer[]) => {
      console.log('File info retrieved');

      // string xmlPath = GenerateFilesInSite(filesInSite);
      this.generateFilesInSite(contentFiles).then( (filePath) => {

        // List<string> relativePathsToTransfer = GetFilesToTransfer(ipAddress, xmlPath);
        this.getFilesToTransfer(this.state.brightSignIpAddress, filePath).then( (filesToTransfer) => {
          debugger;
        });
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
