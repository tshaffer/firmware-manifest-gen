import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as React from 'react';

import * as path from 'path';
import isomorphicPath from 'isomorphic-path';

import * as recursive from 'recursive-readdir';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

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

  constructor(props: any){
    super(props);

    this.state = {
      manifestFolder: '/Users/tedshaffer/Documents/BrightAuthor/CloudData',
      inputFile: '',
      outputFile: '',
      contentFolder: '/Users/tedshaffer/Desktop/aa',
      brightSignIpAddress: '192.168.0.104',
      status: '',
    };

    this.handleBrowse = this.handleBrowse.bind(this);
    this.handleContentFolderChange = this.handleContentFolderChange.bind(this);
    this.handleBrightSignIpAddressChange = this.handleBrightSignIpAddressChange.bind(this);
    this.handleBeginTransfer = this.handleBeginTransfer.bind(this);
  }

  setStatus(status: string) {
    this.setState({
      status,
    });
  }

  appendStatus(statusToAppend: string) {
    let xferStatus: string = this.state.status;
    xferStatus += '\n' + statusToAppend;
    this.setStatus(xferStatus);
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

  handleBrowse = () => {

    const dialog: any = remote.dialog;
    dialog.showOpenDialog({
      defaultPath: '/Users/tedshaffer/Desktop/aa',
      properties: [
        'openDirectory',
      ]
    }, (selectedPaths: string[]) => {
      if (!isNil(selectedPaths) && selectedPaths.length === 1) {
        this.setState({
          contentFolder: selectedPaths[0]
        });
      }
    });
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

        // TODO - check err
        // `files` is an array of absolute file paths

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

  getFilesToTransfer(ipAddress: string, filePath: string) : Promise<FileToTransferBs[]> {

    return new Promise((resolve, reject) => {

      httpUploadFile(ipAddress, '/GetFilesToTransfer', filePath, []).then((response: any) => {
        return response.json();
      }).then((filesToTransfer: FileToTransferBs[]) => {
        resolve(filesToTransfer);
      });
    });
  }

  uploadFileToBrightSign(sourcePath: string, destinationRelativePath: string, ipAddress: string): Promise<any> {

    const endPoint = '/UploadFile';

    const headers = [];
    const header: any = {};
    header.key = 'Destination-Filename';
    header.value = destinationRelativePath;
    headers.push(header);

    return httpUploadFile(ipAddress, endPoint, sourcePath, headers);
  }

  transferFiles(siteFolder: string, filesToTransfer: FileToTransferBs[], ipAddress: string) {

    filesToTransfer.forEach( (fileToTransfer) => {
      const relativePathToTransfer = fileToTransfer.relativepath;
      this.appendStatus(relativePathToTransfer);
      const fullPath = isomorphicPath.join(siteFolder, relativePathToTransfer);
      const promise: any = this.uploadFileToBrightSign(fullPath, relativePathToTransfer, ipAddress);
    });
  }

  handleBeginTransfer() {

    this.getContentFiles(this.state.contentFolder).then( (contentFiles: FileToTransfer[]) => {

      this.generateFilesInSite(contentFiles).then( (filePath) => {

        this.getFilesToTransfer(this.state.brightSignIpAddress, filePath).then( (filesToTransfer) => {

          if (!isNil(filesToTransfer) && filesToTransfer.length > 0) {
            this.setStatus('Copying files to ' + this.state.brightSignIpAddress)
            this.transferFiles(this.state.contentFolder, filesToTransfer, this.state.brightSignIpAddress);
            this.appendStatus('File transfer complete');
          }
          else {
            this.setStatus('No files to transfer. Storage up to date');
          }
        });
      });
    });
  }

  render() {

    const self = this;

    return (
      <MuiThemeProvider>
        <div>
          <div className="container">
            <span style={{width: '80px'}}>Input file:</span>
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
            <RaisedButton label='Browse' onClick={self.handleBrowseForInputFile}/>
          </div>
          <div className="container">
            <span style={{width: '80px'}}>Output file:</span>
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
            <RaisedButton label='Browse' onClick={self.handleBrowseForOutputFile}/>
          </div>
          <div>
            <RaisedButton label='Begin Transfer' onClick={self.handleBeginTransfer}/>
          </div>
          <div>
            <TextField
              id='statusArea'
              multiLine={true}
              rows={24}
              rowsMax={24}
              value={this.state.status}
              style={{
                width: '700px',
              }}
            /><br />
            <br />
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}
