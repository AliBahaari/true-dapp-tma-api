import { Body, Controller, Post } from '@nestjs/common';
import { KeyService } from './key.service';
import { GenerateKeyDto } from './dtos/generate-key-dto';

@Controller('key')
export class KeyController {
  constructor(private readonly keyService: KeyService) {}

  @Post('generate')
  async handleGenerate(@Body() generateKeyDto: GenerateKeyDto) {
    return await this.keyService.generate(generateKeyDto);
  }
}
