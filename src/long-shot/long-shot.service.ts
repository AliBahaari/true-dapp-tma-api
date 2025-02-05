import { ConflictException, HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateLongShotLeagueWeeklyDto } from './dto/create-long-shot-league-weekly.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LongShotLeaguesWeeklyEntity } from './entities/long-shot-leagues-weekly.entity';
import { In, Repository } from 'typeorm';
import { LongShotMatchesEntity } from './entities/long-shot-matches.entity';
import { CreateLongShotMatchDto } from './dto/create-long-shot-match.dto';
import { UpdateLongShotMatchResultDto } from './dto/update-long-shot-match-result.dto';
import { CreateLongShotParticipantDto } from './dto/create-long-shot-participant.dto';
import { LongShotParticipantsEntity } from './entities/long-shot-participants.entity';
import { UsersService } from 'src/users/users.service';
import { CreateLongShotParticipateLeagueWeeklyDto } from './dto/create-long-shot-participate-league-weekly.dto';
import { CreateLongShotPackDto } from './dto/create-long-shot-pack.dto';
import { LongShotPacksEntity } from './entities/long-shot-packs.entity';
import { LongShotTicketEntity } from './entities/long-shot-tickets.entity';
import { ExceptionMessageEnum } from 'src/common/enum/exception-messages.enum';
import { LongShotLeagueWeeklyFilterDto } from './dto/long-shot-league-weekly-filter.dto';

const matchesCount = {
  1: 1,
  2: 3,
  3: 5,
};

@Injectable()
export class LongShotService implements OnModuleInit {
  constructor(
    @InjectRepository(LongShotPacksEntity)
    private readonly packsRepo: Repository<LongShotPacksEntity>,
    @InjectRepository(LongShotLeaguesWeeklyEntity)
    private readonly leaguesWeeklyRepo: Repository<LongShotLeaguesWeeklyEntity>,
    @InjectRepository(LongShotMatchesEntity)
    private readonly matchesRepo: Repository<LongShotMatchesEntity>,
    @InjectRepository(LongShotParticipantsEntity)
    private readonly participantsRepo: Repository<LongShotParticipantsEntity>,
    @InjectRepository(LongShotTicketEntity)
    private readonly ticketsRepo: Repository<LongShotTicketEntity>,
    private readonly usersService: UsersService,
  ) { }
  onModuleInit() { }

  // ------------------------- Packs -------------------------

  async packCreate(createLongShotPackDto: CreateLongShotPackDto) {
    const activePack = await this.findActivePack();
    if (activePack) {
      throw new ConflictException(ExceptionMessageEnum.THERE_IS_AN_ACTIVE_PACK);
    }
    return await this.packsRepo.save(createLongShotPackDto);
  }

  async findActivePack(): Promise<LongShotPacksEntity> {
    const currentDate = new Date().toISOString();
    return this.packsRepo
      .createQueryBuilder('pack')
      .where('pack.endDate > :currentDate', { currentDate })
      .getOne();
  }

  async packFindAll() {
    return (
      await this.packsRepo.find({
        relations: {
          leaguesWeekly: true,
        },
      })
    ).map((i) => ({
      ...i,
      active: new Date() < new Date(i.endDate),
    }));
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

  // Find Winner Endpoint
  async findWinner(packId: string, initData: string) {
    const packFindOne = await this.packsRepo.findOne({
      where: {
        id: packId,
      },
      relations: {
        leaguesWeekly: true,
      },
    });
    if (!packFindOne) {
      throw new HttpException(ExceptionMessageEnum.PACK_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const ticketFindOne = await this.ticketsRepo.findOne({
      where: {
        initData,
        packId: packFindOne.id,
      },
    });
    if (!ticketFindOne) {
      throw new HttpException(
        ExceptionMessageEnum.TICKET_HAS_NOT_BEEN_BOUGHT,
        HttpStatus.FORBIDDEN,
      );
    }

    if (new Date() < new Date(packFindOne.endDate)) {
      throw new HttpException(
        ExceptionMessageEnum.PACK_HAB_NOOT_BEEN_TERMINATED,
        HttpStatus.FORBIDDEN,
      );
    }

    const allMatches = await this.matchesRepo.find({
      where: {
        leagueWeeklyId: In(packFindOne.leaguesWeekly.map((i) => i.id)),
      },
    });
    const nullResults = allMatches.filter((i) => i.result === null);
    if (nullResults.length > 0) {
      throw new HttpException(
        ExceptionMessageEnum.SOME_MATCHES_RESULT_HAVE_NOT_BEEN_SET,
        HttpStatus.FORBIDDEN,
      );
    }
    let participatedCompetitionsCount = 0;
    let checkWinner = true;
    allMatches.forEach(async (element) => {
      const choiceOfUser = await this.participantsRepo.findOne({
        where: {
          matchId: element.id,
          initData,
        },
      });

      participatedCompetitionsCount += 1;

      if (element.result !== choiceOfUser.choice) {
        checkWinner = false;
      }
    });
    //TODO THIS SHOULD BE CHECKED
    if (
      checkWinner &&
      ticketFindOne.participatedLeagues.length === matchesCount[ticketFindOne.ticketLevel]
    ) {
      packFindOne.winner = initData;
      await this.packsRepo.save(packFindOne);

      return {
        status: HttpStatus.OK,
        message: 'You Won',
      };
    } else {
      throw new HttpException(ExceptionMessageEnum.YOU_LOST, HttpStatus.FORBIDDEN);
    }
  }

  // Claim Reward Endpoint
  async claimReward(packId: string, initData: string) {
    const packFindOne = await this.packsRepo.findOne({
      where: {
        id: packId,
      },
    });
    if (!packFindOne) {
      throw new HttpException(ExceptionMessageEnum.PACK_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (new Date() < new Date(packFindOne.endDate)) {
      throw new HttpException(
        ExceptionMessageEnum.PACK_HAB_NOOT_BEEN_TERMINATED,
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      !packFindOne.hasWinnerClaimedReward &&
      packFindOne.winner === initData
    ) {
      const ticket = await this.ticketFindOneWithPackOrFail(initData, packId);
      if (!ticket) {
        throw new HttpException(
          ExceptionMessageEnum.TICKET_HAS_NOT_BEEN_BOUGHT,
          HttpStatus.FORBIDDEN,
        );
      }
      switch (ticket.ticketLevel) {
        case 1:
          packFindOne.reward = packFindOne.reward * 1000
          break;
        case 2:
          packFindOne.reward = packFindOne.reward * 100000
          break;
        case 3:
          packFindOne.reward = packFindOne.reward * 10000000
          break;
      }
      await this.usersService.updateUserTgmCount(
        initData,
        Math.round((packFindOne.reward * 90) / 100),
        'ADD',
      );
      packFindOne.hasWinnerClaimedReward = true;
      return await this.packsRepo.save(packFindOne);
    } else if (packFindOne.hasWinnerClaimedReward) {
      throw new HttpException(
        ExceptionMessageEnum.USER_HAS_CLIAMED_REWARD_BEFORE,
        HttpStatus.FORBIDDEN,
      );
    } else if (packFindOne.winner !== initData) {
      throw new HttpException(ExceptionMessageEnum.WINNER_IS_ANOTHER_ONE, HttpStatus.FORBIDDEN);
    }
  }

  // ------------------------- Leagues Weekly -------------------------

  async leagueWeeklyCreate(
    createLongShotLeagueWeeklyDto: CreateLongShotLeagueWeeklyDto,
  ) {
    return this.leaguesWeeklyRepo.save(createLongShotLeagueWeeklyDto);
  }

  // Vote Endpoint
  async vote(
    createLongShotParticipateLeagueWeeklyDto: CreateLongShotParticipateLeagueWeeklyDto,
  ) {
    const packFindOne = await this.packsRepo.findOne({
      where: {
        id: createLongShotParticipateLeagueWeeklyDto.packId,
      },
    });
    if (!packFindOne) {
      throw new HttpException(ExceptionMessageEnum.PACK_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (new Date() > new Date(packFindOne.endDate)) {
      throw new HttpException(
        ExceptionMessageEnum.PACK_DATE_HAS_BEEN_TERMINATED,
        HttpStatus.FORBIDDEN,
      );
    }

    await this.updateTicketAllowanceLeagueCount(
      createLongShotParticipateLeagueWeeklyDto.initData,
      createLongShotParticipateLeagueWeeklyDto.packId,
      createLongShotParticipateLeagueWeeklyDto.leagueWeeklyId,
    );

    createLongShotParticipateLeagueWeeklyDto.votes.forEach(async (vote) => {
      await this.participantsRepo.save({
        ...vote,
        initData: createLongShotParticipateLeagueWeeklyDto.initData,
      });
    });
  }

  async leagueWeeklyFindAll() {
    return await this.leaguesWeeklyRepo.find({
      relations: {
        matches: true,
        pack: true
      },
    });
  }

  async leagueWeeklyFindAllByPack(longShotLeagueWeeklyFilterDto: LongShotLeagueWeeklyFilterDto) {
    return await this.leaguesWeeklyRepo.find({
      relations: {
        matches: true,
        pack: true
      },
      where: {
        packId: longShotLeagueWeeklyFilterDto.packId
      }
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
      throw new HttpException(ExceptionMessageEnum.MATCH_NOT_FOUND, HttpStatus.NOT_FOUND);
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

  // ------------------------- Tickets -------------------------

  async ticketFindAll() {
    return await this.ticketsRepo.find();
  }

  async ticketFindOne(initData: string) {
    return await this.ticketsRepo.find({
      where: {
        initData,
      },
    });
  }
  async ticketFindOneWithPackOrFail(initData: string, packId: string) {
    return await this.ticketsRepo.findOne({
      where: {
        initData,
        packId
      },
    });
  }

  async ticketFindOneWithPack(initData: string, packId: string) {
    const result = await this.ticketsRepo.findOne({
      where: {
        initData,
        packId
      },
    });
    if (!result) {
      return { ticketCount: 0 }
    }
    return result
  }

  // Ticket Buy
  async ticketBuy(initData: string, packId: string, ticketLevel: 1 | 2 | 3) {
    const userFindOne = await this.usersService.find(initData);
    const ticket = await this.ticketFindOneWithPackOrFail(initData, packId);
    if (ticket) {
      throw new HttpException(
        ExceptionMessageEnum.TICKET_ALREADY_HAS_BEEN_BOUGHT,
        HttpStatus.FORBIDDEN,
      );
    }
    if (userFindOne) {
      if (ticketLevel === 1) {
        await this.usersService.updateUserTgmCount(initData, 10, 'SUBTRACT');
        await this.createTicket(initData, packId, 10, 1, 1);

        return {
          status: HttpStatus.OK,
          message: 'You Bought Level 1 Ticket',
        };
      } else if (ticketLevel === 2) {
        if (userFindOne.boughtTgmCount >= 1000000) {
          await this.usersService.updateUserTgmCount(
            initData,
            1000,
            'SUBTRACT',
          );
          await this.createTicket(initData, packId, 1000, 2, 3);

          return {
            status: HttpStatus.OK,
            message: 'You Bought Level 2 Ticket',
          };
        } else {
          throw new HttpException(
            ExceptionMessageEnum.USER_SHOULD_BUY_1000000_TGM,
            HttpStatus.FORBIDDEN,
          );
        }
      } else if (ticketLevel === 3) {
        if (userFindOne.boughtTgmCount >= 10000000) {
          if (userFindOne.isVip) {
            await this.usersService.updateUserTgmCount(
              initData,
              100000,
              'SUBTRACT',
            );
            await this.createTicket(initData, packId, 100000, 3, 5);

            return {
              status: HttpStatus.OK,
              message: 'You Bought Level 3 Ticket',
            };
          } else {
            throw new HttpException(ExceptionMessageEnum.USER_SHOULD_BE_VIP, HttpStatus.FORBIDDEN);
          }
        } else {
          throw new HttpException(
            ExceptionMessageEnum.USER_SHOULD_BUY_10000000_TGM,
            HttpStatus.FORBIDDEN,
          );
        }
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  async createTicket(
    initData: string,
    packId: string,
    longShotGameTgmCount: number,
    ticketLevel: 1 | 2 | 3,
    allowanceLeagueCount: number,
  ) {
    await this.ticketsRepo.save({
      initData,
      allowanceLeagueCount,
      longShotGameTgmCount,
      ticketLevel,
      participatedLeagues: [],
      packId,
    });
  }

  async updateTicketAllowanceLeagueCount(
    initData: string,
    packId: string,
    leagueWeeklyId: string,
  ) {
    const ticketFindOne = await this.ticketsRepo.findOne({
      where: {
        initData,
        packId,
      },
    });
    if (!ticketFindOne) {
      throw new HttpException(
        ExceptionMessageEnum.TICKET_HAS_NOT_BEEN_BOUGHT,
        HttpStatus.FORBIDDEN,
      );
    }

    if (ticketFindOne.allowanceLeagueCount === 0) {
      throw new HttpException(
        ExceptionMessageEnum.YOU_CANT_PARTICIPATE_IN_MORE_LEAGUES,
        HttpStatus.FORBIDDEN,
      );
    }

    ticketFindOne.allowanceLeagueCount -= 1;
    ticketFindOne.participatedLeagues.push(leagueWeeklyId);

    await this.ticketsRepo.save(ticketFindOne);
  }
}
