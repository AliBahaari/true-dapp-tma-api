import { IsNumber, IsString } from 'class-validator';

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
  leagueWeaklyId: string;

  @IsString()
  endDate: string;
}
