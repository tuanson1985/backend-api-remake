import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { comparePassword, hashPassword } from '../../common/helpers/hash.helper.js';
import { ErrorCode } from '../../common/constants/error-codes.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto, shopId: number | null, ipAddress?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        shopId: shopId,
        username: dto.username,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        error: ErrorCode.INVALID_CREDENTIALS,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
    }

    if (user.status === 'INACTIVE' || user.status === 'BANNED') {
      throw new ForbiddenException({
        error: ErrorCode.USER_INACTIVE,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    const passwordValid = await comparePassword(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException({
        error: ErrorCode.INVALID_CREDENTIALS,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
    }

    if (user.twoFaEnabled) {
      if (!dto.twoFaCode) {
        throw new UnauthorizedException({
          error: ErrorCode.TWO_FA_REQUIRED,
          message: 'Cần nhập mã xác thực 2FA',
        });
      }
      // 2FA validation sẽ implement khi tích hợp speakeasy
    }

    const tokens = await this.generateTokens(user.id, user.shopId, user.username, ipAddress);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isFirstLogin: user.isFirstLogin,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        shopId: user.shopId,
        isFirstLogin: user.isFirstLogin,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: number; shopId: number | null; username: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException({
        error: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash, expiresAt: { gt: new Date() } },
    });

    if (!stored) {
      throw new UnauthorizedException({
        error: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token không hợp lệ hoặc đã bị thu hồi',
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, shopId: true, username: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        error: ErrorCode.UNAUTHORIZED,
        message: 'Tài khoản không hợp lệ',
      });
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = await this.generateTokens(user.id, user.shopId, user.username);
    return tokens;
  }

  async logout(userId: number, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({
      where: { userId, tokenHash },
    });
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    const valid = await comparePassword(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException({
        error: ErrorCode.INVALID_CREDENTIALS,
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    const hashed = await hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, isFirstLogin: false },
    });
  }

  private async generateTokens(
    userId: number,
    shopId: number | null,
    username: string,
    ipAddress?: string,
  ) {
    const payload = { sub: userId, shopId, username };

    const accessExpires = (this.config.get<string>('jwt.accessExpires') || '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: accessExpires,
    });

    const refreshExpires = (this.config.get<string>('jwt.refreshExpires') || '30d') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: refreshExpires,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        ipAddress,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
