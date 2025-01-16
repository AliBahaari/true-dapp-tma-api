import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { LongShotService } from './long-shot.service';
import { CreateLongShotLeagueWeeklyDto } from './dto/create-long-shot-league-weekly.dto';
import { CreateLongShotMatchDto } from './dto/create-long-shot-match.dto';
import { UpdateLongShotMatchResultDto } from './dto/update-long-shot-match-result.dto';
import { CreateLongShotParticipantDto } from './dto/create-long-shot-participant.dto';
import { CreateLongShotParticipateLeagueWeeklyDto } from './dto/create-long-shot-participate-league-weekly.dto';
import { CreateLongShotPackDto } from './dto/create-long-shot-pack.dto';

@Controller('long-shot')
export class LongShotController {
  constructor(private readonly longShotService: LongShotService) {}

  // Packs

  @Post('pack/create')
  async packCreate(@Body() createLongShotPackDto: CreateLongShotPackDto) {
    await this.longShotService.packCreate(createLongShotPackDto);
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

  @Get('pack/findWinner/:id/:initData')
  async packFindWinner(
    @Param('id') id: string,
    @Param('initData') initData: string,
  ) {
    return this.longShotService.findWinner(id, initData);
  }

  // Leagues Weekly

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
    return await this.longShotService.leagueWeeklyVote(
      createLongShotParticipateLeagueWeeklyDto,
    );
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

  @Get('match/findOne/:id')
  async matchFindOne(@Param('id') id: string) {
    return await this.longShotService.matchFindOne(id);
  }

  @Patch('match/updateResult/:id')
  async matchUpdateResult(
    @Param('id') id: string,
    @Body() updateLongShotMatchResultDto: UpdateLongShotMatchResultDto,
  ) {
    return await this.longShotService.matchUpdateResult(
      id,
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

  @Patch('participant/buyTicket/:initData/:ticketLevel')
  async participantBuyTicket(
    @Param('initData') initData: string,
    @Param('ticketLevel', ParseIntPipe) ticketLevel: 1 | 2 | 3,
  ) {
    await this.longShotService.participantBuyTicket(initData, ticketLevel);
  }
}
