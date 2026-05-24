import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users.create' })
  @IsString()
  @MaxLength(125)
  name: string;

  @ApiProperty({ required: false, example: 'Tạo người dùng' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ required: false, example: 'users' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;

  @ApiProperty({ required: false, example: 'create' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  parentId?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}
