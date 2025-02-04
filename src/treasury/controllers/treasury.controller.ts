import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateTreasuryDto } from '../dto/create-treasury.dto';
import { TreasuryService } from '../services/treasury.service';

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Post()
  async createTreasuryAddress(@Body() createTreasuryDto: CreateTreasuryDto) {
    return await this.treasuryService.createTreasuryAddress(createTreasuryDto);
  }

  @Get()
  async findLastestTreasury() {
    return await this.treasuryService.findLastestTreasury();
  }
}
