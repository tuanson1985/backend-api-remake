import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ShopGroupsModule } from './modules/shop-groups/shop-groups.module.js';
import { ShopsModule } from './modules/shops/shops.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import appConfig from './config/app.config.js';
import jwtConfig from './config/jwt.config.js';
import redisConfig from './config/redis.config.js';
import storageConfig from './config/storage.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, storageConfig],
    }),
    PrismaModule,
    AuthModule,
    ShopGroupsModule,
    ShopsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SettingsModule,
  ],
})
export class AppModule {}
