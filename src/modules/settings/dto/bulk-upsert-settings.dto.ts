import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SettingItemDto {
  @ApiProperty({ example: 'site_name' })
  @IsString()
  @MaxLength(255)
  key: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  value: string | null;
}

export class BulkUpsertSettingsDto {
  @ApiProperty({ type: [SettingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings: SettingItemDto[];
}
