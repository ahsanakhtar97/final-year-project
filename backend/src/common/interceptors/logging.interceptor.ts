import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * Structured access log for every HTTP request. Attaches a unique
 * `requestId` to the request object so the exception filter can surface it.
 *
 * Format: `[requestId] METHOD path → status (durationMs)`
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request & { requestId?: string }>();
    const res = httpContext.getResponse<Response>();

    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const started = Date.now();
    const { method, originalUrl } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - started;
          this.logger.log(
            `[${requestId}] ${method} ${originalUrl} → ${res.statusCode} (${ms}ms)`,
          );
        },
        error: (err: { status?: number; message?: string }) => {
          const ms = Date.now() - started;
          this.logger.warn(
            `[${requestId}] ${method} ${originalUrl} ✗ ${err?.status ?? 500} ${err?.message ?? 'error'} (${ms}ms)`,
          );
        },
      }),
    );
  }
}
