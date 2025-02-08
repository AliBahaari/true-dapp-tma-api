import { IsString } from 'class-validator';

export class CreateLongShotMatchDto {
  @IsString()
  firstTeamId: string;

  @IsString()
  secondTeamId: string;

  @IsString()
  leagueWeeklyId: string;

  @IsString()
  packId: string;
  
  @IsString()
  matchDate: Date;
}
