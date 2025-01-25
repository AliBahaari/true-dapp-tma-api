import { IsNumber, IsString } from 'class-validator';

export class CreateRedEnvelopeDto {
  @IsString()
  id: string;

  @IsNumber()
  amount: number;
}
