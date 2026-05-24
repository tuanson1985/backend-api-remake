import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumberString } from 'class-validator';

export class CreateShopGroupDto {
  @ApiProperty({ example: 'Nhóm mặc định' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'VND', default: 'VND', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiProperty({ example: 'vi', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
