import request from 'supertest';
import app from '../src/app';
import User from '../src/user/User';
import sequelize from '../src/config/database';
import bcrypt from 'bcrypt';
import { SMTPServer } from 'smtp-server';
import config from 'config';

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
