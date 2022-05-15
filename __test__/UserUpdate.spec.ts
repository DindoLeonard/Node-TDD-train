import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequelize from '../src/config/database';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import config from 'config';

const uploadDir = config.get<string>('uploadDir');
const profileDir = config.get<string>('profileDir');
const profileDirectory = path.join('.', uploadDir, profileDir);

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: true, cascade: true });
});

// clean the upload folder in test environment
// afterAll(() => {
//   //
//   const files = fs.readdirSync(profileDirectory);

//   for (const file of files) {
//     // delete
//     fs.unlinkSync(path.join(profileDirectory, file));
//   }
// });

const activeUser = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const putUser = async (
  id = 5,
  body: null | {
    username?: string | null;
    password?: string | null;
    email?: string | null;
    inactive?: boolean | null;
  } = null,
  options: {
    auth?: {
      email: string;
      password: string;
    };
    token?: string;
  } = {}
) => {
  // JWT AUTHORIZATION - IMPORTANT
  let token: string | undefined;

  if (options.auth) {
    const response = await request(app).post('/api/1.0/auth').send(options.auth);
    token = response.body.token;
  }

  const agent = request(app).put('/api/1.0/users/' + id);

  if (token) {
    agent.set({ Authorization: `Bearer ${token}` });
    // agent.set('Authorization', `Bearer ${token}`);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${token}`);
  }

  return agent.send({ ...body });

  /**
   * BASIC AUTHORIZATION CREATION - IMPORTANT
   */
  // if (options.auth) {
  //   const { email, password } = options.auth;

  //   /**
  //    * MANUAL WAY
  //    */
  //   // const merged = `${email}: ${password}`;
  //   // const base64 = Buffer.from(merged).toString('base64');
  //   // agent.set('Authorization', `Basic ${base64}`);

  //   /**
  //    * SUPERTEST ABSTRACTION
  //    */
  //   agent.auth(email, password);
  // }

  // return agent.send({ ...body });
};

const readFileAsBase64 = () => {
  //
  const filePath = path.join('.', '__test__', 'resources', 'test-png.png');
  const fileInBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

  return fileInBase64;
};

describe('User Update', () => {
  //
  it('returns forbidden when request sent without basic authorization', async () => {
    //
    const response = await putUser();
    expect(response.status).toBe(403);
  });

  it('returns error body with "You are not authorized to update user" for unauthorized request', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const response = await putUser(5, null);

    expect(response.body.path).toBe('/api/1.0/users/5');
    expect(response.body.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(response.body.message).toBe('You are not authorized to update user');
  });

  it('returns forbidden when request sent with incorrect email in basic authorization', async () => {
    //
    await addUser();
    const response = await putUser(5, null, { auth: { email: 'user1000@mail.com', password: 'P4ssword' } });
    expect(response.status).toBe(403);
  });

  it('returns forbidden when request send with incorrect password in basic authorization', async () => {
    //
    await addUser();
    const response = await putUser(5, null, { auth: { email: 'user1@mail.com', password: 'WrongPassword' } });
    expect(response.status).toBe(403);
  });

  it('returns forbidden when update request is sent with correct credentials but for different user', async () => {
    //
    await addUser();

    const userToBeUpdated = await addUser({ ...activeUser, username: 'user2', email: 'user2@mail.com' });

    const response = await putUser(userToBeUpdated.id, null, {
      auth: { email: 'user1@mail.com', password: 'P4ssword' },
    });

    expect(response.status).toBe(403);
  });

  it('returns forbidden when update request is sent by inactive user with correct credentials for its own user', async () => {
    //
    const inactiveUser = await addUser({ ...activeUser, inactive: true });

    const response = await putUser(inactiveUser.id, null, { auth: { email: 'user1@mail.com', password: 'P4ssword' } });

    expect(response.status).toBe(403);
  });

  it('returns 200 ok when valid update request sent from authorized user', async () => {
    //
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated' };
    const response = await putUser(savedUser.id, validUpdate, {
      auth: { email: 'user1@mail.com', password: 'P4ssword' },
    });
    expect(response.status).toBe(200);
  });

  it('updated username in database when valid request request is sent from authorized user', async () => {
    //
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated' };

    await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com', password: 'P4ssword' } });

    const inDBUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDBUser?.username).toBe(validUpdate.username);
  });

  it('returns 403 when token is not valid', async () => {
    const response = await putUser(5, null, { token: '123' });
    expect(response.status).toBe(403);
  });

  it('saves the user image when update contains image as base64', async () => {
    //
    // will return file as string in base64
    const fileInBase64 = readFileAsBase64();

    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated', image: fileInBase64 };

    await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com', password: 'P4ssword' } });

    const inDBUser = await User.findOne({ where: { id: savedUser.id } });

    expect(inDBUser?.image).toBeTruthy();
  });

  it('retuns success body having only id, username, email and image', async () => {
    //
    // will return file as string in base64
    const fileInBase64 = readFileAsBase64();

    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated', image: fileInBase64 };

    const response = await putUser(savedUser.id, validUpdate, {
      auth: { email: 'user1@mail.com', password: 'P4ssword' },
    });

    expect(Object.keys(response.body)).toEqual(['id', 'username', 'email', 'image']);
  });

  it('saves the user image to upload folder and stores filename in user when update has image', async () => {
    //
    const fileInBase64 = readFileAsBase64();
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated', image: fileInBase64 };
    await putUser(savedUser.id, validUpdate, { auth: { email: savedUser.email, password: 'P4ssword' } });

    const inDBUser = await User.findOne({ where: { id: savedUser.id } });

    const profileImagePath = path.join(profileDirectory, inDBUser?.image as string);

    expect(inDBUser).toBeTruthy();
    expect(fs.existsSync(profileImagePath)).toBe(true);
  });

  it('removes the old image after user upload new one', async () => {
    //
    const fileInBase64 = readFileAsBase64();
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated', image: fileInBase64 };

    const response = await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });

    const firstImage = response.body.image;

    // upload second image
    await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });

    // const inDBUser = await User.findOne({ where: { id: savedUser.id } });

    const profileImagePath = path.join(profileDirectory, firstImage);

    expect(fs.existsSync(profileImagePath)).toBe(false);
  });
});
