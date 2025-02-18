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
import { BuyTgmDto } from './dto/buy-tgm.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { CreateRedEnvelopeDto } from './dto/create-red-envelope.dto';
import { UserEntity } from './entities/user.entity';
import { PaginationDto } from './dto/pagination.dto';
import { AddMarketerDto } from './dto/add-marketer.dto';
import { IUserToken } from 'src/common/interfaces/user-token.interface';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { UpdateMarketerDto } from './dto/update-marketer.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Post('buyTgm')
  async buyTgm(@Body() buyTgmDto: BuyTgmDto) {
    return await this.usersService.buyTgm(buyTgmDto);
  }

  @Post('createRedEnvelope')
  async createRedEnvelope(@Body() createRedEnvelopeDto: CreateRedEnvelopeDto) {
    return await this.usersService.createRedEnvelope(createRedEnvelopeDto);
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

  @Patch("claim/reward/task/:initData/:taskName")
  async claimRewardOfTask(@Param("initData") initData:string):Promise<UserEntity>
  {
    return await this.usersService.claimAllRewards(initData)
  }

  @Patch('updateReferralCode/:initData/:referralCode')
  async updateReferralCode(
    @Param('initData') initData: string,
    @Param('referralCode') referralCode: string,
  ) {
    return await this.usersService.updateReferralCode(initData, referralCode);
  }

  @Patch('updateClaimReferralReward/:invitedUserId/:initData')
  async updateClaimReferralReward(
    @Param('invitedUserId') invitedUserId: string,
    @Param('initData') initData: string,
  ) {
    return await this.usersService.updateClaimReferralReward(
      invitedUserId,
      initData,
    );
  }



  @Patch("claim/all/rewards/:initData")
  async claimAllRewards(@Param("initData") initData:string):Promise<UserEntity>
  {
    return await this.usersService.claimAllRewards(initData)
  }


  @Patch('updateClaimLevelUpReward/:initData')
  async updateClaimLevelUpReward(@Param('initData') initData: string) {
    return await this.usersService.updateClaimLevelUpReward(initData);
  }

  @Patch('updateClaimAll/:initData')
  async updateClaimAll(@Param('initData') initData: string) {
    return await this.usersService.updateClaimAll(initData);
  }

  @Patch('updateTaskReward/:initData/:taskName')
  async updateTaskRewardByTask(
    @Param('initData') initData: string,
    @Param('taskName') taskName: string
  ) {
    return await this.usersService.updateTaskRewardByTask(
      initData,
      taskName
    );
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

  @Patch('updateCompleteTask/:initData/:taskName')
  async updateCompleteTask(
    @Param('initData') initData: string,
    @Param('taskName') taskName: string,
  ) {
    return await this.usersService.updateCompleteTask(initData, taskName);
  }

  @Patch('updateUserWalletAddress/:initData/:walletAddress')
  async updateUserWalletAddress(
    @Param('initData') initData: string,
    @Param('walletAddress') walletAddress: string,
  ) {
    return await this.usersService.updateUserWalletAddress(
      initData,
      walletAddress,
    );
  }

  @Patch('updateUserRoles')
  async updateUserRoles(@Body() updateUserRolesDto: UpdateUserRolesDto) {
    return await this.usersService.updateUserRoles(updateUserRolesDto);
  }

  @Patch('updateInvitedUserBuyTgmCommission/:invitedUserId')
  async updateInvitedUserBuyTgmCommission(
    @Param('invitedUserId') invitedUserId: string,
  ) {
    return await this.usersService.updateInvitedUserBuyTgmCommission(
      invitedUserId,
    );
  }

  @Patch('updateUserHourlyReward/:initData')
  async updateUserHourlyReward(@Param('initData') initData: string) {
    return await this.usersService.updateUserHourlyReward(initData);
  }

  @Patch('updateClaimUserRedEnvelope/:initData')
  async updateClaimUserRedEnvelope(@Param('initData') initData: string) {
    return await this.usersService.updateClaimUserRedEnvelope(initData);
  }

  @Patch('updateIsBannedUser/:referralCode')
  async updateIsBannedUser(@Param('referralCode') referralCode: string) {
    return await this.usersService.updateIsBannedUser(referralCode);
  }

  @Delete('deleteUser/:initData')
  async deleteUser(@Param('initData') initData: string) {
    return await this.usersService.deleteUser(initData);
  }

  @Post("purchased/tgms/page")
  async purchasedTgmPagination(@Body() paginationDto: PaginationDto<{type:number}>) {
    return this.usersService.purchasedTgmPagination(paginationDto);
  }

  @Post("head/marketers")
  async headMarketers(@Body() paginationDto: PaginationDto<{initData:string}>) {
    return this.usersService.headMarketers(paginationDto);
  }

  @Post("marketer/user/purchases")
  async marketerUserPurchases(@Body() paginationDto: PaginationDto<{initData:string}>) {
    return this.usersService.marketerUserPurchases(paginationDto);
  }

  @Post("marketer/users")
  async marketerUsers(@Body() paginationDto: PaginationDto<{initData:string}>) {
    return this.usersService.marketerUsers(paginationDto);
  }

  @Post("add/marketer")
  public async addMarketer(@Body() addMarketerDto:AddMarketerDto):Promise<UserEntity>
  {
    return await this.usersService.addMarketer(addMarketerDto.initData,addMarketerDto.referralCode)
  }

  @Delete("delete/marketer/:initData")
  public async deleteMarketer(@GetUser() user:IUserToken,@Param("initData") initData:string):Promise<UserEntity>
  {
    return await this.usersService.deleteMarketer(user,initData)
  }

  @Patch("update/marketer/:initData")
  public async updateMarketerVipStatusAndCommission(@GetUser() user:IUserToken,@Param("initData") initData:string,@Body() updateMarketerDto:UpdateMarketerDto):Promise<UserEntity>
  {
    return await this.usersService.updateMarketerVipStatusAndCommission(user,initData,updateMarketerDto)
  }
}
