import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiResponse({
    status: 201,
    description: 'The story has been successfully created.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Body() createStoryDto: CreateStoryDto) {
    return this.storiesService.create(createStoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stories' })
  @ApiResponse({ status: 200, description: 'Return all stories.' })
  async findAll() {
    return this.storiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a story by id' })
  @ApiResponse({ status: 200, description: 'Return the story.' })
  @ApiResponse({ status: 404, description: 'Story not found.' })
  async findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended stories for the user' })
  @ApiResponse({ status: 200, description: 'Return recommended stories.' })
  async getRecommendedStories(@User() user) {
    return this.storiesService.getRecommendedStories(user.id);
  }
}
