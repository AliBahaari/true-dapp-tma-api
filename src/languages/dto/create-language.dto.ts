import { IsString, MinLength } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @MinLength(3)
  language: string;

  @IsString()
  @MinLength(1)
  languageCode: string;
}
