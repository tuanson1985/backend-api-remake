import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'manager' })
  @IsString()
  @MaxLength(125)
  name: string;

  @ApiProperty({ required: false, example: 'Quản lý' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}
