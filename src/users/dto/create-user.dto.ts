import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRoles } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  initData: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  roles: UserRoles[];

  @IsString()
  @IsOptional()
  invitedBy: string | undefined;
}
