import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@prisma/prisma.service';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { LoginDto } from './dto/auth.dto';

@Injectable()
export class SupabaseAuthService {
  private supabase: SupabaseClient;
  private rateLimiter: RateLimiterMemory;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const supabaseUrl = this.validateEnvVar('SUPABASE_URL');
    const supabaseKey = this.validateEnvVar('SUPABASE_ANON_KEY');

    this.supabase = createClient(supabaseUrl, supabaseKey);

    this.rateLimiter = new RateLimiterMemory({
      points: 5,
      duration: 60,
    });
  }

  private validateEnvVar(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private async validateCredentials(email: string, password: string) {
    const credentials = plainToClass(LoginDto, { email, password });
    const errors = await validate(credentials);
    if (errors.length > 0) {
      throw new UnauthorizedException('Invalid credentials format');
    }
  }

  async signUp(email: string, password: string) {
    await this.validateCredentials(email, password);

    const { data: authData, error: authError } =
      await this.supabase.auth.signUp({
        email,
        password,
      });

    if (authError) throw authError;

    const user = await this.prisma.user.create({
      data: {
        email,
        supabaseId: authData.user.id,
        password,
      },
    });

    return {
      user,
      session: authData.session,
    };
  }

  async signIn(email: string, password: string) {
    try {
      await this.rateLimiter.consume(email);
      await this.validateCredentials(email, password);

      const { data: authData, error: authError } =
        await this.supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      const user = await this.prisma.user.findUnique({
        where: { supabaseId: authData.user.id },
      });

      return {
        user,
        session: authData.session,
      };
    } catch (error) {
      if (error.consumedPoints) {
        throw new UnauthorizedException('Too many login attempts');
      }
      throw error;
    }
  }

  private tokenCache = new Map<string, { user: any; timestamp: number }>();
  private readonly TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async validateToken(token: string) {
    // Check cache first
    const cached = this.tokenCache.get(token);
    if (cached && Date.now() - cached.timestamp < this.TOKEN_CACHE_TTL) {
      return cached.user;
    }

    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);
    if (error) throw error;

    const dbUser = await this.prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    // Cache the result
    this.tokenCache.set(token, {
      user: dbUser,
      timestamp: Date.now(),
    });

    return dbUser;
  }
}
