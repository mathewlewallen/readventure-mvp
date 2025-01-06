import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StoriesModule } from './stories/stories.module';
import { ProgressModule } from './progress/progress.module';
import { MiddlewareModule } from './middleware/middleware.module';
import { PipesModule } from './pipes/pipes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { WAFMiddleware } from './middleware/waf.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { SecurityService } from './services/security.service';
import { JwtModule } from './jwt/jwt.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    AuthModule,
    StoriesModule,
    ProgressModule,
    MiddlewareModule,
    PipesModule,
    PrismaModule,
    ServicesModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, SecurityService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WAFMiddleware, RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
