import { IsString, MinLength } from 'class-validator';

export class CompareKeyDto {
  @IsString()
  @MinLength(30)
  key: string;
}
