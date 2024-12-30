import { Module, RequestMethod } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { TasksModule } from 'src/tasks/tasks.module';
import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), TasksModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {
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
        {
          path: 'tasks/create',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
