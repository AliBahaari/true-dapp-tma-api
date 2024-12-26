import { Body, Controller, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dtos/create-wallet-dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('create')
  async handleCreate(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.create(createWalletDto);
  }
}
