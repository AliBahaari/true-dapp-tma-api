import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../entities/file.entity';
import { SftpService } from './sftp.service';

@Injectable()
export class FileService {
    constructor(
        @InjectRepository(FileEntity)
        private fileRepository: Repository<FileEntity>,
    ) { }

    async create(file: Express.Multer.File): Promise<FileEntity> {
        const newFile = this.fileRepository.create({
            url: `/static/images/${file.filename}`,
            originalName: file.originalname,
            size: file.size,
        });
        return this.fileRepository.save(newFile);
    }
}