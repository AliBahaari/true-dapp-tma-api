import { IsArray, IsString, ValidateNested } from 'class-validator';

type Vote = { choice: string; matchId: string };

export class CreateLongShotParticipateLeagueWeeklyDto {
  @IsString()
  initData: string;

  @IsArray()
  @ValidateNested({ each: true })
  votes: Vote[];
}
