import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Every environment variable the backend relies on is declared here and
 * validated at boot. If something is missing or malformed we fail fast
 * rather than discover it at runtime.
 */
export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  // --- Database ---
  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  POSTGRES_HOST?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  POSTGRES_USER?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  POSTGRES_PASSWORD?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  POSTGRES_DB?: string;

  // --- Auth ---
  @IsString()
  @MinLength(32, {
    message:
      'JWT_SECRET must be at least 32 characters. Generate one with `openssl rand -hex 32`.',
  })
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN: string = '1d';

  // --- Network ---
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsString()
  AI_SERVICE_URL?: string;

  // Google Gemini API key. Optional -- if absent, AiService falls back to its
  // built-in canned/deterministic responses, so the app still runs without it.
  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;

  @IsOptional()
  @IsString()
  GEMINI_MODEL?: string;

  // Shared secret used to authenticate the admin endpoints (provider
  // verification, audit). Set this to a long random string in .env.
  @IsOptional()
  @IsString()
  @MinLength(16, {
    message:
      'ADMIN_TOKEN must be at least 16 chars when set. Use `openssl rand -hex 24` to generate one.',
  })
  ADMIN_TOKEN?: string;

  @IsOptional()
  @IsString()
  SWAGGER_ENABLED?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => {
        const constraints = e.constraints ? Object.values(e.constraints).join(', ') : '';
        return `  - ${e.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return validated;
}
