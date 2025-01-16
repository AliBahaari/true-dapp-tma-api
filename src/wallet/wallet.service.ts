import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { Wallet, ethers } from 'ethers';
import { WalletEntity } from './entities/wallet.entity';
import { Repository } from 'typeorm';
import { CreateWalletDto } from './dtos/create-wallet-dto';
import { Zar } from './abis/Zar';

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

    const provider = new ethers.JsonRpcProvider(
      'https://rpc-amoy.polygon.technology/',
    );

    const privateKey =
      '0xa16b54859ee4e68becfa580804c1f5b51c6c6e66f92c8c90afd7b6357eca6f38';
    const wallet = new Wallet(privateKey, provider);
    const contract = new ethers.Contract(Zar.contractAddress, Zar.abi, wallet);

    const successBlock = {
      txHash: '',
      receipt: '',
    };

    try {
      const recipient = ethWallet.address;
      const amount = ethers.parseEther(createWalletDto.mintAmount);

      const tx = await contract.mint(recipient, amount);
      const receipt = await tx.wait();

      successBlock.txHash = tx.hash;
      successBlock.receipt = receipt;
    } catch (error) {
      throw new HttpException(
        'Error During Minting',
        HttpStatus.REQUEST_TIMEOUT,
      );
    }

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
        successBlock,
      },
    };

    return await this.walletRepo.save({
      fullName: createWalletDto.fullName,
      walletsInfo: JSON.stringify(walletsInfo),
    });
  }
}
