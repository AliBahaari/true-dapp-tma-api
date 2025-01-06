import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
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

  @Get('find/:initData')
  async find(@Param('initData') initData: string) {
    return await this.usersService.find(initData);
  }

  @Get('findInvitedBy/:referralCode')
  async findInvitedBy(@Param('referralCode') referralCode: string) {
    return await this.usersService.findInvitedBy(referralCode);
  }

  @Get('findRanking/:initData')
  async findRanking(@Param('initData') initData: string) {
    return await this.usersService.findRanking(initData);
  }

  @Get('findAllUsersCount')
  async findAllUsersCount() {
    return await this.usersService.findAllUsersCount();
  }

  @Patch('updateReferralCode/:initData/:referralCode')
  async updateReferralCode(
    @Param('initData') initData: string,
    @Param('referralCode') referralCode: string,
  ) {
    return await this.usersService.updateReferralCode(initData, referralCode);
  }

  @Patch('updateClaimReferralReward/:initData')
  async updateClaimReferralReward(initData: string) {
    return await this.usersService.updateClaimReferralReward(initData);
  }

  @Delete('deleteUser/:initData')
  async deleteUser(@Param('initData') initData: string) {
    return await this.usersService.deleteUser(initData);
  }

  @Patch('updateTaskReward/:initData/:taskName/:taskReward')
  async updateTaskReward(
    @Param('initData') initData: string,
    @Param('taskName') taskName: string,
    @Param('taskReward') taskReward: string,
  ) {
    return await this.usersService.updateTaskReward(
      initData,
      taskName,
      taskReward,
    );
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
