import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from '../progress.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportFormat } from '../types/export-format.enum';

describe('ProgressService', () => {
  let service: ProgressService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: PrismaService,
          useValue: {
            storyProgress: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('exportUserProgress', () => {
    const mockProgress = [
      {
        story: {
          title: 'Test Story',
          content: 'Page 1\nPage 2\nPage 3',
        },
        currentPage: 2,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      (prismaService.storyProgress.findMany as jest.Mock).mockResolvedValue(
        mockProgress,
      );
    });

    it('should export progress as JSON', async () => {
      const result = await service.exportUserProgress(1, ExportFormat.JSON);
      expect(JSON.parse(result)).toHaveLength(1);
      expect(JSON.parse(result)[0]).toHaveProperty('storyTitle', 'Test Story');
    });

    it('should export progress as CSV', async () => {
      const result = await service.exportUserProgress(1, ExportFormat.CSV);
      expect(result).toContain('storyTitle');
      expect(result).toContain('Test Story');
    });

    it('should export progress as PDF', async () => {
      const result = await service.exportUserProgress(1, ExportFormat.PDF);
      expect(Buffer.isBuffer(result)).toBeTruthy();
    });
  });
});
