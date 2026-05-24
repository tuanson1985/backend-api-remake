import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { decrypt } from '../helpers/encrypt.helper.js';
import { ErrorCode } from '../constants/error-codes.js';

@Injectable()
export class ShopGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const shopId = request.headers['x-shop-id'];
    const shopKey = request.headers['x-shop-key'];

    if (!shopId || !shopKey) {
      throw new UnauthorizedException({
        error: ErrorCode.SHOP_INVALID_KEY,
        message: 'Thiếu X-Shop-Id hoặc X-Shop-Key header',
      });
    }

    const shop = await this.prisma.shop.findFirst({
      where: { id: parseInt(shopId, 10), deletedAt: null },
    });

    if (!shop) {
      throw new UnauthorizedException({
        error: ErrorCode.SHOP_NOT_FOUND,
        message: 'Shop không tồn tại',
      });
    }

    if (shop.status !== 'ACTIVE') {
      throw new ForbiddenException({
        error: ErrorCode.SHOP_INACTIVE,
        message: 'Shop đang bị vô hiệu hóa',
      });
    }

    const appKey = this.config.get<string>('app.appKey')!;
    let decryptedKey: string;
    try {
      decryptedKey = decrypt(shop.secretKey, appKey);
    } catch {
      throw new UnauthorizedException({
        error: ErrorCode.SHOP_INVALID_KEY,
        message: 'X-Shop-Key không hợp lệ',
      });
    }

    if (decryptedKey !== shopKey) {
      throw new UnauthorizedException({
        error: ErrorCode.SHOP_INVALID_KEY,
        message: 'X-Shop-Key không hợp lệ',
      });
    }

    request.shop = shop;
    return true;
  }
}
