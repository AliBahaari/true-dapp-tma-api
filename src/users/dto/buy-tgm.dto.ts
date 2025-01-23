import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BuyTgmDto {
  @IsString()
  @IsNotEmpty()
  initData: string;

  @IsNumber()
  type: 1 | 2 | 3 | 4;
}
