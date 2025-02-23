import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLoggerEntity } from '../entities/logger.entity';

@Injectable()
export class LoggerService {
    constructor(
        @InjectRepository(RequestLoggerEntity)
        private readonly logRepository: Repository<RequestLoggerEntity>,
    ) { }

    async create(logData: Partial<RequestLoggerEntity>) {
        const logEntry = this.logRepository.create(logData);
        await this.logRepository.save(logEntry);
    }
}
