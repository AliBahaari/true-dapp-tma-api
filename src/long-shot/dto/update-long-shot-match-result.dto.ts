import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateOneLongShotMatchResultDto {
  @IsString()
  result: string;

  @IsString()
  matchId: string
}

export class UpdateLongShotMatchResultDto {
  @ApiProperty()
  matches: UpdateOneLongShotMatchResultDto[];
  @ApiProperty()
  packId: string;
}
