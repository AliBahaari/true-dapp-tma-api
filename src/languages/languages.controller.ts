import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post('create')
  async create(@Body() createLanguageDto: CreateLanguageDto) {
    return await this.languagesService.create(createLanguageDto);
  }

  @Get('findAll')
  async findAll() {
    return await this.languagesService.findAll();
  }
}
