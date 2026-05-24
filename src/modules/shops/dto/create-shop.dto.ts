import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShopDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  groupId: number;

  @ApiProperty({ example: 'Shop Demo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'shop-demo.example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  domain: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
