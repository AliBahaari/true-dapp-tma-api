import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './users/entities/user.entity';
import { StatsModule } from './stats/stats.module';
import { LanguagesModule } from './languages/languages.module';
import { LanguageEntity } from './languages/entities/language.entity';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { UsersController } from './users/users.controller';
import { CashAvalancheModule } from './cash-avalanche/cash-avalanche.module';
import { CashAvalancheEntity } from './cash-avalanche/entities/cash-avalanche.entity';
import { LongShotModule } from './long-shot/long-shot.module';
import { LongShotLeaguesWeeklyEntity } from './long-shot/entities/long-shot-leagues-weekly.entity';
import { LongShotMatchesEntity } from './long-shot/entities/long-shot-matches.entity';
import { LongShotParticipantsEntity } from './long-shot/entities/long-shot-participants.entity';
import { LongShotPacksEntity } from './long-shot/entities/long-shot-packs.entity';
import { LongShotTicketEntity } from './long-shot/entities/long-shot-tickets.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { EncryptionModule } from './utils/encryption/encryption.module';
import { EncryptionMiddleware } from './common/middlewares/encryption.middleware';
import { TreasuryEntity } from './treasury/entities/treasury.entity';
import { TreasuryModule } from './treasury/treasury.module';
import { TreasuryController } from './treasury/controllers/treasury.controller';
import { FileEntity } from './file/entities/file.entity';
import { FileModule } from './file/file.module';
import { LongShotTeamEntity } from './long-shot/entities/long-shot-teams.entity';
import { TonModule } from './utils/ton/ton-module';
import { PurchasedTgmEntity } from './users/entities/purchased-tgm.entity';
import { RedEnvelopeLogEntity } from './users/entities/red-envelope-log.entity';
import { WalletLogEntity } from './users/entities/wallet-log.entity';
import { RequestLoggerModule } from './logger/logger.module';
import { RequestLoggerEntity } from './logger/entities/logger.entity';
import { RequestLoggerMiddleware } from './common/middlewares/logger.middleware';
console.log(join(__dirname, '..', 'public'));
import { ClaimedRewardLogEntity } from './users/entities/claimed-reward-log.entity';
import { CompleteTaskLogEntity } from './users/entities/complete-task-log.entity';
console.log(join(__dirname, '..', 'public'))
dotenv.config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`) });
console.log("------- db -------");
console.log(process.env.PSQL_DB);
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PSQL_HOST,
      port: Number(process.env.PSQL_PORT),
      username: process.env.PSQL_USERNAME,
      password: process.env.PSQL_PASSWORD,
      database: process.env.PSQL_DB,
      entities: [
        UserEntity,
        LanguageEntity,
        CashAvalancheEntity,
        LongShotPacksEntity,
        LongShotLeaguesWeeklyEntity,
        LongShotMatchesEntity,
        LongShotParticipantsEntity,
        LongShotTicketEntity,
        LongShotTeamEntity,
        TreasuryEntity,
        FileEntity,
        RedEnvelopeLogEntity,
        RequestLoggerEntity,
        PurchasedTgmEntity,
        WalletLogEntity,
        CompleteTaskLogEntity,
        ClaimedRewardLogEntity
      ],
      synchronize: true,
      logging: false
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    UsersModule,
    StatsModule,
    LanguagesModule,
    CashAvalancheModule,
    LongShotModule,
    RequestLoggerModule,
    FileModule,
    EncryptionModule,
    TreasuryModule,
    TonModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(EncryptionMiddleware)
      .forRoutes('*')

      .apply(AuthMiddleware)
      .exclude(
        {
          path: 'users/create',
          method: RequestMethod.POST,
        },
        {
          path: 'users/find/:initData',
          method: RequestMethod.GET,
        },
      )
      .forRoutes(UsersController, TreasuryController)
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
