import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { PurchasedTgmEntity } from './entities/purchased-tgm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity,PurchasedTgmEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
