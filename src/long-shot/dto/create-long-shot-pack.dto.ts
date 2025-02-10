import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CreateLongShotMatchDto } from './create-long-shot-match.dto';

export class CreateLongShotPackDto {
  @IsString()
  title: string;

  @IsNumber()
  reward: number;

  @IsString()
  guessTime: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsNotEmpty()
  matches:CreateLongShotMatchDto[]
}
