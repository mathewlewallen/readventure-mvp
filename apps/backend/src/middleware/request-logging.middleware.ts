import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services/monitoring.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Log request start
    this.monitoringService.log('request.start', {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
    });

    // Track response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.monitoringService.log('request.complete', {
        requestId,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  }
}
