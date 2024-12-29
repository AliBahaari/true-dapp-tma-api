import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './users/entities/user.entity';
import { TaskEntity } from './tasks/entities/task.entity';
import { StatsModule } from './stats/stats.module';
import { WalletModule } from './wallet/wallet.module';
import { KeyModule } from './key/key.module';
import { WalletEntity } from './wallet/entities/wallet.entity';
import { KeyEntity } from './key/entities/key.entity';
import { LanguagesModule } from './languages/languages.module';
import { LanguageEntity } from './languages/entities/language.entity';

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
        TaskEntity,
        LanguageEntity,
        WalletEntity,
        KeyEntity,
      ],
      synchronize: true,
    }),
    UsersModule,
    TasksModule,
    StatsModule,
    WalletModule,
    KeyModule,
    LanguagesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
