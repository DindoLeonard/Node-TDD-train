import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequelize from '../src/config/database';
import bcrypt from 'bcrypt';
import { SMTPServer } from 'smtp-server';
import config from 'config';
import Token from '../src/auth/Token';

let lastMail: string;
let server: SMTPServer;
let simulateSmtpFailure = false;

const mailConfig = config.get('mail') as {
  host: string;
  port: number;
  tls: {
    rejectUnauthorized: boolean;
  };
};

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

  await server.listen(mailConfig.port, 'localhost');

  await sequelize.sync();

  /**
   * SETTING TIMEOUT FOR TEST
   */
  jest.setTimeout(20000);
});

beforeEach(async () => {
  simulateSmtpFailure = false;
  await User.destroy({ truncate: true, cascade: true });
});

afterAll(async () => {
  jest.setTimeout(5000);
  await server.close();
});

const activeUser = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const postPasswordReset = (email: string | null = 'user1@mail.com') => {
  //
  const agent = request(app).post('/api/1.0/user/password');

  return agent.send({ email });
};

const putPasswordUpdate = (body: { password?: string | null; passwordResetToken?: string } = {}) => {
  const agent = request(app).put('/api/1.0/user/password');

  return agent.send(body);
};

describe('Password Reset Request', () => {
  //
  it('returns 404 when a password reset request is sent from unknown e-mail', async () => {
    //
    const response = await request(app).post('/api/1.0/user/password').send({ email: 'user1@mail.com' });
    expect(response.status).toBe(404);
  });

  it('returns error body with E-mail not found for unauthorized request', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const response = await postPasswordReset();
    expect(response.body.path).toBe('/api/1.0/user/password');
    expect(response.body.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(response.body.message).toBe('E-mail not found');
  });

  it('returns 400 with validation error response having E-mail is not valid when request does not have valid email', async () => {
    //
    const response = await postPasswordReset(null);
    expect(response.body.validationErrors.email).toBe('E-mail is not valid');
    expect(response.status).toBe(400);
  });

  it('returns 200 ok when a password reset request is sent fro known e-mail', async () => {
    //
    const user = await addUser();
    const response = await postPasswordReset(user.email);
    expect(response.status).toBe(200);
  });

  it('returns success response body with message "Check your e-mail for resetting your password" for known e-mail for password reset request', async () => {
    const user = await addUser();
    const response = await postPasswordReset(user.email);
    expect(response.body.message).toBe('Check your e-mail for resetting your password');
  });

  it('creates passwordResetToken when a password reset request is sent for known e-mail', async () => {
    //
    const user = await addUser();
    await postPasswordReset(user.email);
    const userInDb = await User.findOne({ where: { email: user.email } });
    expect(userInDb?.passwordResetToken).toBeTruthy();
  });

  it('sends a password reset email with passwordResetToken', async () => {
    //
    const user = await addUser();
    await request(app).post('/api/1.0/user/password').send({ email: 'user1@mail.com' });
    const userInDB = await User.findOne({ where: { email: user.email } });
    const passwordResetToken = userInDB?.passwordResetToken;

    expect(lastMail).toContain('user1@mail.com');
    expect(lastMail).toContain(passwordResetToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    //
    simulateSmtpFailure = true;
    const user = await addUser();
    const response = await postPasswordReset(user.email);
    expect(response.status).toBe(502);
  });

  it('returns "E-mail failure" message after e-mail failure', async () => {
    //
    simulateSmtpFailure = true;
    const user = await addUser();
    const response = await postPasswordReset(user.email);
    expect(response.body.message).toBe('E-mail Failure');
  });
});

describe('Password Update', () => {
  it('returns 403 when password update request does not have the valid password reset token ', async () => {
    //
    const response = await putPasswordUpdate({ password: 'P4ssword', passwordResetToken: 'abcd' });

    expect(response.status).toBe(403);
  });

  // unauthorized password reset token
  it('returns error body with "You are not authorized to update your password. Please follow the password reset steps again" after trying to update with invalid token', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const response = await putPasswordUpdate({ password: 'P4ssword', passwordResetToken: 'abcd' });

    expect(response.body.path).toBe('/api/1.0/user/password');
    expect(response.body.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(response.body.message).toBe(
      'You are not authorized to update your password. Please follow the password reset steps again'
    );
  });

  it('returns 403 when password update request with invalid password pattern and the reset token is invalid', async () => {
    //
    const response = await putPasswordUpdate({ password: 'not-valid', passwordResetToken: 'abcd' });
    expect(response.status).toBe(403);
  });

  it('returns 400 when trying to update with invalid password and the reset token is valid', async () => {
    //
    const user = await addUser();
    user.passwordResetToken = 'test-token';
    await user.save();

    const response = await putPasswordUpdate({ password: 'not-valid', passwordResetToken: 'test-token' });
    expect(response.status).toBe(400);
  });

  it.each`
    field         | value              | message
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'P4ssw'}         | ${'Password must be atleast 6 characters'}
    ${'password'} | ${'alllowercase'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'1234567890'}    | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerandUPPER'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lower4nd5667'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPER444444'}   | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
  `(
    'returns password validation error $message when the value is $value',
    async ({ value, message }: { field: string; message: string; value: string | null }) => {
      //
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      await user.save();

      const response = await putPasswordUpdate({ password: value, passwordResetToken: 'test-token' });
      expect(response.body.validationErrors.password).toBe(message);
    }
  );

  it('returns 200 when valid password is sent with valid reset token', async () => {
    //
    const user = await addUser();
    user.passwordResetToken = 'test-token';
    await user.save();

    const response = await putPasswordUpdate({ password: 'N3w-password', passwordResetToken: 'test-token' });
    expect(response.status).toBe(200);
  });

  it('updates the password in database when the request is valid', async () => {
    //
    const user = await addUser();
    user.passwordResetToken = 'test-token';
    await user.save();

    await putPasswordUpdate({ password: 'N3w-password', passwordResetToken: 'test-token' });

    const userInDB = await User.findOne({ where: { email: 'user1@mail.com' } });

    expect(userInDB?.password).not.toEqual(user.password);
  });

  it('clears the reset token in database when the request is valid', async () => {
    //
    const user = await addUser();
    user.passwordResetToken = 'test-token';
    await user.save();

    await putPasswordUpdate({ password: 'N3w-password', passwordResetToken: 'test-token' });

    const userInDB = await User.findOne({ where: { email: 'user1@mail.com' } });

    expect(userInDB?.passwordResetToken).toBeFalsy();
  });

  it('activates and clears activation token if the account is inactive after valid password reset', async () => {
    //
    const user = await addUser();
    user.passwordResetToken = 'test-token';
    user.activationToken = 'activation-token';
    user.inactive = true;
    await user.save();

    await putPasswordUpdate({ password: 'N3w-password', passwordResetToken: 'test-token' });

    const userInDB = await User.findOne({ where: { email: 'user1@mail.com' } });

    expect(userInDB?.activationToken).toBeFalsy();
    expect(userInDB?.inactive).toBe(false);
  });

  it('clears all tokens of user after valid password reset', async () => {
    //
    const user = await addUser();
    user.passwordResetToken = 'test-token';
    await user.save();

    await Token.create({
      token: 'token-1',
      userId: user.id,
      lastUsedAt: new Date(Date.now()),
    });

    await putPasswordUpdate({ password: 'N3w-password', passwordResetToken: 'test-token' });

    const token = await Token.findAll({ where: { userId: user.id } });
    expect(token.length).toBe(0);
  });
});
