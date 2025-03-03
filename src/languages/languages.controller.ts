import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateLanguageDto } from './dto/create-language.dto';
import { LanguagesService } from './languages.service';
import { Roles } from 'src/common/decorator/role.decorator';
import { UserRoles } from 'src/users/entities/user.entity';
import { Public } from 'src/common/decorator/public-api.decorator';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post('create')
  // @Roles([UserRoles.NORMAL])
  async create(@Body() createLanguageDto: CreateLanguageDto) {
    return await this.languagesService.create(createLanguageDto);
  }

  @Get('findAll')
  @Public()
  async findAll() {
    return await this.languagesService.findAll();
  }
}
