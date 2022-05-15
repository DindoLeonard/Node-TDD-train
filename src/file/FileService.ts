import fs from 'fs';
import path from 'path';
import config from 'config';
import generator from '../shared/generator';

const uploadDir = config.get<string>('uploadDir');
const profileDir = config.get<string>('profileDir');
const profileFolder = path.join('.', uploadDir, profileDir);

const createFolders = () => {
  // create folder named "upload-test" or "upload-dev"

  // create if the folder doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  if (!fs.existsSync(profileFolder)) {
    fs.mkdirSync(profileFolder);
  }
};

const saveProfileImage = async (base64File: string) => {
  const filename = generator.randomString(32);
  const filePath = path.join(profileFolder, filename);

  await fs.promises.writeFile(filePath, base64File, 'base64');
  return filename;

  // below is the same as fs.promises.writeFile();
  // return new Promise((resolve, reject) => {
  //   fs.writeFile(filePath, base64File, 'base64', (error) => {
  //     //
  //     if (!error) {
  //       resolve(filename);
  //     } else {
  //       reject();
  //     }
  //   });
  // });

  // return filename;
};

const deleteProfileImage = async (filename: string) => {
  //
  const filePath = path.join(profileFolder, filename);
  await fs.promises.unlink(filePath);
};

export default {
  createFolders,
  saveProfileImage,
  deleteProfileImage,
};
