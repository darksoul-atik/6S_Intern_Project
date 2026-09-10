import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';

let appInstance: INestApplication | null = null;

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Setup Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevPulse API')
    .setDescription('Interactive OpenAPI documentation for DevPulse REST endpoints')
    .setVersion('1.0')
    .addTag('Health', 'Health and system diagnostic endpoints')
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
  console.log(`Swagger documentation available at http://localhost:${port}/docs`);
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



