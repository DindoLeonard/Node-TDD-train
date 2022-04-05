import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequalize from '../src/config/database';

beforeAll(() => {
  return sequalize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

const postUser = (user: { username?: string | null; email?: string | null; password?: string | null } = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('User Registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();

    expect(response.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('saves the user to the database', async () => {
    await postUser();

    const userList = await User.findAll();
    expect(userList.length).toBe(1);

    // .expect(200, done);
  });

  it('saves the username and email to database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];

    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  // PASSWORD HASH
  it('hashes the password in database', async () => {
    //
    await postUser();

    const userList = await User.findAll();
    const savedUser = userList[0];

    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });

    expect(response.status).toBe(400);
  });

  // VALIDATION ERRORS
  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({ username: null, email: 'user1@mail.com', password: 'P4ssword' });

    const body = response.body;

    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });

    const body = response.body;

    // order is important
    // must use string for object keys or else it will prioritize the number keys first then the string afterwards
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  // IMPORTANT DYNAMIC TEST
  // it.each([
  //   ['username', 'Username cannot be null'],
  //   ['email', 'E-mail cannot be null'],
  //   ['password', 'Password cannot be null'],
  // ])('when %s is null %s is received', async (field, expectedMessage) => {
  //   const user: { [key: string]: string | null } = {
  //     username: 'user1',
  //     email: 'user1@mail.com',
  //     password: 'P4ssword',
  //   } as { username?: string; email?: string | null; password?: string | null };

  //   user[field] = null;

  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors[field]).toBe(expectedMessage);
  // });

  // IMPORTANT DYNAMIC TEST BACKTICKS
  it.each`
    field         | expectedMessage
    ${'username'} | ${'Username cannot be null'}
    ${'email'}    | ${'E-mail cannot be null'}
    ${'password'} | ${'Password cannot be null'}
  `(
    'returns $expectedMessage when $field is null',
    async ({ field, expectedMessage }: { field: string; expectedMessage: string }) => {
      const user: { [key: string]: string | null } = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      } as { username?: string; email?: string | null; password?: string | null };

      user[field] = null;

      const response = await postUser(user);
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );
});
