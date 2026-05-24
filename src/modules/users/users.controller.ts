import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { BalanceOperationDto } from './dto/balance-operation.dto.js';
import { AssignRolesDto } from './dto/assign-roles.dto.js';
import { AssignUserPermissionsDto } from './dto/assign-permissions.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthUser {
  id: number;
  shopId: number | null;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách người dùng' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryUserDto) {
    return this.usersService.findAll(user.shopId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết người dùng' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(user.shopId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.shopId, dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật người dùng' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.shopId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa người dùng (soft delete)' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(user.shopId, id);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset mật khẩu người dùng' })
  resetPassword(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(user.shopId, id, dto);
  }

  @Post(':id/balance/topup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nạp tiền vào tài khoản' })
  topup(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BalanceOperationDto,
  ) {
    return this.usersService.topup(user.shopId, id, dto);
  }

  @Post(':id/balance/deduct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trừ tiền từ tài khoản' })
  deduct(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BalanceOperationDto,
  ) {
    return this.usersService.deduct(user.shopId, id, dto);
  }

  @Put(':id/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gán roles cho user (thay thế toàn bộ)' })
  assignRoles(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(user.shopId, id, dto);
  }

  @Put(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gán direct permissions cho user (thay thế toàn bộ)' })
  assignPermissions(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignUserPermissionsDto,
  ) {
    return this.usersService.assignPermissions(user.shopId, id, dto);
  }
}
