import { IsNumber } from 'class-validator';

export class CreateCashAvalancheDto {
  @IsNumber()
  startReward: number;

  @IsNumber()
  bidStep: number;

  @IsNumber()
  intervalTime: number;
}
