import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { encrypt, decrypt, generateSecretKey } from '../../common/helpers/encrypt.helper.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/helpers/pagination.helper.js';
import { ErrorCode } from '../../common/constants/error-codes.js';
import { CreateShopDto } from './dto/create-shop.dto.js';
import { UpdateShopDto } from './dto/update-shop.dto.js';
import { QueryShopDto } from './dto/query-shop.dto.js';

@Injectable()
export class ShopsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private get appKey() {
    return this.config.get<string>('app.appKey')!;
  }

  async findAll(query: QueryShopDto) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.groupId ? { groupId: query.groupId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { domain: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          domain: true,
          status: true,
          note: true,
          groupId: true,
          createdAt: true,
          group: { select: { id: true, title: true, currency: true } },
        },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const shop = await this.prisma.shop.findFirst({
      where: { id, deletedAt: null },
      include: { group: true },
    });
    if (!shop) {
      throw new NotFoundException({ error: ErrorCode.SHOP_NOT_FOUND, message: 'Shop không tồn tại' });
    }
    const { secretKey: _, ...rest } = shop;
    return rest;
  }

  async getSecretKey(id: number) {
    const shop = await this.prisma.shop.findFirst({ where: { id, deletedAt: null } });
    if (!shop) {
      throw new NotFoundException({ error: ErrorCode.SHOP_NOT_FOUND, message: 'Shop không tồn tại' });
    }
    return { secretKey: decrypt(shop.secretKey, this.appKey) };
  }

  async create(dto: CreateShopDto) {
    const exists = await this.prisma.shop.findFirst({ where: { domain: dto.domain, deletedAt: null } });
    if (exists) {
      throw new ConflictException({ error: ErrorCode.SHOP_ALREADY_EXISTS, message: 'Domain đã tồn tại' });
    }

    const rawKey = generateSecretKey();
    const encryptedKey = encrypt(rawKey, this.appKey);

    const shop = await this.prisma.shop.create({
      data: {
        groupId: dto.groupId,
        title: dto.title,
        domain: dto.domain,
        secretKey: encryptedKey,
        note: dto.note,
      },
    });

    return { ...shop, secretKey: rawKey };
  }

  async update(id: number, dto: UpdateShopDto) {
    await this.findOne(id);

    if (dto.domain) {
      const exists = await this.prisma.shop.findFirst({
        where: { domain: dto.domain, deletedAt: null, NOT: { id } },
      });
      if (exists) {
        throw new ConflictException({ error: ErrorCode.SHOP_ALREADY_EXISTS, message: 'Domain đã tồn tại' });
      }
    }

    const shop = await this.prisma.shop.update({
      where: { id },
      data: dto,
    });
    const { secretKey: _, ...rest } = shop;
    return rest;
  }

  async regenerateKey(id: number) {
    await this.findOne(id);
    const rawKey = generateSecretKey();
    const encryptedKey = encrypt(rawKey, this.appKey);
    await this.prisma.shop.update({ where: { id }, data: { secretKey: encryptedKey } });
    return { secretKey: rawKey };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.shop.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
