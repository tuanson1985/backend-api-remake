import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ErrorCode } from '../../common/constants/error-codes.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: number | null) {
    const where = shopId !== null ? { shopId } : {};
    return this.prisma.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shopId: true,
        name: true,
        title: true,
        createdAt: true,
        _count: { select: { userRoles: true, rolePermissions: true } },
      },
    });
  }

  async findOne(shopId: number | null, id: number) {
    const where = {
      id,
      ...(shopId !== null ? { shopId } : {}),
    };

    const role = await this.prisma.role.findFirst({
      where,
      include: {
        rolePermissions: {
          include: {
            permission: { select: { id: true, name: true, title: true, module: true, action: true } },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException({ error: ErrorCode.NOT_FOUND, message: 'Role không tồn tại' });
    }

    return role;
  }

  async create(shopId: number | null, dto: CreateRoleDto) {
    const exists = await this.prisma.role.findFirst({
      where: { shopId, name: dto.name },
    });
    if (exists) {
      throw new ConflictException({ error: ErrorCode.DUPLICATE_REQUEST, message: 'Role name đã tồn tại trong shop' });
    }

    return this.prisma.role.create({
      data: { shopId, name: dto.name, title: dto.title },
    });
  }

  async update(shopId: number | null, id: number, dto: UpdateRoleDto) {
    await this.findOne(shopId, id);

    if (dto.name) {
      const exists = await this.prisma.role.findFirst({
        where: { shopId, name: dto.name, NOT: { id } },
      });
      if (exists) {
        throw new ConflictException({ error: ErrorCode.DUPLICATE_REQUEST, message: 'Role name đã tồn tại trong shop' });
      }
    }

    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async remove(shopId: number | null, id: number) {
    await this.findOne(shopId, id);
    await this.prisma.role.delete({ where: { id } });
  }

  async assignPermissions(shopId: number | null, id: number, dto: AssignPermissionsDto) {
    await this.findOne(shopId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });

      if (dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    return this.findOne(shopId, id);
  }
}
