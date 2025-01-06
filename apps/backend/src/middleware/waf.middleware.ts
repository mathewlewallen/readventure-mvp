import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { SecurityService } from '../services/security.service';

@Injectable()
export class WAFMiddleware implements NestMiddleware {
  private readonly BLOCKED_IPS: Set<string> = new Set();
  private readonly SQL_INJECTION_PATTERNS = [
    /(\s|'|`|--|#|\/\*|\*\/|;|DROP|DELETE|UPDATE|INSERT)\s+/i,
    /UNION(\s+ALL)?\s+SELECT/i,
  ];
  private readonly XSS_PATTERNS = [
    /<script\b[^>]*>(.*?)<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:\s*text\/html/i,
  ];
  private readonly PATH_TRAVERSAL_PATTERNS = [/\.\./, /\/\//, /\\\\./];

  constructor(
    private ConfigService: ConfigService,
    private securityService: SecurityService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if IP is blocked
      if (this.BLOCKED_IPS.has(req.ip)) {
        throw new HttpException('Access Denied', HttpStatus.FORBIDDEN);
      }

      // Validate request
      await this.validateRequest(req);

      // Add security headers
      this.addSecurityHeaders(res);

      next();
    } catch (error) {
      // Log security event
      this.securityService.logSecurityEvent('waf-block', {
        ip: req.ip,
        path: req.path,
        reason: error.message,
      });

      // Block IP if multiple violations
      this.handleViolation(req.ip);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Invalid Request', HttpStatus.BAD_REQUEST);
    }
  }

  private async validateRequest(req: Request) {
    // Check for SQL injection
    this.checkPatterns(
      this.SQL_INJECTION_PATTERNS,
      req.query,
      'SQL Injection Attempt',
    );
    this.checkPatterns(
      this.SQL_INJECTION_PATTERNS,
      req.body,
      'SQL Injection Attempt',
    );

    // Check for XSS
    this.checkPatterns(this.XSS_PATTERNS, req.query, 'XSS Attempt');
    this.checkPatterns(this.XSS_PATTERNS, req.body, 'XSS Attempt');

    // Check for path traversal
    this.checkPatterns(
      this.PATH_TRAVERSAL_PATTERNS,
      req.path,
      'Path Traversal Attempt',
    );

    // Validate content type
    if (req.method !== 'GET' && !req.is('application/json')) {
      throw new HttpException('Invalid Content-Type', HttpStatus.BAD_REQUEST);
    }

    // Validate request size
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 1024 * 1024) {
      // 1MB limit
      throw new HttpException('Request Too Large', HttpStatus.BAD_REQUEST);
    }
  }

  private checkPatterns(patterns: RegExp[], target: any, message: string) {
    const stringified = JSON.stringify(target);
    for (const pattern of patterns) {
      if (pattern.test(stringified)) {
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private addSecurityHeaders(res: Response) {
    res.setHeader('Content-Security-Policy', this.getCSPHeader());
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', this.getPermissionsPolicy());
  }

  private getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join('; ');
  }

  private getPermissionsPolicy(): string {
    return [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
    ].join(', ');
  }

  private handleViolation(ip: string) {
    this.BLOCKED_IPS.add(ip);
    setTimeout(() => this.BLOCKED_IPS.delete(ip), 3600000); // Unblock after 1 hour
  }
}
