import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

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
            story: {
              findUnique: jest.fn(),
            },
            storyProgress: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('updateProgress', () => {
    it('should update progress for existing story', async () => {
      const mockStory = {
        id: 1,
        content: 'Page 1\nPage 2\nPage 3',
      };

      const mockProgress = {
        id: 1,
        userId: 1,
        storyId: 1,
        currentPage: 1,
        isCompleted: false,
      };

      jest
        .spyOn(prismaService.story, 'findUnique')
        .mockResolvedValue(mockStory);
      jest
        .spyOn(prismaService.storyProgress, 'upsert')
        .mockResolvedValue(mockProgress);

      const result = await service.updateProgress(1, 1, 1);

      expect(result).toEqual(mockProgress);
      expect(prismaService.storyProgress.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent story', async () => {
      jest.spyOn(prismaService.story, 'findUnique').mockResolvedValue(null);

      await expect(service.updateProgress(1, 999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
