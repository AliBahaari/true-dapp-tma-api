import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('findAll')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('findOne/:initData')
  findOne(@Param('initData') initData: string) {
    return this.usersService.findOne(initData);
  }

  @Get('findStats/:initData')
  findStats(@Param('initData') initData: string) {
    return this.usersService.findStats(initData);
  }

  @Get('findAllUsersCount')
  findAllUsersCount() {
    return this.usersService.findAllUsersCount();
  }

  @Patch('updateReferralCode/:referralCode')
  update(@Param('referralCode') referralCode: string) {
    return this.usersService.updateReferralCode(referralCode);
  }

  @Patch('updateUserTask/:initData/:taskId')
  updateUserTask(
    @Param('initData') initData: string,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.usersService.updateUserTask(initData, taskId);
  }

  @Patch('updateEstimatedTgmPrice/:initData/:estimatedPrice')
  updateEstimatedTgmPrice(
    @Param('initData') initData: string,
    @Param('estimatedPrice', ParseIntPipe) estimatedPrice: number,
  ) {
    return this.usersService.updateEstimatedTgmPrice(initData, estimatedPrice);
  }
}
