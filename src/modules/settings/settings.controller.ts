import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service.js';
import { UpsertSettingDto } from './dto/upsert-setting.dto.js';
import { BulkUpsertSettingsDto } from './dto/bulk-upsert-settings.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthUser {
  id: number;
  shopId: number | null;
}

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả settings của shop' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.settingsService.findAll(user.shopId);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Lấy setting theo key' })
  findByKey(@CurrentUser() user: AuthUser, @Param('key') key: string) {
    return this.settingsService.findByKey(user.shopId, key);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk upsert nhiều settings cùng lúc' })
  bulkUpsert(@CurrentUser() user: AuthUser, @Body() dto: BulkUpsertSettingsDto) {
    return this.settingsService.bulkUpsert(user.shopId, dto);
  }

  @Put(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tạo hoặc cập nhật setting theo key' })
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
  ) {
    return this.settingsService.upsert(user.shopId, key, dto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa setting theo key' })
  remove(@CurrentUser() user: AuthUser, @Param('key') key: string) {
    return this.settingsService.remove(user.shopId, key);
  }
}
