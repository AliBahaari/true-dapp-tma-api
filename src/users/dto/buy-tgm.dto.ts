import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BuyTgmDto {
  @IsString()
  @IsNotEmpty()
  initData: string;

  @IsNumber()
  type?: 1 | 2 | 3 | 4 | 5;

  @IsNumber()
  amount?: number;

  @IsString()
  @IsNotEmpty()
  txId:string
}
