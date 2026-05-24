import { PartialType } from '@nestjs/swagger';
import { CreateShopGroupDto } from './create-shop-group.dto.js';

export class UpdateShopGroupDto extends PartialType(CreateShopGroupDto) {}
