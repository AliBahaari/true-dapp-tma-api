import { Module } from '@nestjs/common';
import { CashAvalancheService } from './cash-avalanche.service';
import { CashAvalancheController } from './cash-avalanche.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashAvalancheEntity } from './entities/cash-avalanche.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([CashAvalancheEntity]), UsersModule],
  controllers: [CashAvalancheController],
  providers: [CashAvalancheService],
})
export class CashAvalancheModule {}
