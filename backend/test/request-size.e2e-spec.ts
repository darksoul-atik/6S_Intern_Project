import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

describe('Day 18 request size limits (e2e)', () => {
  let app: INestApplication | undefined;
  let mongoServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGODB_URI = mongoServer.getUri();

    process.env.JWT_SECRET = 'request-size-test-access-secret';

    process.env.JWT_EXPIRES_IN = '15m';

    process.env.JWT_REFRESH_SECRET = 'request-size-test-refresh-secret';

    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    process.env.FRONTEND_ORIGINS = 'http://localhost:3000';

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

    /*
    |--------------------------------------------------------------------------
    | Match production request-size limits
    |--------------------------------------------------------------------------
    */

    const { json, urlencoded } = await import('express');

    app.use(
      json({
        limit: '256kb',
      }),
    );

    app.use(
      urlencoded({
        extended: true,
        limit: '256kb',
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('rejects a JSON body larger than 256 KB', async () => {
    if (!app) {
      throw new Error('Nest application was not initialized');
    }

    const oversizedPayload = {
      name: 'Large Payload User',

      email: 'large-payload@devpulse.test',

      password: 'TestPassword123',

      /*
      |--------------------------------------------------------------------------
      | Intentionally larger than 256 KB
      |--------------------------------------------------------------------------
      */

      extra: 'x'.repeat(300 * 1024),
    };

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(oversizedPayload);

    expect(response.status).toBe(413);
  });
});
