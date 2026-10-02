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
    process.env.JWT_SECRET = 'test-jwt-secret';

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
    await app.close();
    await mongoServer.stop();
  });

  it('starts the API with the in-memory test database', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('signs up a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(testUser)
      .expect(201);

    expect(response.body.data.email).toBe(testUser.email);
    expect(response.body.data.role).toBe('user');
    expect(response.body.data).not.toHaveProperty('password');
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('logs in and returns a JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user.role).toBe('user');
  });

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
  });

  it('rejects /auth/me when no JWT is provided', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

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
      { email: testUser.email },
      { $set: { role: 'admin' } },
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
