import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';

interface User {
  id: string | number;
  email?: string;
}

interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class SentryContextMiddleware implements NestMiddleware {
  use(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      Sentry.withScope((scope) => {
        scope.setTag('path', req.path);
        scope.setTag('method', req.method);

        if (req.user) {
          scope.setUser({
            id: req.user.id,
            ip_address: req.ip,
          });
        }

        scope.setExtra('query', req.query);
        scope.setExtra('body', req.body);
      });
    } catch (error) {
      console.error('Failed to set Sentry context:', error);
    }

    next();
  }
}
