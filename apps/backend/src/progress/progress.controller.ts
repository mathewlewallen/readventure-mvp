import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update progress' })
  @ApiResponse({
    status: 201,
    description: 'The progress has been successfully created or updated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createOrUpdate(@Body() createProgressDto: CreateProgressDto) {
    return this.progressService.createOrUpdate(createProgressDto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get progress for a user' })
  @ApiResponse({ status: 200, description: 'Return the user progress.' })
  @ApiResponse({ status: 404, description: 'User progress not found.' })
  async findByUserId(@Param('userId') userId: string) {
    return this.progressService.findByUserId(userId);
  }
}
