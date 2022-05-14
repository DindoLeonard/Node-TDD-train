import FileService from '../src/file/FileService';
import fs from 'fs';
import path from 'path';
import config from 'config';

const uploadDir = config.get<string>('uploadDir');
const profileDir = config.get<string>('profileDir');

describe('createFolders', () => {
  //
  it('creates upload folder', () => {
    // check if folder exist with fs.existsSync
    FileService.createFolders();

    // fs.existsSync will return either true or false
    expect(fs.existsSync(uploadDir)).toBe(true);
  });

  it('creates profile folder under upload folder', () => {
    FileService.createFolders();
    const profileFolder = path.join('.', uploadDir, profileDir);

    expect(fs.existsSync(profileFolder)).toBe(true);
  });
});
