import { IsString } from 'class-validator';

export class CreateLongShotMatchDto {
  @IsString()
  firstSide: string;

  @IsString()
  secondSide: string;

  @IsString()
  leagueWeeklyId: string;
}
