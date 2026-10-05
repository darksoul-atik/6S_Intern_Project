import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Model } from 'mongoose';
import request from 'supertest';

import { User, type UserDocument } from '../src/users/schemas/user.schema.js';

describe('DevPulse API (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let userModel: Model<UserDocument>;

  const testUser = {
    name: 'E2E Test User',
    email: 'e2e-user@devpulse.test',
    password: 'TestPassword123',
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGODB_URI = mongoServer.getUri();

    /*
    |--------------------------------------------------------------------------
    | Day 18 auth configuration
    |--------------------------------------------------------------------------
    */

    process.env.JWT_SECRET = 'test-access-jwt-secret';

    process.env.JWT_EXPIRES_IN = '15m';

    process.env.JWT_REFRESH_SECRET = 'test-refresh-jwt-secret';

    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const { AppModule } = await import('../src/app.module.js');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  });
  /*
  |--------------------------------------------------------------------------
  | Health
  |--------------------------------------------------------------------------
  */

  it('starts the API with the in-memory test database', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  /*
  |--------------------------------------------------------------------------
  | Signup
  |--------------------------------------------------------------------------
  */

  it('signs up a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(testUser)
      .expect(201);

    expect(response.body.data.email).toBe(testUser.email);

    expect(response.body.data.role).toBe('user');

    expect(response.body.data).not.toHaveProperty('password');

    expect(response.body.data).not.toHaveProperty('passwordHash');

    expect(response.body.data).not.toHaveProperty('refreshTokenHash');
  });

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  it('logs in and returns an access token and refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body.data.accessToken).toEqual(expect.any(String));

    expect(response.body.data.refreshToken).toEqual(expect.any(String));

    expect(response.body.data.user.email).toBe(testUser.email);

    expect(response.body.data.user.role).toBe('user');

    /*
    |--------------------------------------------------------------------------
    | Verify raw refresh token is NOT stored in MongoDB
    |--------------------------------------------------------------------------
    */

    const storedUser = await userModel
      .findOne({
        email: testUser.email,
      })
      .select('+refreshTokenHash')
      .exec();

    expect(storedUser).not.toBeNull();

    expect(storedUser?.refreshTokenHash).toEqual(expect.any(String));

    expect(storedUser?.refreshTokenHash).not.toBe(
      response.body.data.refreshToken,
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Protected access
  |--------------------------------------------------------------------------
  */

  it('allows an authenticated user to access /auth/me', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.email).toBe(testUser.email);

    expect(response.body.role).toBe('user');

    expect(response.body).not.toHaveProperty('passwordHash');

    expect(response.body).not.toHaveProperty('refreshTokenHash');
  });

  it('rejects /auth/me when no JWT is provided', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  /*
  |--------------------------------------------------------------------------
  | Day 18: refresh-token rotation
  |--------------------------------------------------------------------------
  */

  it('refreshes the session and rotates the refresh token', async () => {
    /*
    |--------------------------------------------------------------------------
    | Login and get R1
    |--------------------------------------------------------------------------
    */

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const oldAccessToken = loginResponse.body.data.accessToken;

    const oldRefreshToken = loginResponse.body.data.refreshToken;

    expect(oldAccessToken).toEqual(expect.any(String));

    expect(oldRefreshToken).toEqual(expect.any(String));

    /*
    |--------------------------------------------------------------------------
    | Refresh R1 -> R2
    |--------------------------------------------------------------------------
    */

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(200);

    const newAccessToken = refreshResponse.body.data.accessToken;

    const newRefreshToken = refreshResponse.body.data.refreshToken;

    expect(newAccessToken).toEqual(expect.any(String));

    expect(newRefreshToken).toEqual(expect.any(String));

    /*
    |--------------------------------------------------------------------------
    | jti makes the rotated refresh token different
    |--------------------------------------------------------------------------
    */

    expect(newRefreshToken).not.toBe(oldRefreshToken);

    expect(refreshResponse.body.data.user.email).toBe(testUser.email);

    /*
    |--------------------------------------------------------------------------
    | New access token works
    |--------------------------------------------------------------------------
    */

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);

    expect(meResponse.body.email).toBe(testUser.email);

    /*
    |--------------------------------------------------------------------------
    | Old R1 cannot be reused
    |--------------------------------------------------------------------------
    */

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(401);

    /*
    |--------------------------------------------------------------------------
    | Current R2 still works
    |--------------------------------------------------------------------------
    */

    const secondRefreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: newRefreshToken,
      })
      .expect(200);

    expect(secondRefreshResponse.body.data.accessToken).toEqual(
      expect.any(String),
    );

    expect(secondRefreshResponse.body.data.refreshToken).toEqual(
      expect.any(String),
    );

    expect(secondRefreshResponse.body.data.refreshToken).not.toBe(
      newRefreshToken,
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Day 18: logout revocation
  |--------------------------------------------------------------------------
  */

  it('revokes the current refresh token on logout', async () => {
    /*
    |--------------------------------------------------------------------------
    | Login and get current refresh token
    |--------------------------------------------------------------------------
    */

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const refreshToken = loginResponse.body.data.refreshToken;

    /*
    |--------------------------------------------------------------------------
    | Confirm DB currently contains a refresh hash
    |--------------------------------------------------------------------------
    */

    const userBeforeLogout = await userModel
      .findOne({
        email: testUser.email,
      })
      .select('+refreshTokenHash')
      .exec();

    expect(userBeforeLogout?.refreshTokenHash).toEqual(expect.any(String));

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const logoutResponse = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken,
      })
      .expect(200);

    expect(logoutResponse.body.message).toBe('Logout successful');

    /*
    |--------------------------------------------------------------------------
    | Stored hash should now be null
    |--------------------------------------------------------------------------
    */

    const userAfterLogout = await userModel
      .findOne({
        email: testUser.email,
      })
      .select('+refreshTokenHash')
      .exec();

    expect(userAfterLogout?.refreshTokenHash).toBeNull();

    /*
    |--------------------------------------------------------------------------
    | Revoked token cannot refresh again
    |--------------------------------------------------------------------------
    */

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(401);
  });

  /*
  |--------------------------------------------------------------------------
  | Refresh validation
  |--------------------------------------------------------------------------
  */

  it('rejects refresh when no refresh token is provided', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400);
  });

  it('rejects an invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: 'this-is-not-a-valid-jwt',
      })
      .expect(401);
  });

  /*
  |--------------------------------------------------------------------------
  | Roles
  |--------------------------------------------------------------------------
  */

  it('rejects a normal user from the admin-only route', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .get('/auth/admin-check')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('allows an admin to access the admin-only route', async () => {
    await userModel.updateOne(
      {
        email: testUser.email,
      },
      {
        $set: {
          role: 'admin',
        },
      },
    );

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    const response = await request(app.getHttpServer())
      .get('/auth/admin-check')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.email).toBe(testUser.email);

    expect(response.body.data.role).toBe('admin');

    expect(response.body.data.adminAccess).toBe(true);
  });
});
