import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requestMap = new Map<
    string,
    { count: number; timestamp: number }
  >();
  private readonly WINDOW_MS = 60000;
  private readonly MAX_REQUESTS = 100;

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const now = Date.now();
    const requestData = this.requestMap.get(ip) || { count: 0, timestamp: now };

    if (now - requestData.timestamp > this.WINDOW_MS) {
      requestData.count = 1;
      requestData.timestamp = now;
    } else {
      requestData.count++;
      if (requestData.count > this.MAX_REQUESTS) {
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          throw: new HttpException(
            'Too Many Requests',
            HttpStatus.TOO_MANY_REQUESTS,
          ),
        });
        return;
      }
    }

    this.requestMap.set(ip, requestData);
    next();
  }
}
