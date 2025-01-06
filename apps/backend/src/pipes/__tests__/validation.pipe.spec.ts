import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '../validation.pipe';
import { SecurityService } from '../../services/security.service';
import { CreateStoryDto } from '../../stories/dto/create-story.dto';
import { BadRequestException } from '@nestjs/common';

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;
  let securityService: SecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationPipe,
        {
          provide: SecurityService,
          useValue: {
            logSecurityEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<ValidationPipe>(ValidationPipe);
    securityService = module.get<SecurityService>(SecurityService);
  });

  it('should validate CreateStoryDto', async () => {
    const dto = {
      title: 'Valid Title',
      content: 'Valid content that meets the minimum length requirement',
    };

    const result = await pipe.transform(dto, {
      metatype: CreateStoryDto,
      type: 'body',
      data: '',
    });
    expect(result).toEqual(dto);
  });

  it('should reject invalid CreateStoryDto', async () => {
    const dto = {
      title: '', // Empty title
      content: 'Too short', // Content too short
    };

    await expect(
      pipe.transform(dto, { metatype: CreateStoryDto, type: 'body', data: '' }),
    ).rejects.toThrow(BadRequestException);

    expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
      'validation-failure',
      expect.any(Object),
    );
  });

  it('should pass through non-DTO values', async () => {
    const value = 'simple string';
    const result = await pipe.transform(value, {
      metatype: String,
      type: 'body',
      data: '',
    });
    expect(result).toBe(value);
  });
});
