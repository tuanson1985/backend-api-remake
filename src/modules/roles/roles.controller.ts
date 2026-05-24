import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthUser {
  id: number;
  shopId: number | null;
}

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách roles' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.rolesService.findAll(user.shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết role (kèm permissions)' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(user.shopId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo role mới' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user.shopId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật role' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(user.shopId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa role' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(user.shopId, id);
  }

  @Put(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gán permissions cho role (thay thế toàn bộ)' })
  assignPermissions(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(user.shopId, id, dto);
  }
}
