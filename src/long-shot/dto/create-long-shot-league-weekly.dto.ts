import { IsString } from 'class-validator';

export class CreateLongShotLeagueWeeklyDto {
  @IsString()
  title: string;
}
