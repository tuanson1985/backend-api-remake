import { Module } from '@nestjs/common';
import { ShopGroupsController } from './shop-groups.controller.js';
import { ShopGroupsService } from './shop-groups.service.js';

@Module({
  controllers: [ShopGroupsController],
  providers: [ShopGroupsService],
  exports: [ShopGroupsService],
})
export class ShopGroupsModule {}
