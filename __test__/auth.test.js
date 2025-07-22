// __tests__/auth.test.js
const request = require('supertest');
const app = require('../app'); // Impor aplikasi Express Anda

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullname: 'Test User',
        email: `test${Date.now()}@example.com`,
        phone_number: '081234567899',
        username: `testuser${Date.now()}`,
        password: 'password123',
        confirmation_password: 'password123',
        address: '123 Test St'
      });
    expect(res.statusCode).toEqual(201); // Seharusnya 201 Created
    expect(res.body).toHaveProperty('message', 'User berhasil didaftarkan');
  });
});
