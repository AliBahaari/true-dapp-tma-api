import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { LongShotService } from './long-shot.service';
import { CreateLongShotLeagueWeeklyDto } from './dto/create-long-shot-league-weekly.dto';
import { CreateLongShotMatchDto } from './dto/create-long-shot-match.dto';
import { UpdateLongShotMatchResultDto } from './dto/update-long-shot-match-result.dto';
import { CreateLongShotParticipantDto } from './dto/create-long-shot-participant.dto';
import { CreateLongShotParticipateLeagueWeeklyDto } from './dto/create-long-shot-participate-league-weekly.dto';
import { CreateLongShotPackDto } from './dto/create-long-shot-pack.dto';
import { LongShotLeagueWeeklyFilterDto } from './dto/long-shot-league-weekly-filter.dto';
import { CreateLongShotTeamDto } from './dto/create-long-shot-team.dto';
import { UpdateLongShotTeamDto } from './dto/update-long-shot-team.dto';

@Controller('long-shot')
export class LongShotController {
  constructor(private readonly longShotService: LongShotService) {}


  //team

  @Post('team/create')
  async teamCreate(@Body() createLongShotTeamDto: CreateLongShotTeamDto) {
    return await this.longShotService.teamCreate(createLongShotTeamDto);
  }
  
  @Delete('team/delete/:id')
  async teamDelete(@Param("id") id: string) {
    return await this.longShotService.teamDelete(id);
  }

  @Put('team/update/:id')
  async teamUpdate(@Param("id") id: string, @Body() updateLongShotTeamDto: UpdateLongShotTeamDto) {
    return await this.longShotService.teamUpdate(id, updateLongShotTeamDto);
  }

  @Get('team/findOne/:id')
  async teamFindOne(@Param('id') id: string) {
    return await this.longShotService.teamFindOne(id);
  }

  @Get('team/find/league/:id')
  async findTeamsByLeague(@Param('id') id: string) {
    return await this.longShotService.findTeamsByLeague(id);
  }

  @Get('team/list')
  async teamList() {
    return await this.longShotService.teamList();
  }

  // Packs

  @Post('pack/create')
  async packCreate(@Body() createLongShotPackDto: CreateLongShotPackDto) {
    return await this.longShotService.packCreate(createLongShotPackDto);
  }

  @Get('pack/findAll')
  async packFindAll() {
    return await this.longShotService.packFindAll();
  }

  @Get('pack/findOne/:id')
  async packFindOne(@Param('id') id: string) {
    return await this.longShotService.packFindOne(id);
  }

  @Delete('pack/delete/:id')
  async packDelete(@Param('id') id: string) {
    return await this.longShotService.packDelete(id);
  }

  @Get('pack/findWinner/:packId/:initData')
  async packFindWinner(
    @Param('packId') packId: string,
    @Param('initData') initData: string,
  ) {
    return this.longShotService.findWinner(packId, initData);
  }

  @Get('pack/claimReward/:packId/:initData')
  async packClaimReward(
    @Param('packId') packId: string,
    @Param('initData') initData: string,
  ) {
    return this.longShotService.claimReward(packId, initData);
  }

  // Leagues Weekly

  @Get('league-weekly/packs/:id')
  async leagueWeeklyPack(
    @Param('id') id: string
  ) {
    return this.longShotService.packOfLeagues(
      id
    );
  }

  @Post('league-weekly/create')
  async leagueWeeklyCreate(
    @Body() createLongShotLeagueWeeklyDto: CreateLongShotLeagueWeeklyDto,
  ) {
    return this.longShotService.leagueWeeklyCreate(
      createLongShotLeagueWeeklyDto,
    );
  }

  @Post('/league-weekly/vote')
  async leagueWeeklyVote(
    @Body()
    createLongShotParticipateLeagueWeeklyDto: CreateLongShotParticipateLeagueWeeklyDto,
  ) {
    return await this.longShotService.vote(
      createLongShotParticipateLeagueWeeklyDto,
    );
  }

  @Post('league-weekly/findAll/pack')
  async leagueWeeklyFindAllByPack(@Body() longShotLeagueWeeklyFilterDto: LongShotLeagueWeeklyFilterDto) {
    return await this.longShotService.leagueWeeklyFindAllByPack(longShotLeagueWeeklyFilterDto);
  }
  
  @Get('league-weekly/findAll')
  async leagueWeeklyFindAll() {
    return await this.longShotService.leagueWeeklyFindAll();
  }

  @Get('league-weekly/findOne/:id')
  async leagueWeeklyFindOne(@Param('id') id: string) {
    return await this.longShotService.leagueWeeklyFindOne(id);
  }

  @Delete('league-weekly/delete/:id')
  async leagueWeeklyDelete(@Param('id') id: string) {
    return await this.longShotService.leagueWeeklyDelete(id);
  }

  // Matches

  @Post('match/create')
  async matchCreate(@Body() createLongShotMatchDto: CreateLongShotMatchDto) {
    return this.longShotService.matchCreate(createLongShotMatchDto);
  }

  @Get('match/findAll')
  async matchFindAll() {
    return await this.longShotService.matchFindAll();
  }

  @Get('match/findAll/league/:id')
  async matchFindAllByLeague(@Param('id') id: string) {
    return await this.longShotService.matchFindAllByLeague(id);
  }

  @Get('match/findOne/:id')
  async matchFindOne(@Param('id') id: string) {
    return await this.longShotService.matchFindOne(id);
  }

  @Patch('match/updateResult')
  async matchUpdateResult(
    @Body() updateLongShotMatchResultDto: UpdateLongShotMatchResultDto,
  ) {
    return await this.longShotService.matchUpdateResult(
      updateLongShotMatchResultDto, 
    );
  }

  @Delete('match/delete/:id')
  async matchDelete(@Param('id') id: string) {
    return await this.longShotService.matchDelete(id);
  }

  // Participants

  @Post('participant/create')
  async participantCreate(
    @Body() createLongShotParticipantDto: CreateLongShotParticipantDto,
  ) {
    return await this.longShotService.participantCreate(
      createLongShotParticipantDto,
    );
  }

  @Get('participant/findAll')
  async participantFindAll() {
    return await this.longShotService.participantFindAll();
  }

  @Get('participant/findOne/:initData')
  async participantFindOne(@Param('initData') initData: string) {
    return await this.longShotService.participantFindOne(initData);
  }

  // Tickets

  @Get('ticket/findAll')
  async ticketFindAll() {
    return await this.longShotService.ticketFindAll();
  }

  @Get('ticket/findOne/:initData')
  async ticketFindOne(@Param('initData') initData: string) {
    return await this.longShotService.ticketFindOne(initData);
  }

  @Get('ticket/findOne/:initData/:packId')
  async ticketFindOneWithPack(@Param('initData') initData: string, @Param('packId') packId: string) {
    return await this.longShotService.ticketFindOneWithPack(initData, packId);
  }

  
  @Patch('ticket/buy/:initData/:packId/:ticketLevel')
  async ticketBuy(
    @Param('initData') initData: string,
    @Param('packId') packId: string,
    @Param('ticketLevel', ParseIntPipe) ticketLevel: 1 | 2 | 3,
  ) {
    return await this.longShotService.ticketBuy(initData, packId, ticketLevel);
  }
}
