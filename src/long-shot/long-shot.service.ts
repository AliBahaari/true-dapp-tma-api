import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLongShotLeagueWeeklyDto } from './dto/create-long-shot-league-weekly.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LongShotLeaguesWeeklyEntity } from './entities/long-shot-leagues-weekly.entity';
import { Repository } from 'typeorm';
import { LongShotMatchesEntity } from './entities/long-shot-matches.entity';
import { CreateLongShotMatchDto } from './dto/create-long-shot-match.dto';
import { UpdateLongShotMatchResultDto } from './dto/update-long-shot-match-result.dto';
import { CreateLongShotParticipantDto } from './dto/create-long-shot-participant.dto';
import { LongShotParticipantsEntity } from './entities/long-shot-participants.entity';

@Injectable()
export class LongShotService {
  constructor(
    @InjectRepository(LongShotLeaguesWeeklyEntity)
    private readonly leaguesWeeklyRepo: Repository<LongShotLeaguesWeeklyEntity>,
    @InjectRepository(LongShotMatchesEntity)
    private readonly matchesRepo: Repository<LongShotMatchesEntity>,
    @InjectRepository(LongShotParticipantsEntity)
    private readonly participantsRepo: Repository<LongShotParticipantsEntity>,
  ) {}

  // ------------------------- Leagues Weekly -------------------------

  async leagueWeeklyCreate(
    createLongShotLeagueWeeklyDto: CreateLongShotLeagueWeeklyDto,
  ) {
    return this.leaguesWeeklyRepo.save(createLongShotLeagueWeeklyDto);
  }

  async leagueWeeklyFindAll() {
    return await this.leaguesWeeklyRepo.find({
      relations: {
        matches: true,
      },
    });
  }

  async leagueWeeklyFindOne(id: string) {
    return await this.leaguesWeeklyRepo.findOne({
      where: {
        id,
      },
      relations: {
        matches: true,
      },
    });
  }

  async leagueWeeklyDelete(id: string) {
    return await this.leaguesWeeklyRepo.delete({
      id,
    });
  }

  // ------------------------- Matches -------------------------

  async matchCreate(createLongShotMatchDto: CreateLongShotMatchDto) {
    return await this.matchesRepo.save(createLongShotMatchDto);
  }

  async matchFindAll() {
    return await this.matchesRepo.find({
      relations: {
        participants: true,
      },
    });
  }

  async matchFindOne(id: string) {
    return await this.matchesRepo.findOne({
      where: {
        id,
      },
      relations: {
        participants: true,
      },
    });
  }

  async matchUpdateResult(
    id: string,
    updateLongShotMatchResultDto: UpdateLongShotMatchResultDto,
  ) {
    const matchFindOne = await this.matchesRepo.findOne({
      where: {
        id,
      },
    });

    if (matchFindOne) {
      matchFindOne.result = updateLongShotMatchResultDto.result;
      return await this.matchesRepo.save(matchFindOne);
    } else {
      throw new HttpException('The Match Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async matchDelete(id: string) {
    return await this.matchesRepo.delete({
      id,
    });
  }

  // ------------------------- Participants -------------------------

  async participantCreate(
    createLongShotParticipantDto: CreateLongShotParticipantDto,
  ) {
    return await this.participantsRepo.save(createLongShotParticipantDto);
  }

  async participantFindAll() {
    return await this.participantsRepo.find();
  }

  async participantFindOne(id: string) {
    return await this.participantsRepo.findOne({
      where: {
        id,
      },
    });
  }
}
