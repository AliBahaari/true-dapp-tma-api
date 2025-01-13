import { Module } from '@nestjs/common';
import { CashAvalancheService } from './cash-avalanche.service';
import { CashAvalancheController } from './cash-avalanche.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashAvalancheEntity } from './entities/cash-avalanche.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashAvalancheEntity])],
  controllers: [CashAvalancheController],
  providers: [CashAvalancheService],
})
export class CashAvalancheModule {}
