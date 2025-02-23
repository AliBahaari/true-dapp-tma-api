import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLoggerEntity } from './entities/logger.entity';
import { LoggerService } from './service/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestLoggerEntity])],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class RequestLoggerModule {}
