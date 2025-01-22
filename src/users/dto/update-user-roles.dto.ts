import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { UserRoles } from '../entities/user.entity';

export class UpdateUserRolesDto {
  @IsString()
  @IsNotEmpty()
  initData: string;

  @IsArray()
  roles: UserRoles[];
}
