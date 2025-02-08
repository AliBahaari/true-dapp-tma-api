import { IsString } from 'class-validator';

export class CreateLongShotLeagueWeeklyDto {
  @IsString()
  title: string;

  @IsString()
  logo: string;

  @IsString()
  packId: string;
}
