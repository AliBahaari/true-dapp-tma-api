import { IsNumber, IsString } from 'class-validator';

export class CreateLongShotPackDto {
  @IsString()
  title: string;

  @IsNumber()
  reward: number;

  @IsNumber()
  guessTime: string;

  @IsNumber()
  startDate: string;

  @IsString()
  endDate: string;
}
