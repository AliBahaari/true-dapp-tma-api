import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { PurchasedTgmEntity } from './entities/purchased-tgm.entity';
import { CashAvalancheEntity } from 'src/cash-avalanche/entities/cash-avalanche.entity';
import { LongShotTicketEntity } from 'src/long-shot/entities/long-shot-tickets.entity';
import { LongShotPacksEntity } from 'src/long-shot/entities/long-shot-packs.entity';
import { RedEnvelopeLogEntity } from './entities/red-envelope-log.entity';
import { WalletLogEntity } from './entities/wallet-log.entity';
import { CompleteTaskLogEntity } from './entities/complete-task-log.entity';
import { ClaimedRewardLogEntity } from './entities/claimed-reward-log.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([
    UserEntity,
    PurchasedTgmEntity,
    CashAvalancheEntity,
    LongShotTicketEntity,
    LongShotPacksEntity,
    RedEnvelopeLogEntity,
    WalletLogEntity,
    CompleteTaskLogEntity,
    ClaimedRewardLogEntity
  ]),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      global: true,
      secret: configService.get<string>('JWT_SECRET'),
    }),
  }),],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
