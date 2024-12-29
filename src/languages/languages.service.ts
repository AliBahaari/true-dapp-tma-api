import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LanguageEntity } from './entities/language.entity';
import { Repository } from 'typeorm';
import { CreateLanguageDto } from './dto/create-language.dto';

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
