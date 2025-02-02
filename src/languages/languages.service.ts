import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLanguageDto } from './dto/create-language.dto';
import { LanguageEntity } from './entities/language.entity';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(LanguageEntity)
    private readonly languageRepo: Repository<LanguageEntity>,
  ) {}

  async create(createLanguageDto: CreateLanguageDto) {
    return await this.languageRepo.save(createLanguageDto);
  }

  async findAll() {
    return await this.languageRepo.find();
  }
}
