import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that produces a consistent error envelope.
 *
 * Shape:
 * {
 *   statusCode: number,
 *   message: string | string[],
 *   error: string,       // short code ("Bad Request", "Internal Server Error", ...)
 *   path: string,
 *   timestamp: string,   // ISO
 *   requestId?: string,  // forwarded from the logging interceptor if present
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorName = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        // NestJS validation pipe & built-in HTTP exceptions return { message, error, statusCode }
        const body = res as { message?: string | string[]; error?: string };
        if (body.message !== undefined) message = body.message;
        if (body.error) errorName = body.error;
      }
      if (errorName === 'Internal Server Error') {
        errorName = exception.name.replace(/Exception$/, '');
      }
    } else if (exception instanceof Error) {
      // Unknown/unhandled — don't leak internals.
      message = 'Something went wrong. Please try again.';
      this.logger.error(
        `Unhandled ${exception.name}: ${exception.message}`,
        exception.stack,
      );
    }

    const requestId = (request as Request & { requestId?: string }).requestId;

    response.status(status).json({
      statusCode: status,
      message,
      error: errorName,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    });
  }
}
