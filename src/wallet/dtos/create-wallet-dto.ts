import { IsString, MinLength } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @MinLength(3)
  fullName: string;
}
