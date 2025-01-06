import {
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsEmail,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_REGEX } from '../constants/passwordRegex';

export class LoginDto {
  @ApiProperty({ description: 'User email address' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Password must contain at least 1 uppercase, 1 lowercase, and 1 number or special character',
  })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: 'Password is too weak' })
  password: string;
}

export class SignupDto extends LoginDto {
  @ApiProperty({ description: 'User full name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'Unique identifier from Supabase' })
  @IsString()
  @IsNotEmpty()
  supabaseId: string;
}

export class UserPayloadDto {
  @ApiProperty({ description: 'User ID' })
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'User email address' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ description: 'User details' })
  @IsObject()
  @ValidateNested()
  @Type(() => UserPayloadDto)
  user: UserPayloadDto;
}
