import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { IUserToken } from 'src/common/interfaces/user-token.interface';
import { CreateTreasuryDto } from '../dto/create-treasury.dto';
import { TreasuryService } from '../services/treasury.service';

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Post()
  async createTreasuryAddress(@Body() createTreasuryDto: CreateTreasuryDto,@GetUser() user:IUserToken) {
    return await this.treasuryService.createTreasuryAddress(createTreasuryDto,user);
  }

  @Get()
  async findLastestTreasury() {
    return await this.treasuryService.findLastestTreasury();
  }
}
