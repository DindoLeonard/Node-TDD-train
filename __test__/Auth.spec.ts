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

const addUser = async () => {
  const user = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };
  const saltRounds = 10;
  const hash = await bcrypt.hash(user.password, saltRounds);

  user.password = hash;

  return await User.create(user);
};

const postAuthentication = async (credentials: { email: string; password: string }) => {
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
});
