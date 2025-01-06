import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WAFMiddleware } from '../waf.middleware';
import { SecurityService } from '../../services/security.service';
import { HttpException } from '@nestjs/common';

describe('WAFMiddleware', () => {
  let middleware: WAFMiddleware;
  let securityService: SecurityService;

  const mockRequest = {
    ip: '127.0.0.1',
    path: '/api/stories',
    query: {},
    body: {},
    headers: {},
    is: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
  };

  const mockNext = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WAFMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: SecurityService,
          useValue: {
            logSecurityEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<WAFMiddleware>(WAFMiddleware);
    securityService = module.get<SecurityService>(SecurityService);
  });

  it('should allow valid requests', async () => {
    await middleware.use(mockRequest as any, mockResponse as any, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should block SQL injection attempts', async () => {
    const maliciousRequest = {
      ...mockRequest,
      query: { q: 'SELECT * FROM users; DROP TABLE users;' },
    };

    await expect(
      middleware.use(maliciousRequest as any, mockResponse as any, mockNext),
    ).rejects.toThrow(HttpException);

    expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
      'waf-block',
      expect.any(Object),
    );
  });

  it('should block XSS attempts', async () => {
    const maliciousRequest = {
      ...mockRequest,
      body: { content: "<script>alert('xss')</script>" },
    };

    await expect(
      middleware.use(maliciousRequest as any, mockResponse as any, mockNext),
    ).rejects.toThrow(HttpException);
  });

  it('should add security headers', async () => {
    await middleware.use(mockRequest as any, mockResponse as any, mockNext);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.any(String),
    );
  });
});
