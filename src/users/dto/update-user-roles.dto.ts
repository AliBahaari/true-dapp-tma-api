import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { UserRoles } from '../entities/user.entity';

export class UpdateUserRolesDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  roles: UserRoles[];
}
