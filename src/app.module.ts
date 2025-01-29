import { Module, RequestMethod } from '@nestjs/common';
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

dotenv.config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`) });

@Module({
  imports: [
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: "ec2-40-172-49-49.me-central-1.compute.amazonaws.com",
    //   port: 3306,
    //   username: 'root',
    //   password: 'true_dapp_pass',
    //   database: 'true_dapp',
    //   entities: [
    //     UserEntity,
    //     LanguageEntity,
    //     CashAvalancheEntity,
    //     LongShotPacksEntity,
    //     LongShotLeaguesWeeklyEntity,
    //     LongShotMatchesEntity,
    //     LongShotParticipantsEntity,
    //     LongShotTicketEntity,
    //   ],
    //   synchronize: true,
    // }),


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
      ],
      synchronize: false,
    }),

    //  TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: "ec2-40-172-49-49.me-central-1.compute.amazonaws.com",
    //   port: 5432,
    //   username: 'postgres',
    //   password: 'd9K3zV8mQ2fT1xY7',
    //   database: 'dapp_development',
    //   entities: [
    //     UserEntity,
    //     LanguageEntity,
    //     CashAvalancheEntity,
    //     LongShotPacksEntity,
    //     LongShotLeaguesWeeklyEntity,
    //     LongShotMatchesEntity,
    //     LongShotParticipantsEntity,
    //     LongShotTicketEntity,
    //   ],
    //   synchronize: false,
    // }),


    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    UsersModule,
    StatsModule,
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
