import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { hashPassword } from '../../common/helpers/hash.helper.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/helpers/pagination.helper.js';
import { ErrorCode } from '../../common/constants/error-codes.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { BalanceOperationDto } from './dto/balance-operation.dto.js';
import { AssignRolesDto } from './dto/assign-roles.dto.js';
import { AssignUserPermissionsDto } from './dto/assign-permissions.dto.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: number | null, query: QueryUserDto) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const where = {
      deletedAt: null,
      ...(shopId !== null ? { shopId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { username: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          shopId: true,
          username: true,
          email: true,
          balance: true,
          status: true,
          isFirstLogin: true,
          lastLoginAt: true,
          createdAt: true,
          profile: {
            select: { firstName: true, lastName: true, phone: true, avatar: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(shopId: number | null, id: number) {
    const where = {
      id,
      deletedAt: null,
      ...(shopId !== null ? { shopId } : {}),
    };

    const user = await this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        shopId: true,
        username: true,
        email: true,
        balance: true,
        status: true,
        isFirstLogin: true,
        twoFaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        userRoles: {
          select: { role: { select: { id: true, name: true, title: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({ error: ErrorCode.USER_NOT_FOUND, message: 'Người dùng không tồn tại' });
    }

    return user;
  }

  async create(shopId: number | null, dto: CreateUserDto, createdBy: number) {
    const exists = await this.prisma.user.findFirst({
      where: { shopId, username: dto.username, deletedAt: null },
    });
    if (exists) {
      throw new ConflictException({ error: ErrorCode.USER_ALREADY_EXISTS, message: 'Username đã tồn tại trong shop' });
    }

    const emailExists = await this.prisma.user.findFirst({
      where: { shopId, email: dto.email, deletedAt: null },
    });
    if (emailExists) {
      throw new ConflictException({ error: ErrorCode.USER_ALREADY_EXISTS, message: 'Email đã tồn tại trong shop' });
    }

    const hashedPassword = await hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          shopId,
          username: dto.username,
          email: dto.email,
          password: hashedPassword,
          status: dto.status,
          createdBy,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: created.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });

      return created;
    });

    const { password: _, ...rest } = user;
    return rest;
  }

  async update(shopId: number | null, id: number, dto: UpdateUserDto) {
    await this.findOne(shopId, id);

    if (dto.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { shopId, email: dto.email, deletedAt: null, NOT: { id } },
      });
      if (emailExists) {
        throw new ConflictException({ error: ErrorCode.USER_ALREADY_EXISTS, message: 'Email đã tồn tại trong shop' });
      }
    }

    const { firstName, lastName, phone, avatar, ...userFields } = dto;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({ where: { id }, data: userFields });
      }

      const profileUpdate = { firstName, lastName, phone, avatar };
      const hasProfileUpdate = Object.values(profileUpdate).some((v) => v !== undefined);
      if (hasProfileUpdate) {
        await tx.userProfile.upsert({
          where: { userId: id },
          update: profileUpdate,
          create: { userId: id, ...profileUpdate },
        });
      }
    });

    return this.findOne(shopId, id);
  }

  async remove(shopId: number | null, id: number) {
    await this.findOne(shopId, id);
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async resetPassword(shopId: number | null, id: number, dto: ResetPasswordDto) {
    await this.findOne(shopId, id);
    const hashedPassword = await hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword, isFirstLogin: true },
    });
  }

  async topup(shopId: number | null, id: number, dto: BalanceOperationDto) {
    await this.findOne(shopId, id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { balance: { increment: dto.amount } },
      select: { id: true, balance: true },
    });
    return updated;
  }

  async deduct(shopId: number | null, id: number, dto: BalanceOperationDto) {
    return this.prisma.$transaction(async (tx) => {
      const where = {
        id,
        deletedAt: null,
        ...(shopId !== null ? { shopId } : {}),
      };

      const user = await tx.user.findFirst({ where, select: { id: true, balance: true } });
      if (!user) {
        throw new NotFoundException({ error: ErrorCode.USER_NOT_FOUND, message: 'Người dùng không tồn tại' });
      }

      if (user.balance.toNumber() < dto.amount) {
        throw new BadRequestException({
          error: ErrorCode.INSUFFICIENT_BALANCE,
          message: 'Số dư không đủ',
        });
      }

      return tx.user.update({
        where: { id },
        data: { balance: { decrement: dto.amount } },
        select: { id: true, balance: true },
      });
    });
  }

  async assignRoles(shopId: number | null, id: number, dto: AssignRolesDto) {
    await this.findOne(shopId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        });
      }
    });

    return this.findOne(shopId, id);
  }

  async assignPermissions(shopId: number | null, id: number, dto: AssignUserPermissionsDto) {
    await this.findOne(shopId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({ where: { userId: id } });
      if (dto.permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({ userId: id, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    return this.findOne(shopId, id);
  }
}
