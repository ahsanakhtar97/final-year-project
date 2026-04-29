import { NestFactory, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';

// We import from src relative to the api directory
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

const expressApp = express();
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: ['error', 'warn'] } // Minimize logging in serverless to reduce noise
    );

    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    // Allow CORS from the frontend. Since it's a monolithic deployment, we can allow * 
    // or specifically configure it. For simplicity in Vercel Monoliths, we allow all.
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    app.setGlobalPrefix('api', { exclude: ['/', '/health'] });
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        stopAtFirstError: false,
      }),
    );

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new LoggingInterceptor(),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  expressApp(req, res);
}
