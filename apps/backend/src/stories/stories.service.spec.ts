import { Test, TestingModule } from '@nestjs/testing';
import { StoriesService } from './stories.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('StoriesService', () => {
  let service: StoriesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        {
          provide: PrismaService,
          useValue: {
            story: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createStory', () => {
    it('should create a new story', async () => {
      const mockStory = { id: 1, title: 'Test Story', content: 'Content' };
      (prismaService.story.create as jest.Mock).mockResolvedValue(mockStory);

      const result = await service.createStory('Test Story', 'Content');

      expect(result).toEqual(mockStory);
      expect(prismaService.story.create).toHaveBeenCalledWith({
        data: { title: 'Test Story', content: 'Content' },
      });
    });
  });

  describe('getAllStories', () => {
    it('should return all stories', async () => {
      const mockStories = [
        { id: 1, title: 'Story 1', content: 'Content 1' },
        { id: 2, title: 'Story 2', content: 'Content 2' },
      ];
      (prismaService.story.findMany as jest.Mock).mockResolvedValue(
        mockStories,
      );

      const result = await service.getAllStories();

      expect(result).toEqual(mockStories);
    });
  });

  describe('getStoryById', () => {
    it('should return a story by id', async () => {
      const mockStory = { id: 1, title: 'Test Story', content: 'Content' };
      (prismaService.story.findUnique as jest.Mock).mockResolvedValue(
        mockStory,
      );

      const result = await service.getStoryById(1);

      expect(result).toEqual(mockStory);
      expect(prismaService.story.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if story not found', async () => {
      (prismaService.story.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getStoryById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
