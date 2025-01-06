import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { ConfigService } from '@nestjs/config';

export type LogEventType = 'request.start' | 'request.complete' | string;

export interface LogPayload {
  requestId: string;
  method?: string;
  path?: string;
  query?: any;
  ip?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

@Injectable()
export class MonitoringService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    Sentry.init({
      dsn: this.configService.get<string>('SENTRY_DSN'),
      environment: this.configService.get<string>('NODE_ENV'),
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });
  }

  captureException(error: Error, context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }

  setRequestContext(req: any) {
    Sentry.withScope((scope) => {
      scope.setExtra('url', req.url);
      scope.setExtra('method', req.method);
      scope.setExtra('headers', req.headers);

      if (req.user) {
        scope.setUser({
          id: req.user.id,
          email: req.user.email,
        });
      }
    });
  }
  log(event: LogEventType, payload: LogPayload) {
    Sentry.withScope((scope) => {
      scope.setExtras(payload);
      Sentry.captureMessage(event, 'info');
    });
  }
}
