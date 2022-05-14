import fs from 'fs';
import path from 'path';
import config from 'config';

const createFolders = () => {
  // create folder named "upload-test" or "upload-dev"
  const uploadDir = config.get<string>('uploadDir');
  const profileDir = config.get<string>('profileDir');

  // create if the folder doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const profileFolder = path.join('.', uploadDir, profileDir);
  if (!fs.existsSync(profileFolder)) {
    fs.mkdirSync(profileFolder);
  }
};

export default {
  createFolders,
};
