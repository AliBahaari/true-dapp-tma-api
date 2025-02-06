import { IsString } from 'class-validator';

export class CreateLongShotMatchDto {
  @IsString()
  firstTeamId: string;

  @IsString()
  secondTeamId: string;

  @IsString()
  leagueWeeklyId: string;
  
  @IsString()
  matchDate: Date;
}
