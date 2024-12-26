import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { Wallet } from 'ethers';
import { WalletEntity } from './entities/wallet.entity';
import { Repository } from 'typeorm';
import { CreateWalletDto } from './dtos/create-wallet-dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
  ) {}

  async create(createWalletDto: CreateWalletDto) {
    // Ton
    const tonMnemonics = await mnemonicNew();
    const keyPair = await mnemonicToPrivateKey(tonMnemonics);
    const workchain = 0;
    const tonWallet = WalletContractV4.create({
      workchain,
      publicKey: keyPair.publicKey,
    });

    // Eth
    const ethWallet = Wallet.createRandom();

    // Wallets Info
    const walletsInfo = {
      ton: {
        mnemonics: tonMnemonics,
        publicKey: keyPair.publicKey.toString('base64url'),
        privateKey: keyPair.secretKey.toString('base64url'),
        address: tonWallet.address,
      },
      eth: {
        mnemonics: ethWallet.mnemonic.phrase,
        publicKey: ethWallet.publicKey,
        privateKey: ethWallet.privateKey,
        address: ethWallet.address,
      },
    };

    return await this.walletRepo.save({
      fullName: createWalletDto.fullName,
      walletsInfo: JSON.stringify(walletsInfo),
    });
  }
}
