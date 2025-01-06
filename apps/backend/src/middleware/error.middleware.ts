import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as any).message || message;
      errorCode = (errorResponse as any).error || errorCode;
    }

    // Capture error in Sentry
    Sentry.withScope((scope) => {
      scope.setExtra('errorCode', errorCode);
      scope.setExtra('statusCode', status);
      Sentry.captureException(exception);
    });

    // Log error details
    console.error({
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      errorCode,
      status,
      message,
      exception,
    });

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
