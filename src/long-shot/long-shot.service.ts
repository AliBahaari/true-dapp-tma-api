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
import { UsersService } from 'src/users/users.service';
import { CreateLongShotParticipateLeagueWeeklyDto } from './dto/create-long-shot-participate-league-weekly.dto';
import { CreateLongShotPackDto } from './dto/create-long-shot-pack.dto';
import { LongShotPacksEntity } from './entities/long-shot-packs.entity';

@Injectable()
export class LongShotService {
  constructor(
    @InjectRepository(LongShotPacksEntity)
    private readonly packsRepo: Repository<LongShotPacksEntity>,
    @InjectRepository(LongShotLeaguesWeeklyEntity)
    private readonly leaguesWeeklyRepo: Repository<LongShotLeaguesWeeklyEntity>,
    @InjectRepository(LongShotMatchesEntity)
    private readonly matchesRepo: Repository<LongShotMatchesEntity>,
    @InjectRepository(LongShotParticipantsEntity)
    private readonly participantsRepo: Repository<LongShotParticipantsEntity>,
    private readonly usersService: UsersService,
  ) {}

  // ------------------------- Packs -------------------------

  async packCreate(createLongShotPackDto: CreateLongShotPackDto) {
    return await this.packsRepo.save(createLongShotPackDto);
  }

  async packFindAll() {
    return await this.packsRepo.find({
      relations: {
        leaguesWeekly: true,
      },
    });
  }

  async packFindOne(id: string) {
    return await this.packsRepo.findOne({
      where: {
        id,
      },
      relations: {
        leaguesWeekly: true,
      },
    });
  }

  async packDelete(id: string) {
    return await this.packsRepo.delete({
      id,
    });
  }

  async findWinner(id: string, initData: string) {
    const packFindOne = await this.packsRepo.findOne({
      where: {
        id,
      },
      relations: {
        leaguesWeekly: true,
      },
    });

    if (packFindOne) {
      if (new Date(packFindOne.endDate) > new Date(packFindOne.createdAt)) {
        // ------------------------- Check For Users Result -------------------------
        const allMatches = await this.matchesRepo.find();
        let checkWinner = true;
        allMatches.forEach(async (element) => {
          const choiceOfUser = await this.participantsRepo.findOne({
            where: {
              matchId: element.id,
              initData,
            },
          });
          if (element.result !== choiceOfUser.choice) {
            checkWinner = false;
          }
        });
        if (checkWinner) {
          // Give The Use Awards
        }
      } else {
        throw new HttpException(
          'Pack Has Not Been Terminated',
          HttpStatus.FORBIDDEN,
        );
      }
    } else {
      throw new HttpException('Pack Not Found', HttpStatus.NOT_FOUND);
    }
  }

  // ------------------------- Leagues Weekly -------------------------

  async leagueWeeklyCreate(
    createLongShotLeagueWeeklyDto: CreateLongShotLeagueWeeklyDto,
  ) {
    return this.leaguesWeeklyRepo.save(createLongShotLeagueWeeklyDto);
  }

  async leagueWeeklyVote(
    createLongShotParticipateLeagueWeeklyDto: CreateLongShotParticipateLeagueWeeklyDto,
  ) {
    await this.usersService.updateLongShotGameAllowanceLeagueCount(
      createLongShotParticipateLeagueWeeklyDto.initData,
    );

    for (const vote of createLongShotParticipateLeagueWeeklyDto.votes) {
      await this.participantsRepo.save({
        ...vote,
        initData: createLongShotParticipateLeagueWeeklyDto.initData,
      });
    }
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

  async participantFindOne(initData: string) {
    return await this.participantsRepo.find({
      where: {
        initData,
      },
    });
  }

  async participantBuyTicket(initData: string, ticketLevel: 1 | 2 | 3) {
    const userFindOne = await this.usersService.find(initData);

    if (userFindOne) {
      if (ticketLevel === 1) {
        await this.usersService.updateUserTgmCount(initData, 10, 'SUBTRACT');
        await this.usersService.updateLongShotGameInfo(initData, 10, 1, 1);
      } else if (ticketLevel === 2) {
        if (userFindOne.boughtTgmCount === 1000000) {
          await this.usersService.updateUserTgmCount(
            initData,
            1000,
            'SUBTRACT',
          );
          await this.usersService.updateLongShotGameInfo(initData, 1000, 2, 3);
        } else {
          throw new HttpException(
            'User Should Buy 1000000 TGM',
            HttpStatus.FORBIDDEN,
          );
        }
      } else if (ticketLevel === 3) {
        if (userFindOne.boughtTgmCount === 10000000) {
          if (userFindOne.isVip) {
            await this.usersService.updateUserTgmCount(
              initData,
              100000,
              'SUBTRACT',
            );
            await this.usersService.updateLongShotGameInfo(
              initData,
              100000,
              3,
              5,
            );
          } else {
            throw new HttpException('User Should Be VIP', HttpStatus.FORBIDDEN);
          }
        } else {
          throw new HttpException(
            'User Should Buy 10000000 TGM',
            HttpStatus.FORBIDDEN,
          );
        }
      }
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }
}
