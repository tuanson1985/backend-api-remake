import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateShopDto } from './create-shop.dto.js';
import { ShopStatus } from '../../../generated/prisma/client.js';

export class UpdateShopDto extends PartialType(OmitType(CreateShopDto, ['groupId'] as const)) {
  @ApiProperty({ enum: ShopStatus, required: false })
  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
