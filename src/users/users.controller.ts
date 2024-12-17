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

  @Patch('update/:referralCode')
  update(@Param('referralCode') referralCode: string) {
    return this.usersService.update(referralCode);
  }

  @Patch('updateUserTask/:initData/:taskId')
  updateUserTask(
    @Param('initData') initData: string,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.usersService.updateUserTask(initData, taskId);
  }
}
