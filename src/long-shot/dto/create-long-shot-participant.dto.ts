import { IsString } from 'class-validator';

export class CreateLongShotParticipantDto {
  @IsString()
  initData: string;

  @IsString()
  choice: string;

  @IsString()
  matchId: string;
}
