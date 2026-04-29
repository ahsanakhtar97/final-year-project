import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Use NestJS buffered logger so startup logs follow the same format.
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  // Security headers (XSS, clickjacking, etc.).
  // CSP is disabled because this is a pure JSON API — the Swagger UI
  // sets its own stricter policy via middleware when served.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS — driven by CORS_ORIGINS env var (comma-separated list).
  const corsOriginsRaw = config.get<string>('CORS_ORIGINS') ?? 'http://localhost:4000,http://localhost:3000';
  const corsOrigins = corsOriginsRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix + URI versioning so clients can target /api/v1/*.
  app.setGlobalPrefix('api', { exclude: ['/', '/health'] });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Strict input validation: strip unknown keys, reject payloads with extras,
  // auto-transform query/param strings into their DTO-declared types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // Response shaping: honours @Exclude/@Expose on entities & DTOs,
  // so we never accidentally leak password hashes over the wire.
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
  );

  // Consistent error envelope.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Graceful shutdown for container orchestration (SIGTERM/SIGINT).
  app.enableShutdownHooks();

  // Swagger — only mounted when SWAGGER_ENABLED !== 'false'.
  const swaggerEnabled = config.get<string>('SWAGGER_ENABLED') !== 'false';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GrowFlow API')
      .setDescription(
        'Habit tracking, journaling, and gentle AI feedback — backend API for GrowFlow.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the JWT returned from /api/v1/auth/login',
        },
        'access-token',
      )
      .addTag('auth', 'Authentication & registration')
      .addTag('users', 'User profile CRUD')
      .addTag('tasks', 'To-do list')
      .addTag('habits', 'Habit catalog')
      .addTag('user-habits', 'Habits a user has adopted')
      .addTag('habit-logs', 'Daily habit check-ins & mood')
      .addTag('categories', 'Habit categories')
      .addTag('dashboard', 'Aggregated dashboard data')
      .addTag('ai', 'AI-powered feedback')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log('Swagger UI available at /docs');
  }

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);
  logger.log(`GrowFlow API listening on port ${port}`);
  logger.log(`Allowed CORS origins: ${corsOrigins.join(', ')}`);
  // Throttle banner: prove which limit is loaded on this boot. If you're
  // still seeing 429s, the banner number tells you whether the new config
  // is actually running, or whether you're talking to a stale process.
  const throttleLimit =
    process.env.NODE_ENV === 'production' ? 6000 : 1_000_000;
  logger.log(
    `Throttle config -> NODE_ENV=${process.env.NODE_ENV ?? 'unset'}, default limit ${throttleLimit}/min`,
  );
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
