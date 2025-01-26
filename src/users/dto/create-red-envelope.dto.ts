import { IsNumber, IsString } from 'class-validator';

export class CreateRedEnvelopeDto {
  @IsString()
  referralCode: string;

  @IsNumber()
  amount: number;
}
