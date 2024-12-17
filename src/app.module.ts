import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './users/entities/user.entity';
import { TaskEntity } from './tasks/entities/task.entity';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'true-dapp',
      entities: [UserEntity, TaskEntity],
      synchronize: true,
    }),
    UsersModule,
    TasksModule,
    StatsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
