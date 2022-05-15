import request from 'supertest';
import app from '../src/app';
import fs from 'fs';
import path from 'path';
import config from 'config';

const uploadDir = config.get<string>('uploadDir');
const profileDir = config.get<string>('profileDir');

const profileFolder = path.join('.', uploadDir, profileDir);

describe('Profile Images', () => {
  //
  const copyFile = () => {
    const filePath = path.join('.', '__test__', 'resources', 'test-png.png');
    const storedFileName = 'test-file';
    const targetPath = path.join(profileFolder, storedFileName);

    fs.copyFileSync(filePath, targetPath);

    return storedFileName;
  };

  it('retun 404 when file not found', async () => {
    //
    const response = await request(app).get('/images/123456');
    expect(response.status).toBe(404);
  });

  it('returns 200 when file exist', async () => {
    //
    const storedFileName = copyFile();

    const response = await request(app).get(`/images/${storedFileName}`);
    expect(response.status).toBe(200);
  });

  it('retuns cache for 1 year in response', async () => {
    //
    const storedFileName = copyFile();

    const response = await request(app).get(`/images/${storedFileName}`);
    const oneYearInSeconds = 365 * 24 * 60 * 60;
    expect(response.header['cache-control']).toContain(`max-age=${oneYearInSeconds}`);
  });
});
