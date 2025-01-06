import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllStories(page = 1, limit = 10) {
    const cacheKey = `stories:${page}:${limit}`;
    const cachedStories = await this.cacheManager.get(cacheKey);

    if (cachedStories) {
      return cachedStories;
    }

    const skip = (page - 1) * limit;
    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.story.count(),
    ]);

    const result = {
      stories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 60000); // Cache for 1 minute
    return result;
  }

  async getStoryById(id: number) {
    const cacheKey = `story:${id}`;
    const cachedStory = await this.cacheManager.get(cacheKey);

    if (cachedStory) {
      return cachedStory;
    }

    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, story, 300000); // Cache for 5 minutes
    return story;
  }

  async getRecommendedStories(userId: number) {
    // Get the user's reading history
    const userProgress = await this.prisma.storyProgress.findMany({
      where: { userId },
      include: { story: true },
    });

    // Get all stories
    const allStories = await this.prisma.story.findMany();

    // Simple recommendation logic: recommend stories the user hasn't read yet
    const readStoryIds = new Set(
      userProgress.map((progress) => progress.storyId),
    );
    const recommendedStories = allStories.filter(
      (story) => !readStoryIds.has(story.id),
    );

    // Sort recommended stories by creation date (newest first)
    recommendedStories.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    // Return top 5 recommended stories
    return recommendedStories.slice(0, 5);
  }
}
