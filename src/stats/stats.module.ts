import { Module } from '@nestjs/common';
import { StatsGateway } from './stats.gateway';

@Module({
  providers: [StatsGateway],
})
export class StatsModule {}
