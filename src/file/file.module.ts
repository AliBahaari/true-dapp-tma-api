import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileController } from './controller/file.controller';
import { FileService } from './service/file.service';
import { SftpService } from './service/sftp.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  controllers: [FileController],
  providers: [FileService, SftpService],
})
export class FileModule {}
