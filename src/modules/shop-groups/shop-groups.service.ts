import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateShopGroupDto } from './dto/create-shop-group.dto.js';
import { UpdateShopGroupDto } from './dto/update-shop-group.dto.js';
import { ErrorCode } from '../../common/constants/error-codes.js';

@Injectable()
export class ShopGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shopGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { shops: true } } },
    });
  }

  async findOne(id: number) {
    const group = await this.prisma.shopGroup.findUnique({
      where: { id },
      include: { shops: { where: { deletedAt: null }, select: { id: true, title: true, domain: true, status: true } } },
    });
    if (!group) {
      throw new NotFoundException({ error: ErrorCode.SHOP_GROUP_NOT_FOUND, message: 'Nhóm shop không tồn tại' });
    }
    return group;
  }

  async create(dto: CreateShopGroupDto) {
    return this.prisma.shopGroup.create({
      data: {
        title: dto.title,
        currency: dto.currency ?? 'VND',
        timezone: dto.timezone ?? 'Asia/Ho_Chi_Minh',
        language: dto.language ?? 'vi',
      },
    });
  }

  async update(id: number, dto: UpdateShopGroupDto) {
    await this.findOne(id);
    return this.prisma.shopGroup.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.shopGroup.delete({ where: { id } });
  }
}
