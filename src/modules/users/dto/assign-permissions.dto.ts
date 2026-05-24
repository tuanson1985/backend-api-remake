import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignUserPermissionsDto {
  @ApiProperty({ type: [Number], description: 'Danh sách permission IDs' })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  permissionIds: number[];
}
