import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringService } from '../services/monitoring.service';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import { SentryContextMiddleware } from './sentry-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware, SentryContextMiddleware)
      .forRoutes('*');
  }
}
