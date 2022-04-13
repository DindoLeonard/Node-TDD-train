import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequelize from '../src/config/database';

// creating all database before all test
beforeAll(async () => {
  await sequelize.sync();
});

// clearing the user table before each test
beforeEach(() => {
  return User.destroy({ truncate: true });
});

const getUsers = () => {
  return request(app).get('/api/1.0/users');
};

const addUsers = async (activeUserCount: number, inactiveUserCount = 0) => {
  for (let i = 0; i < activeUserCount + (inactiveUserCount || 0); i += 1) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      password: 'P4ssword',
      inactive: i >= activeUserCount,
    });
  }
};

describe('Listing Users', () => {
  //
  it('returns 200 ok if there are no users in the database', async () => {
    //
    const response = await request(app).get('/api/1.0/users');
    expect(response.status).toBe(200);
  });

  it('returns page object as response body', async () => {
    //
    const response = await request(app).get('/api/1.0/users');

    expect(response.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });

  it('returns 10 users in page content when there are 11 users in database', async () => {
    //
    await addUsers(11);

    const response = await getUsers();

    expect(response.body.content.length).toBe(10);
  });

  it('returns 6 users in page content when there are active 6 users and 5 inactive users in database', async () => {
    //
    await addUsers(6, 5);
    const response = await getUsers();
    expect(response.body.content.length).toBe(6);
  });

  it('returns only id, username and email in content array for each user', async () => {
    //
    await addUsers(11);
    const response = await request(app).get('/api/1.0/users');

    const user = response.body.content[0];
    expect(Object.keys(user)).toEqual(['id', 'username', 'email']);
  });

  it('returns 2 as totalPages when there are 15 active and 7 inactive users', async () => {
    await addUsers(15, 7);
    const response = await getUsers();

    expect(response.body.totalPages).toBe(2);
  });

  it('returns second page users and page indicator when page is set as 1 in request parameter', async () => {
    //
    await addUsers(11);
    const response = await request(app).get('/api/1.0/users').query({
      page: 1,
    });
    // await request(app).get('/api/1.0/users?page=1);

    expect(response.body.content[0].username).toBe('user11');
    expect(response.body.page).toBe(1);
  });

  it('returns first page when page is set below zero as request parameter', async () => {
    //
    await addUsers(15);
    const response = await getUsers().query({ page: -5 });

    expect(response.body.page).toBe(0);
  });

  it('returns 5 users and corresponding size indicator when size is set as 5 in request paramter', async () => {
    //
    await addUsers(11);
    const response = await request(app).get('/api/1.0/users').query({ size: 5 });

    expect(response.body.content.length).toBe(5);
    expect(response.body.size).toBe(5);
  });

  it('returns 10 users and corresponding size indicator when size is set as 1000', async () => {
    //
    await addUsers(11);
    const response = await request(app).get('/api/1.0/users').query({ size: 1000 });
    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });

  it('returns 10 users and corresponding size indicator when size is set as 0', async () => {
    //
    await addUsers(11);
    const response = await request(app).get('/api/1.0/users').query({ size: 0 });

    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });

  it('returns page as zero and size is 10 when non  numberic query parameters provided for both', async () => {
    await addUsers(11);
    const response = await request(app).get('/api/1.0/users').query({
      size: 'size',
      page: 'page',
    });

    expect(response.body.size).toBe(10);
    expect(response.body.page).toBe(0);
  });
});

describe('Get User', () => {
  //
  const getUser = async (id = 5) => {
    return request(app).get('/api/1.0/users/' + id);
  };

  it('returns 404 when user not found', async () => {
    const response = await request(app).get('/api/1.0/users/5');
    expect(response.status).toBe(404);
  });

  it('returns User not found for unknown user', async () => {
    //

    const response = await request(app).get('/api/1.0/users/5');
    expect(response.body.message).toBe('User not found');
  });

  it('returns proper error body when user not found', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const response = await request(app).get('/api/1.0/users/5');
    const error = response.body;

    expect(error.path).toBe('/api/1.0/users/5');
    expect(error.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it('returns 200 when an active user exists', async () => {
    const user = await User.create({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: false,
    });

    const response = await getUser(user.id);

    expect(response.status).toBe(200);
  });

  it('returns id, username, and email in response body when an active user exist', async () => {
    //
    const user = await User.create({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: false,
    });

    const response = await getUser(user.id);
    expect(Object.keys(response.body)).toEqual(['id', 'username', 'email']);
  });

  it('returns 404 when the user is inactive', async () => {
    //
    const user = await User.create({
      username: 'user1',
      email: 'use1@mail.com',
      password: 'P4ssword',
      inactive: true,
    });

    const response = await getUser(user.id);
    expect(response.status).toBe(404);
  });
});
