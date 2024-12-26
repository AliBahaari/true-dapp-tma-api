import { Module } from '@nestjs/common';
import { KeyService } from './key.service';
import { KeyController } from './key.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyEntity } from './entities/key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KeyEntity])],
  controllers: [KeyController],
  providers: [KeyService],
  exports: [KeyService],
})
export class KeyModule {}
