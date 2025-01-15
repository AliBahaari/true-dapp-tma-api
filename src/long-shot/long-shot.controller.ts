import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { LongShotService } from './long-shot.service';
import { CreateLongShotLeagueWeeklyDto } from './dto/create-long-shot-league-weekly.dto';
import { CreateLongShotMatchDto } from './dto/create-long-shot-match.dto';
import { UpdateLongShotMatchResultDto } from './dto/update-long-shot-match-result.dto';
import { CreateLongShotParticipantDto } from './dto/create-long-shot-participant.dto';

@Controller('long-shot')
export class LongShotController {
  constructor(private readonly longShotService: LongShotService) {}

  // Leagues Weekly

  @Post('league-weekly/create')
  async leagueWeeklyCreate(
    @Body() createLongShotLeagueWeeklyDto: CreateLongShotLeagueWeeklyDto,
  ) {
    return this.longShotService.leagueWeeklyCreate(
      createLongShotLeagueWeeklyDto,
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

  @Get('participant/findOne/:id')
  async participantFindOne(@Param('id') id: string) {
    return await this.longShotService.participantFindOne(id);
  }
}
