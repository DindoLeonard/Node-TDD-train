import fs from 'fs';
import path from 'path';
import config from 'config';

const uploadDir = config.get<string>('uploadDir');
const profileDir = config.get<string>('profileDir');
const profileDirectory = path.join('.', uploadDir, profileDir);

const files = fs.readdirSync(profileDirectory);

for (const file of files) {
  // delete
  fs.unlinkSync(path.join(profileDirectory, file));
}
