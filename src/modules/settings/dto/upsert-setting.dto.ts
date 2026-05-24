import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  value: string | null;
}
