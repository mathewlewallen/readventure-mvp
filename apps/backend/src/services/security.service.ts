import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface RateLimit {
  count: number;
  firstRequest: number;
}

@Injectable()
export class SecurityService {
  private readonly saltRounds = 10;
  private readonly rateLimits: Map<string, RateLimit> = new Map();
  private readonly maxRequests = 100;
  private readonly timeWindow = 60 * 1000;

  validateInput(input: string): string {
    if (!input) {
      return '';
    }

    const sanitized = input.replace(/<[^>]*>/g, '').replace(/[;&<>"']/g, '');

    return sanitized;
  }

  generateHash(data: string): string {
    const salt = crypto.randomBytes(this.saltRounds).toString('hex');
    return (
      crypto
        .createHash('sha256')
        .update(data + salt)
        .digest('hex') +
      ':' +
      salt
    );
  }

  isAllowedOrigin(origin: string): boolean {
    const allowedOrigins = [
      'localhost',
      'readventure.com', // Add your domains here
    ];

    return allowedOrigins.some((allowed) => origin.includes(allowed));
  }

  checkRateLimit(ip: string, endpoint: string): boolean {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const rateLimit = this.rateLimits.get(key);

    if (!rateLimit) {
      this.rateLimits.set(key, { count: 1, firstRequest: now });
      return true;
    }

    if (now - rateLimit.firstRequest >= this.timeWindow) {
      this.rateLimits.set(key, { count: 1, firstRequest: now });
      return true;
    }

    if (rateLimit.count >= this.maxRequests) {
      return false;
    }

    rateLimit.count++;
    this.rateLimits.set(key, rateLimit);
    return true;
  }

  async logSecurityEvent(eventType: string, details: any) {
    console.log(`Security event ${eventType}:`, details);
  }
}
