import { Injectable } from '@nestjs/common';
import { GenerateKeyDto } from './dtos/generate-key-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyEntity } from './entities/key.entity';
import { CompareKeyDto } from './dtos/compare-key-dto';

@Injectable()
export class KeyService {
  constructor(
    @InjectRepository(KeyEntity)
    private readonly keyRepository: Repository<KeyEntity>,
  ) {}

  async generate(generateKeyDto: GenerateKeyDto) {
    return await this.keyRepository.save({
      title: generateKeyDto.title,
      key: crypto.randomUUID(),
    });
  }

  async compare(compareKeyDto: CompareKeyDto) {
    return await this.keyRepository.findOne({
      where: {
        key: compareKeyDto.key,
      },
    });
  }
}
