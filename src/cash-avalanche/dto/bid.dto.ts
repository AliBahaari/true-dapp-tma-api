import { IsString } from 'class-validator';

export class BidDto {
  @IsString()
  gameId: number;

  @IsString()
  initData: string;
}
