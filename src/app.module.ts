import { Module, RequestMethod } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './users/entities/user.entity';
import { StatsModule } from './stats/stats.module';
import { WalletModule } from './wallet/wallet.module';
import { KeyModule } from './key/key.module';
import { WalletEntity } from './wallet/entities/wallet.entity';
import { KeyEntity } from './key/entities/key.entity';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'true_dapp',
      entities: [
        UserEntity,
        LanguageEntity,
        CashAvalancheEntity,
        LongShotPacksEntity,
        LongShotLeaguesWeeklyEntity,
        LongShotMatchesEntity,
        LongShotParticipantsEntity,
        WalletEntity,
        KeyEntity,
      ],
      synchronize: true,
    }),
    UsersModule,
    StatsModule,
    WalletModule,
    KeyModule,
    LanguagesModule,
    CashAvalancheModule,
    LongShotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer) {
    consumer
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
      .forRoutes(UsersController);
  }
}
