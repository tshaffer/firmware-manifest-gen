import * as fs from 'fs-extra';
import * as http from 'http';
import * as readDir from 'recursive-readdir';
// const readDir = require('recursive-readdir');

export function getFiles(dir: string) : Promise<any> {
  return new Promise( (resolve, reject) => {

    readDir(dir, (err : any, files : any) => {

      if (err) {
        return reject(err);
      }

      resolve(files);
    });
  });
}

export function mkdir(dirPath: string, ignoreAlreadyExists: boolean = true) {
  return new Promise( (resolve, reject) => {
    fs.mkdir(dirPath, (err: any) => {
      if (!err || (err.code === 'EEXIST' && ignoreAlreadyExists)) {
        resolve();
      }
      else {
        return reject(err);
      }
    });
  });
}

export function remove(filePath: string) {
  return new Promise( (resolve, reject) => {
    fs.remove(filePath, (err: any) => {
      if (err) {
        return reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

export function writeFile(filePath: string, data: string) {
  return new Promise( (resolve, reject) => {
    fs.writeFile( filePath, data, (err: any) => {
      if (err) {
        return reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

export function stat(filePath: string) {
  return new Promise((resolve, reject) => {

    fs.stat(filePath, (err: any, stats: any) => {
      if (err) {
        return reject(err);
      }
      else {
        resolve(stats);
      }
    });
  });
}

export function httpGet(url: string) {
  return new Promise( (resolve, reject) => {
    http.get(url, (res: any) => {

      // consume response body
      res.resume();

      const statusCode = res.statusCode;
      if (statusCode !== 200) {
        return reject(res);
      }
      resolve(res);

    }).on('error', (err: any) => {
      console.log(`httpGet error: ${err.message}`);
      return reject(err);
    });
  });
}

export function copy(src: string, dest: string, options: object) {
  return new Promise( (resolve, reject) => {
    fs.copy(src, dest, options, (err: any) => {
      if (err) {
        return reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

export function overwriteFile(src: string, dest: string) {
  return copy(src, dest, { replace: true });
}

export function exists(path: string) {
  return new Promise( (resolve, reject) => {
    fs.access(path, fs.constants.R_OK | fs.constants.W_OK, (err: any) => {
      if (!err) {
        resolve(true);
      }
      else if (err.code === 'ENOENT') {
        resolve(false);
      }
      else {
        return reject(err);
      }
    });
  });
}
