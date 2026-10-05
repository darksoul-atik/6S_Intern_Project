import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

let appInstance: INestApplication | null = null;

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Increase payload size limit for Base64 avatars and media
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Enable global input validation with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global standard response envelope interceptor & exception filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Allow browser requests only from the configured frontend origin(s)
  const rawFrontendOrigins =
    configService.get<string>('FRONTEND_ORIGINS') ||
    configService.get<string>('FRONTEND_ORIGIN');

  if (!rawFrontendOrigins) {
    throw new Error(
      'CRITICAL SECURITY CONFIGURATION ERROR: FRONTEND_ORIGINS (or FRONTEND_ORIGIN) environment variable is missing.',
    );
  }

  const allowedOrigins = rawFrontendOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Setup Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevPulse API')
    .setDescription(
      'Interactive OpenAPI documentation for DevPulse REST endpoints',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Health and system diagnostic endpoints')
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('profile', 'Developer profile and portfolio project management')
    .addTag(
      'users',
      'User profiles, portfolios, skills, and admin user directory',
    )
    .addTag(
      'posts',
      'Posts feed, pagination, soft-delete lifecycle, 5-day restore, and moderation',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'DevPulse API Docs',
  });

  return app;
}

// Local server bootstrap
if (process.env.VERCEL !== '1') {
  const app = await createApp();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 5000);

  await app.listen(port);
  console.log(`Backend server running on http://localhost:${port}`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/docs`,
  );
}

// Vercel Serverless Function Handler
export default async function handler(req: unknown, res: unknown) {
  if (!appInstance) {
    appInstance = await createApp();
    await appInstance.init();
  }

  const expressInstance = appInstance.getHttpAdapter().getInstance();
  return expressInstance(req, res);
}
