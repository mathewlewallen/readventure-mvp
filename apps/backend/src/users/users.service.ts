import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserSettings(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.settings;
  }

  async updateUserSettings(
    userId: number,
    updateUserSettingsDto: UpdateUserSettingsDto,
  ) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          upsert: {
            create: updateUserSettingsDto,
            update: updateUserSettingsDto,
          },
        },
      },
      select: { settings: true },
    });

    return updatedUser.settings;
  }
}
