import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class BuyTgmDto {
  @IsString()
  @IsNotEmpty()
  initData: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
