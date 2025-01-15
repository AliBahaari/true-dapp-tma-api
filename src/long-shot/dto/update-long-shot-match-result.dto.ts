import { IsString } from 'class-validator';

export class UpdateLongShotMatchResultDto {
  @IsString()
  result: string;
}
