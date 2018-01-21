import * as fs from 'fs-extra';
import * as crypto from 'crypto';

import * as string_decoder from 'string_decoder';
const decoder = new string_decoder.StringDecoder('utf8');

import { FileInfo } from './interfaces';

export function getFileInfo(filePath: string): Promise<FileInfo> {

  let fileSize = 0;

  return new Promise((resolve) => {
    const hash = crypto.createHash('sha1');
    const input = fs.createReadStream(filePath);
    input.on('readable', () => {
      const data = input.read();
      if (data) {
        hash.update(data);
        fileSize += data.length;
      }
      else {
        const sha1 = hash.digest('hex');
        const fileInfo: FileInfo = {
          filePath,
          sha1,
          size: fileSize
        };
        resolve( fileInfo );
      }
    });
    input.on('error', (err : any) => {
      console.log('getFileInfo error: ', err);
    });
  });
}
