import { IsString } from 'class-validator';

export class BidDto {
  @IsString()
  gameId: string;

  @IsString()
  initData: string;
}
