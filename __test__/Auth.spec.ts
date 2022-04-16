import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequelize from '../src/config/database';
import bcrypt from 'bcrypt';

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({
    truncate: true,
  });
});

const activeUser = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };

const addUser = async (
  user: { username: string; email: string; password: string; inactive: boolean } = { ...activeUser }
) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(user.password, saltRounds);

  user.password = hash;

  return await User.create(user);
};

const postAuthentication = async (credentials: { email?: string; password?: string }) => {
  return await request(app).post('/api/1.0/auth').send(credentials);
};

describe('Authentication', () => {
  it('returns 200 when credentials are correct', async () => {
    //
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(200);
  });

  it('returns only user id and username when login success', async () => {
    //
    const user = await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });

    expect(response.body.id).toBe(user.id);
    expect(response.body.username).toBe(user.username);
    expect(Object.keys(response.body)).toEqual(['id', 'username']);
  });

  it('retuns 401 when user does not exist', async () => {
    //
    const response = await postAuthentication({ email: 'user 1', password: 'P4ssword' });
    expect(response.status).toBe(401);
  });

  it('returns proper error body when authentication failed', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const error = response.body;

    expect(error.path).toBe('/api/1.0/auth');
    expect(error.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it('returns Incorrect credentials when authentication fails and language is set as english', async () => {
    const response = await postAuthentication({ email: 'user1', password: 'P4ssword' });
    expect(response.body.message).toBe('Incorrect credentials');
  });

  it('returns 401 when password is wrong', async () => {
    //
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'wrongpassword' });
    expect(response.status).toBe(401);
  });

  it('returns 403 when logging in with an inactive account', async () => {
    //
    await addUser({ ...activeUser, inactive: true });
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(403);
  });

  it('returns proper error body when inactive authentication fails', async () => {
    //
    await addUser({ ...activeUser, inactive: true });
    const nowInMilliseconds = new Date().getTime();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const error = response.body;

    expect(error.path).toBe('/api/1.0/auth');
    expect(error.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it('returns Account is inactive when authenticaton fails for inactive account', async () => {
    await addUser({ ...activeUser, inactive: true });
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.body.message).toBe('Account is inactive');
  });

  it('returns 401 when e-mail is not valid', async () => {
    //
    const response = await postAuthentication({ password: 'P4ssword' });
    expect(response.status).toBe(401);
  });

  it('retuns 401 when password in not valid', async () => {
    //
    const response = await postAuthentication({ email: 'user1@mail.com' });
    expect(response.status).toBe(401);
  });
});
