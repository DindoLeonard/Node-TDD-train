import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequelize from '../src/config/database';
import bcrypt from 'bcrypt';
import Token from '../src/auth/Token';

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({
    truncate: true,
    cascade: true,
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

const postLogout = async (options: { token?: string } = {}) => {
  const agent = request(app).post('/api/1.0/logout');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }

  return agent.send();
};

describe('Authentication', () => {
  it('returns 200 when credentials are correct', async () => {
    //
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(200);
  });

  it('returns user id, username, image and token when login success', async () => {
    //
    const user = await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });

    expect(response.body.id).toBe(user.id);
    expect(response.body.username).toBe(user.username);
    expect(Object.keys(response.body)).toEqual(['id', 'username', 'image', 'token']);
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

  it('returns token in response body when credentials are correct', async () => {
    //
    await addUser();
    const response = await request(app).post('/api/1.0/auth').send({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(200);
    expect(response.body.token).not.toBeUndefined();
  });
});

describe('Logout', () => {
  it('returns 200 ok when unauthorized request send for logout', async () => {
    //
    const response = await postLogout();
    expect(response.status).toBe(200);
  });

  it('removes the token from the database', async () => {
    await addUser();
    const response = await request(app).post('/api/1.0/auth').send({ email: 'user1@mail.com', password: 'P4ssword' });

    const token = response.body.token;

    await postLogout({ token });

    const storedToken = await Token.findOne({ where: { token } });
    expect(storedToken).toBeNull();
  });
});

describe('Token Expiration', () => {
  //
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
    const agent = request(app).put('/api/1.0/users/' + id);

    if (options.token) {
      agent.set('Authorization', `Bearer ${options.token}`);
    }

    return agent.send({ ...body });
  };

  it('returns 403 when token is older than 1 week', async () => {
    //
    const savedUser = await addUser();
    const token = 'test-token';
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 1); // subtract 1 millisecond at the end

    await Token.create({
      token: token,
      userId: savedUser.id,
      lastUsedAt: oneWeekAgo,
    });

    const validUpdate = { username: 'user1-updated' };

    const response = await putUser(savedUser.id, validUpdate, { token });

    expect(response.status).toBe(403);
  });

  it('refreshes lastUsedAt when unexpired token is used', async () => {
    const savedUser = await addUser();

    const token = 'test-token';

    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 1);

    await Token.create({
      token,
      userId: savedUser.id,
      lastUsedAt: fourDaysAgo,
    });

    const validUpdate = { username: 'user1-updated' };
    const rightBeforeSendingRequest = new Date();

    await putUser(savedUser.id, validUpdate, { token });

    const tokenInDB = await Token.findOne({ where: { token } });

    expect(tokenInDB?.lastUsedAt?.getTime()).toBeGreaterThan(rightBeforeSendingRequest.getTime());
  });

  it('refreshes lastUsedAt when unexpired token is used for unauthenticated endpoint', async () => {
    //
    const savedUser = await addUser();

    const token = 'test-token';
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

    await Token.create({
      token,
      userId: savedUser.id,
      lastUsedAt: fourDaysAgo,
    });

    const rightBeforeSendingRequest = new Date();

    await request(app).get('/api/1.0/users/5').set('Authorization', `Bearer ${token}`);

    const tokenInDB = await Token.findOne({ where: { token } });

    expect(tokenInDB?.lastUsedAt?.getTime()).toBeGreaterThan(rightBeforeSendingRequest.getTime());
  });
});
