import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequalize from '../src/config/database';
// import nodemailerStub from 'nodemailer-stub';
// import EmailService from '../src/email/EmailService';
import { SMTPServer } from 'smtp-server';

let lastMail: string;
let server: SMTPServer;
let simulateSmtpFailure = false;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, _session, callback) {
      let mailBody: string;

      stream.on('data', (data) => {
        mailBody += data.toString();
      });

      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox') as Error & { responseCode: number };

          err.responseCode = 553;
          return callback(err);
        }

        lastMail = mailBody;
        callback();
      });
    },
  });

  await server.listen(8587, 'localhost');

  await sequalize.sync();

  /**
   * SETTING TIMEOUT FOR TEST
   */
  jest.setTimeout(20000);
});

beforeEach(async () => {
  simulateSmtpFailure = false;
  await User.destroy({ truncate: true });
});

afterAll(async () => {
  jest.setTimeout(5000);
  await server.close();
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
  inactive: undefined,
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
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}            | ${'E-mail cannot be null'}
    ${'email'}    | ${'mail.com'}      | ${'E-mail is not valid'}
    ${'email'}    | ${'user.mail.com'} | ${'E-mail is not valid'}
    ${'email'}    | ${'user@mail'}     | ${'E-mail is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'P4ssw'}         | ${'Password must be atleast 6 characters'}
    ${'password'} | ${'alllowercase'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'1234567890'}    | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerandUPPER'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lower4nd5667'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPER444444'}   | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
  `(
    'returns $expectedMessage when $field is $value',
    async ({ field, expectedMessage, value }: { field: string; expectedMessage: string; value: string | null }) => {
      const user: { [key: string]: string | null } = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      } as { username?: string; email?: string | null; password?: string | null };

      user[field] = value;

      const response = await postUser(user);
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it('returns E-mail in use when same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();

    expect(response.body.validationErrors.email).toBe('E-mail in use');
  });

  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });

    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });

    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('creates user in inactive mode', async () => {
    await postUser();

    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates user in inactive mode even the request body contains inactive as false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates an activationToken for user', async () => {
    await postUser();

    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });

  // NODEMAILER TEST
  it('sends an Account activaton email with activationToken', async () => {
    // await postUser();
    // const lastMail = nodemailerStub.interactsWithMail.lastMail();
    // expect(lastMail.to[0]).toContain('user1@mail.com');

    // const users = await User.findAll();
    // const savedUser = users[0];
    // expect(lastMail.content).toContain(savedUser.activationToken);

    await postUser();

    // const lastMail = nodemailerStub.interactsWithMail.lastMail();

    const users = await User.findAll();
    const savedUser = users[0];

    expect(lastMail).toContain('user1@mail.com');
    expect(lastMail).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    // If you want to overwrite the original function, you can use spyOn
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockRejectedValue({ message: 'Failed to deliver email' });
    // const response = await postUser();
    // expect(response.status).toBe(502);

    // mockSendAccountActivation.mockRestore();

    // with nodemailer smtp server
    simulateSmtpFailure = true;

    const response = await postUser();

    expect(response.status).toBe(502);
  });

  it('return Email failure message when sending email fails', async () => {
    // with mocks
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockRejectedValue({ message: 'Failed to deliver email' });
    // const response = await postUser();
    // mockSendAccountActivation.mockRestore();
    // expect(response.body.message).toBe('E-mail Failure');

    // with smtp server
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.body.message).toBe('E-mail Failure');
  });

  it('does not save user to database if activation email when sending email fails', async () => {
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockRejectedValue({ message: 'Failed to deliver email' });
    // await postUser();
    // mockSendAccountActivation.mockRestore();
    simulateSmtpFailure = true;

    const users = await User.findAll();
    expect(users.length).toBe(0);
  });

  it('returns Validation Failure message in error response body when validation fails', async () => {
    //
    const response = await request(app).post('/api/1.0/users').send({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: undefined,
    });

    expect(response.body.message).toBe('Validation Failure');
  });
});

// ACCOUNT ACTIVATION

describe('Account Activation', () => {
  it('activates the account when correct token is set', async () => {
    //

    await postUser();

    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    users = await User.findAll();

    expect(users[0].inactive).toBe(false);
  });

  it('removes the token from user after succesful activation', async () => {
    await request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: undefined,
    });

    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app).post('/api/1.0/users/token/' + token);
    users = await User.findAll();

    expect(users[0].activationToken).toBeFalsy();
  });

  it('does not activate account when token is wrong', async () => {
    // await request(app).post('/api/1.0/users').send({
    //   username: 'user1',
    //   password: 'P4ssword',
    //   email: 'user1@mail.com',
    //   inactive: undefined,
    // });

    await postUser();
    const token = 'this-token-does-not-exist';

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    const users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('returns bad request when token is wrong', async () => {
    await postUser();

    const falseToken = 'this-token-does-not-exist';

    const response = await request(app)
      .post('/api/1.0/users/token/' + falseToken)
      .send();

    expect(response.status).toBe(400);
  });

  it('returns This account is either active or the active token is invalid', async () => {
    await request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: undefined,
    });

    const falseToken = 'this-token-does-not-exist';

    const response = await request(app)
      .post('/api/1.0/users/token/' + falseToken)
      .send();

    expect(response.body.message).toBe('This account is either active or the active token is invalid');
  });

  it.each`
    tokenStatus  | message
    ${'wrong'}   | ${'This account is either active or the active token is invalid'}
    ${'correct'} | ${'Account is activated'}
  `('return $message when token is $tokenStatus', async ({ tokenStatus, message }) => {
    await request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: undefined,
    });

    let token: string | undefined | null = 'this-token-does-not-exist';

    if (tokenStatus === 'correct') {
      const users = await User.findAll();
      token = users[0].activationToken;
    }

    const response = await request(app).post('/api/1.0/users/token/' + token);

    expect(response.body.message).toBe(message);
  });
});

describe('Error Model', () => {
  //
  it('returns path, timestamp, message and validationErrors in response when validation failure', async () => {
    //
    const response = await request(app).post('/api/1.0/users').send({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: undefined,
    });

    const body = response.body;

    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message', 'validationErrors']);
  });

  it('returns path, timestamp and message in response when request fails other than validation error', async () => {
    //
    const response = await request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: undefined,
    });

    expect(response.body.message).toBe('User created');

    const falseToken = 'this-token-does-not-exist';
    const sendTokenResponse = await request(app)
      .post('/api/1.0/users/token/' + falseToken)
      .send();

    const body = sendTokenResponse.body;

    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message']);
  });

  it('returns path is error body', async () => {
    //
    const invalidToken = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + invalidToken)
      .send({
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
        inactive: undefined,
      });

    const body = response.body;

    expect(body.path).toEqual('/api/1.0/users/token/' + invalidToken);
  });

  it('returns timestamp in milliseconds within 5 seconds value in error body', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const fiveSecondsLater = nowInMilliseconds + 5 * 1000;
    const invalidToken = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + invalidToken)
      .send({
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
        inactive: undefined,
      });

    const body = response.body;

    expect(body.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(body.timestamp).toBeLessThan(fiveSecondsLater);
  });
});
