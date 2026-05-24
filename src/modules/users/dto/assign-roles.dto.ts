import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignRolesDto {
  @ApiProperty({ type: [Number], description: 'Danh sách role IDs' })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  roleIds: number[];
}
