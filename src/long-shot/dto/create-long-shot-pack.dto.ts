import { IsString } from 'class-validator';

export class CreateLongShotPackDto {
  @IsString()
  title: string;

  @IsString()
  endDate: string;
}
