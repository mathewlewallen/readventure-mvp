import { Module } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';

@Module({
  providers: [StoriesService],
  controllers: [StoriesController],
})
export class StoriesModule {}
