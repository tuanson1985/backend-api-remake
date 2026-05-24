import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShopGroupsService } from './shop-groups.service.js';
import { CreateShopGroupDto } from './dto/create-shop-group.dto.js';
import { UpdateShopGroupDto } from './dto/update-shop-group.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Shop Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shop-groups')
export class ShopGroupsController {
  constructor(private shopGroupsService: ShopGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhóm shop' })
  findAll() {
    return this.shopGroupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nhóm shop' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shopGroupsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhóm shop' })
  create(@Body() dto: CreateShopGroupDto) {
    return this.shopGroupsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nhóm shop' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShopGroupDto) {
    return this.shopGroupsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nhóm shop' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shopGroupsService.remove(id);
  }
}
