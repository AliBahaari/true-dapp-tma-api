import { IsNumber, IsString } from 'class-validator';

export class NewCreateRedEnvelopeDto {
    @IsString()
    initData:string
    
  @IsString()
  referralCode: string;

  @IsNumber()
  amount: number;
}
