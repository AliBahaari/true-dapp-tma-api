import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from './entities/wallet.entity';
import { KeyModule } from 'src/key/key.module';
import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity]), KeyModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {
  configure(consumer) {
    consumer.apply(AuthMiddleware).forRoutes(WalletController);
  }
}
