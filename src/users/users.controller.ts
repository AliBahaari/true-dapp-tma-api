import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get('findAll')
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get('findOrCreate/:initData')
  async findOrCreate(@Param('initData') initData: string) {
    return await this.usersService.findOrCreate(initData);
  }

  @Get('findStats/:initData')
  async findStats(@Param('initData') initData: string) {
    return await this.usersService.findStats(initData);
  }

  @Get('findAllUsersCount')
  async findAllUsersCount() {
    return await this.usersService.findAllUsersCount();
  }

  @Patch('updateReferralCode/:referralCode')
  async updateReferralCode(@Param('referralCode') referralCode: string) {
    return await this.usersService.updateReferralCode(referralCode);
  }

  @Patch('updateUserTask/:initData/:taskId')
  async updateUserTask(
    @Param('initData') initData: string,
    @Param('taskId') taskId: string,
  ) {
    return await this.usersService.updateUserTask(initData, taskId);
  }

  @Patch('updateEstimatedTgmPrice/:initData/:estimatedPrice')
  async updateEstimatedTgmPrice(
    @Param('initData') initData: string,
    @Param('estimatedPrice') estimatedPrice: string,
  ) {
    return await this.usersService.updateEstimatedTgmPrice(
      initData,
      estimatedPrice,
    );
  }
}
