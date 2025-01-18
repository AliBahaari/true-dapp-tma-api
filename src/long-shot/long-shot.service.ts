import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

const matchesCount = {
  1: 10,
  2: 30,
  3: 50,
};

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
    @InjectRepository(LongShotTicketEntity)
    private readonly ticketsRepo: Repository<LongShotTicketEntity>,
    private readonly usersService: UsersService,
  ) {}

  // ------------------------- Packs -------------------------

  async packCreate(createLongShotPackDto: CreateLongShotPackDto) {
    return await this.packsRepo.save(createLongShotPackDto);
  }

  async packFindAll() {
    return (
      await this.packsRepo.find({
        relations: {
          leaguesWeekly: true,
        },
      })
    ).filter((i) => ({
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
      throw new HttpException('Pack Not Found', HttpStatus.NOT_FOUND);
    }

    const ticketFindOne = await this.ticketsRepo.findOne({
      where: {
        initData,
        packId: packFindOne.id,
      },
    });
    if (!ticketFindOne) {
      throw new HttpException(
        "Ticket Hasn't Been Bought",
        HttpStatus.FORBIDDEN,
      );
    }

    if (new Date() < new Date(packFindOne.endDate)) {
      throw new HttpException(
        'Pack Has Not Been Terminated',
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
        'Some Matches Result Have Not Been Set',
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

    if (
      checkWinner &&
      participatedCompetitionsCount === matchesCount[ticketFindOne.ticketLevel]
    ) {
      packFindOne.winner = initData;
      await this.packsRepo.save(packFindOne);

      return {
        status: HttpStatus.OK,
        message: 'You Won',
      };
    } else {
      throw new HttpException('You Lost', HttpStatus.FORBIDDEN);
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
      throw new HttpException('Pack Not Found', HttpStatus.NOT_FOUND);
    }

    if (new Date() < new Date(packFindOne.endDate)) {
      throw new HttpException(
        'Pack Has Not Been Terminated',
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      !packFindOne.hasWinnerClaimedReward &&
      packFindOne.winner === initData
    ) {
      await this.usersService.updateUserTgmCount(
        initData,
        (packFindOne.reward * 90) / 100,
        'ADD',
      );
      packFindOne.hasWinnerClaimedReward = true;
      return await this.packsRepo.save(packFindOne);
    } else if (packFindOne.hasWinnerClaimedReward) {
      throw new HttpException(
        'User Has Cliamed Reward Before',
        HttpStatus.FORBIDDEN,
      );
    } else if (packFindOne.winner !== initData) {
      throw new HttpException('Winner Is Another One', HttpStatus.FORBIDDEN);
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
      throw new HttpException('Pack Not Found', HttpStatus.NOT_FOUND);
    }

    if (new Date() > new Date(packFindOne.endDate)) {
      throw new HttpException(
        'Pack Date Has Been Terminated',
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

  // Ticket Buy
  async ticketBuy(initData: string, packId: string, ticketLevel: 1 | 2 | 3) {
    const userFindOne = await this.usersService.find(initData);

    if (userFindOne) {
      if (ticketLevel === 1) {
        await this.usersService.updateUserTgmCount(initData, 10, 'SUBTRACT');
        await this.createTicket(initData, packId, 10, 1, 1);

        return {
          status: HttpStatus.OK,
          message: 'You Bought Level 1 Ticket',
        };
      } else if (ticketLevel === 2) {
        if (userFindOne.boughtTgmCount === 1000000) {
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
            await this.createTicket(initData, packId, 100000, 3, 5);

            return {
              status: HttpStatus.OK,
              message: 'You Bought Level 3 Ticket',
            };
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
        "Ticket Hasn't Been Bought",
        HttpStatus.FORBIDDEN,
      );
    }

    if (ticketFindOne.allowanceLeagueCount === 0) {
      throw new HttpException(
        "You Can't Participate In More Leagues.",
        HttpStatus.FORBIDDEN,
      );
    }

    ticketFindOne.allowanceLeagueCount -= 1;
    ticketFindOne.participatedLeagues.push(leagueWeeklyId);

    await this.ticketsRepo.save(ticketFindOne);
  }
}
