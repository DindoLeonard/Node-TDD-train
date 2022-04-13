import request from 'supertest';
import app from '../src/app';

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
});
