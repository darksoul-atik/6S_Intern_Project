import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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


  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 5000);

  await app.listen(port);
  console.log(`Backend server running on http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/docs`);
}
await bootstrap();


