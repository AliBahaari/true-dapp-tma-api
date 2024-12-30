import { IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  initData: string;

  @IsString()
  @IsOptional()
  invitedBy: string | undefined;
}
