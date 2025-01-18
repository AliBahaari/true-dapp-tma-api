import { IsNumber, IsString } from 'class-validator';

export class CreateLongShotPackDto {
  @IsString()
  title: string;

  @IsNumber()
  reward: number;

  @IsString()
  endDate: string;
}
