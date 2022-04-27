import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequelize from '../src/config/database';
import bcrypt from 'bcrypt';

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: true });
});

const activeUser = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const auth = async (
  options: {
    auth?: {
      email: string;
      password: string;
    };
    token?: string;
  } = {}
) => {
  let token: string | undefined;
  if (options.auth) {
    const response = await request(app).post('/api/1.0/auth').send(options.auth);
    token = response.body.token;
  }

  return token;
};

const deleteUser = async (
  id = 5,
  options: {
    auth?: {
      email: string;
      password: string;
    };
    token?: string;
  } = {}
) => {
  const agent = request(app).delete('/api/1.0/users/' + id);

  if (options.token) {
    agent.set({ Authorization: `Bearer ${options.token}` });
  }

  return agent.send();
};

describe('User Delete', () => {
  //
  it('returns forbidden when request sent unauthorized', async () => {
    //
    const response = await deleteUser();
    expect(response.status).toBe(403);
  });

  it('returns error body with "You are not authorized to update user" for unauthorized request', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const response = await deleteUser(5);

    expect(response.body.path).toBe('/api/1.0/users/5');
    expect(response.body.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(response.body.message).toBe('You are not authorized to delete user');
  });

  it('returns forbidden when update request is sent with correct credentials but for different user', async () => {
    //
    await addUser();

    const userToBeDeleted = await addUser({ ...activeUser, username: 'user2', email: 'user2@mail.com' });

    const token = await auth({
      auth: { email: 'user1@mail.com', password: 'P4ssword' },
    });

    const response = await deleteUser(userToBeDeleted.id, { token });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('You are not authorized to delete user');
  });

  it('returns 403 when token is not valid', async () => {
    const response = await deleteUser(5, { token: '123' });

    expect(response.status).toBe(403);
  });

  it('returns 200 ok when valid delete request sent from authorized user', async () => {
    //
    const savedUser = await addUser();
    const token = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } });

    const response = await deleteUser(savedUser.id, { token });

    expect(response.status).toBe(200);
  });

  it('deletes user from database when request sent from authorized user', async () => {
    //
    const savedUser = await addUser();
    const response = await request(app).post('/api/1.0/auth').send({ email: 'user1@mail.com', password: 'P4ssword' });

    const token = response.body.token;

    await deleteUser(savedUser.id, { token });

    const inDbUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDbUser).toBeNull();
  });
});
