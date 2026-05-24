import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ErrorCode } from '../../common/constants/error-codes.js';
import { UpsertSettingDto } from './dto/upsert-setting.dto.js';
import { BulkUpsertSettingsDto } from './dto/bulk-upsert-settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private requireShopId(shopId: number | null): number {
    if (shopId === null) {
      throw new BadRequestException({
        error: ErrorCode.VALIDATION_ERROR,
        message: 'Settings yêu cầu shop context',
      });
    }
    return shopId;
  }

  async findAll(shopId: number | null) {
    const sid = this.requireShopId(shopId);
    return this.prisma.setting.findMany({
      where: { shopId: sid },
      orderBy: { key: 'asc' },
      select: { id: true, key: true, value: true, updatedAt: true },
    });
  }

  async findByKey(shopId: number | null, key: string) {
    const sid = this.requireShopId(shopId);
    const setting = await this.prisma.setting.findUnique({
      where: { shopId_key: { shopId: sid, key } },
    });
    if (!setting) {
      throw new NotFoundException({ error: ErrorCode.NOT_FOUND, message: `Setting '${key}' không tồn tại` });
    }
    return setting;
  }

  async upsert(shopId: number | null, key: string, dto: UpsertSettingDto) {
    const sid = this.requireShopId(shopId);
    return this.prisma.setting.upsert({
      where: { shopId_key: { shopId: sid, key } },
      update: { value: dto.value },
      create: { shopId: sid, key, value: dto.value },
    });
  }

  async bulkUpsert(shopId: number | null, dto: BulkUpsertSettingsDto) {
    const sid = this.requireShopId(shopId);
    const results = await this.prisma.$transaction(
      dto.settings.map((item) =>
        this.prisma.setting.upsert({
          where: { shopId_key: { shopId: sid, key: item.key } },
          update: { value: item.value },
          create: { shopId: sid, key: item.key, value: item.value },
        }),
      ),
    );
    return results;
  }

  async remove(shopId: number | null, key: string) {
    const sid = this.requireShopId(shopId);
    const setting = await this.prisma.setting.findUnique({
      where: { shopId_key: { shopId: sid, key } },
    });
    if (!setting) {
      throw new NotFoundException({ error: ErrorCode.NOT_FOUND, message: `Setting '${key}' không tồn tại` });
    }
    await this.prisma.setting.delete({ where: { shopId_key: { shopId: sid, key } } });
  }
}
