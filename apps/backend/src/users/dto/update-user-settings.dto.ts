import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export class UpdateUserSettingsDto {
  @ApiProperty({ enum: Theme, description: 'User preferred theme' })
  @IsEnum(Theme)
  @IsOptional()
  theme?: Theme;

  @ApiProperty({ description: 'Enable/disable notifications' })
  @IsBoolean()
  @IsOptional()
  notifications?: boolean;

  @ApiProperty({ description: 'Font size for reading' })
  @IsEnum(['small', 'medium', 'large'])
  @IsOptional()
  fontSize?: 'small' | 'medium' | 'large';
}
