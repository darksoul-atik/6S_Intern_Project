import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

describe('Day 18 rate limiting (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  const testUser = {
    name: 'Rate Limit User',
    email: 'rate-limit@devpulse.test',
    password: 'TestPassword123',
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGODB_URI = mongoServer.getUri();

    process.env.JWT_SECRET = 'rate-limit-test-access-secret';

    process.env.JWT_EXPIRES_IN = '15m';

    process.env.JWT_REFRESH_SECRET = 'rate-limit-test-refresh-secret';

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

    /*
    |--------------------------------------------------------------------------
    | Create one real user
    |--------------------------------------------------------------------------
    |
    | Login throttling is tested using repeated wrong-password attempts.
    |
    */

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(testUser)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  it('allows the first 10 login attempts but blocks the 11th with 429', async () => {
    /*
    |--------------------------------------------------------------------------
    | First 10 login attempts
    |--------------------------------------------------------------------------
    |
    | Credentials deliberately contain the wrong password.
    |
    | The important point:
    | they reach AuthService normally and return 401.
    |
    */

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'DefinitelyWrongPassword',
        })
        .expect(401);
    }

    /*
    |--------------------------------------------------------------------------
    | Attempt 11
    |--------------------------------------------------------------------------
    |
    | ThrottlerGuard should stop this BEFORE AuthService processes it.
    |
    */

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'DefinitelyWrongPassword',
      })
      .expect(429);

    expect(response.body.statusCode).toBe(429);
  });
});
