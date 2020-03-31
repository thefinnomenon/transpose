import request from 'supertest';
import app from '../app';

describe('Test token refresh', () => {
  test('It should respond 200 to Spotify token refresh POST', async () => {
    await request(app)
      .post('/refresh/spotify')
      .expect(response.statusCode)
      .toBe(200);
  });

  test('It should respond 200 to Apple Music token refresh POST', async () => {
    await request(app)
      .post('/refresh/apple')
      .expect(response.statusCode)
      .toBe(200);
  });
});
