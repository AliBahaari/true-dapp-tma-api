import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CashAvalancheService } from './cash-avalanche.service';
import { CreateCashAvalancheDto } from './dto/create-cash-avalanche.dto';
import { BidDto } from './dto/bid.dto';

@Controller('cash-avalanche')
export class CashAvalancheController {
  constructor(private readonly cashAvalancheService: CashAvalancheService) {}

  @Post('create')
  async create(@Body() createCashAvalancheDto: CreateCashAvalancheDto) {
    return await this.cashAvalancheService.create(createCashAvalancheDto);
  }

  @Post('bid')
  async bid(@Body() bidDto: BidDto) {
    return await this.cashAvalancheService.bid(bidDto);
  }

  @Get('findWinner/:gameId')
  async findWinner(@Param('gameId') gameId: string) {
    return await this.cashAvalancheService.findWinner(gameId);
  }

  @Get('findAllActive')
  async findAllActive() {
    return await this.cashAvalancheService.findAllActive();
  }
}
