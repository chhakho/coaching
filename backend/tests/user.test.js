const request = require('supertest');
const { createTestApp, setupTestDb, teardownTestDb, clearTestDb } = require('./setup');

const app = createTestApp();
let authToken;
let userId;

describe('User Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    // Register a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'usertest@example.com',
        password: 'testpass123',
        name: 'User Test'
      });
    
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  describe('GET /api/users', () => {
    it('should get all users with valid token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      // Verify user object structure
      const user = res.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('name');
      expect(user).not.toHaveProperty('password');
    });

    it('should fail without auth token', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.statusCode).toBe(401);
    });

    it('should fail with invalid auth token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id with valid token', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'usertest@example.com');
      expect(res.body).toHaveProperty('username', 'usertest');
      expect(res.body).toHaveProperty('name', 'User Test');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should fail with invalid user id', async () => {
      const res = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should fail with non-numeric user id', async () => {
      const res = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user name with valid token', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'usertest@example.com');
      expect(res.body).toHaveProperty('username', 'usertest');
      expect(res.body).toHaveProperty('name', 'Updated Name');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should update user email with valid token', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'updated@example.com'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'updated@example.com');
      expect(res.body).toHaveProperty('username', 'usertest');
      expect(res.body).toHaveProperty('name', 'User Test');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should update user password with valid token', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'newpassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'usertest@example.com');
      expect(res.body).toHaveProperty('username', 'usertest');
      expect(res.body).toHaveProperty('name', 'User Test');
      expect(res.body).not.toHaveProperty('password');

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usertest@example.com',
          password: 'newpassword123'
        });

      expect(loginRes.statusCode).toBe(200);
    });

    it('should fail to update with invalid email format', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should fail to update other user', async () => {
      const res = await request(app)
        .put('/api/users/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Hacker'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should fail with non-numeric user id', async () => {
      const res = await request(app)
        .put('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should fail to delete other user', async () => {
      const res = await request(app)
        .delete('/api/users/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should delete own user with valid token', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);

      // Verify user is deleted
      const getRes = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.statusCode).toBe(404);
    });

    it('should fail with non-numeric user id', async () => {
      const res = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(400);
    });
  });
});
