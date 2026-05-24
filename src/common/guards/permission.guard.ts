import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { ErrorCode } from '../constants/error-codes.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // System admin (shopId = null) có toàn quyền
    if (user.shopId === null) return true;

    const userPerms = await this.prisma.userPermission.findMany({
      where: { userId: user.id },
      select: { permission: { select: { name: true } } },
    });

    const rolePerms = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      select: {
        role: {
          select: {
            rolePermissions: { select: { permission: { select: { name: true } } } },
          },
        },
      },
    });

    const permSet = new Set<string>();
    userPerms.forEach((up) => permSet.add(up.permission.name));
    rolePerms.forEach((ur) =>
      ur.role.rolePermissions.forEach((rp) => permSet.add(rp.permission.name)),
    );

    const hasAll = required.every((perm) => permSet.has(perm));
    if (!hasAll) {
      throw new ForbiddenException({
        error: ErrorCode.FORBIDDEN,
        message: 'Không có quyền thực hiện hành động này',
      });
    }

    return true;
  }
}
