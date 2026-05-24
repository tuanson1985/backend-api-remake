import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShopsService } from './shops.service.js';
import { CreateShopDto } from './dto/create-shop.dto.js';
import { UpdateShopDto } from './dto/update-shop.dto.js';
import { QueryShopDto } from './dto/query-shop.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Shops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shops')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách shops' })
  findAll(@Query() query: QueryShopDto) {
    return this.shopsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết shop' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shopsService.findOne(id);
  }

  @Get(':id/secret-key')
  @ApiOperation({ summary: 'Xem secret key (đã decrypt)' })
  getSecretKey(@Param('id', ParseIntPipe) id: number) {
    return this.shopsService.getSecretKey(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo shop mới' })
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật shop' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShopDto) {
    return this.shopsService.update(id, dto);
  }

  @Post(':id/regenerate-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tạo lại secret key' })
  regenerateKey(@Param('id', ParseIntPipe) id: number) {
    return this.shopsService.regenerateKey(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa shop (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shopsService.remove(id);
  }
}
