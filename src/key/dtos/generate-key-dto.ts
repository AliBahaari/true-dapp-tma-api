import { IsString, MinLength } from 'class-validator';

export class GenerateKeyDto {
  @IsString()
  @MinLength(3)
  title: string;
}
