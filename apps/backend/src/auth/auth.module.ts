import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { SupabaseAuthService } from './supabase.service';
import { SupabaseStrategy } from './supabase.strategy';
import { AuthService } from './auth.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'supabase' })],
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthService, SupabaseStrategy],
  exports: [AuthService, SupabaseAuthService],
})
export class AuthModule {}
