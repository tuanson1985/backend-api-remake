import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ErrorCode } from '../../common/constants/error-codes.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException({ error: ErrorCode.NOT_FOUND, message: 'Permission không tồn tại' });
    }
    return permission;
  }

  async create(dto: CreatePermissionDto) {
    const exists = await this.prisma.permission.findUnique({ where: { name: dto.name } });
    if (exists) {
      throw new ConflictException({ error: ErrorCode.DUPLICATE_REQUEST, message: 'Permission name đã tồn tại' });
    }
    return this.prisma.permission.create({ data: dto });
  }

  async update(id: number, dto: UpdatePermissionDto) {
    await this.findOne(id);
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.permission.delete({ where: { id } });
  }
}
