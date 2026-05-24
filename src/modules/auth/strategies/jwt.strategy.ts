import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service.js';
import { ErrorCode } from '../../../common/constants/error-codes.js';

export interface JwtPayload {
  sub: number;
  shopId: number | null;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        shopId: true,
        username: true,
        email: true,
        status: true,
        isFirstLogin: true,
        twoFaEnabled: true,
      },
    });

    if (!user || user.status === 'BANNED' || user.status === 'INACTIVE') {
      throw new UnauthorizedException({
        error: ErrorCode.UNAUTHORIZED,
        message: 'Tài khoản không hợp lệ',
      });
    }

    return user;
  }
}
