import request from 'supertest';
import app from '../src/app';

const postPasswordReset = (email: string | null = 'user1@mail.com') => {
  //
  const agent = request(app).post('/api/1.0/password-reset');

  return agent.send({ email });
};

describe('Password Reset Request', () => {
  //
  it('returns 404 when a password reset request is sent from unknown e-mail', async () => {
    //
    const response = await request(app).post('/api/1.0/password-reset').send({ email: 'user1@mail.com' });
    expect(response.status).toBe(404);
  });

  it('returns error body with E-mail not found for unauthorized request', async () => {
    //
    const nowInMilliseconds = new Date().getTime();
    const response = await postPasswordReset();
    expect(response.body.path).toBe('/api/1.0/password-reset');
    expect(response.body.timestamp).toBeGreaterThan(nowInMilliseconds);
    expect(response.body.message).toBe('E-mail not found');
  });

  it('returns 400 with validation error response having E-mail is not valid when request does not have valid email', async () => {
    //
    const response = await postPasswordReset(null);
    expect(response.body.validationErrors.email).toBe('E-mail is not valid');
    expect(response.status).toBe(400);
  });
});
