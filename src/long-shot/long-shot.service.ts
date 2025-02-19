import { BadRequestException, HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExceptionMessageEnum } from 'src/common/enum/exception-messages.enum';
import { UsersService } from 'src/users/users.service';
import { Between, In, LessThan, MoreThan, Repository } from 'typeorm';
import { CreateLongShotLeagueWeeklyDto } from './dto/create-long-shot-league-weekly.dto';
import { CreateLongShotMatchDto } from './dto/create-long-shot-match.dto';
import { CreateLongShotPackDto } from './dto/create-long-shot-pack.dto';
import { CreateLongShotParticipantDto } from './dto/create-long-shot-participant.dto';
import { CreateLongShotTeamDto } from './dto/create-long-shot-team.dto';
import { UpdateLongShotMatchResultDto } from './dto/update-long-shot-match-result.dto';
import { UpdateLongShotTeamDto } from './dto/update-long-shot-team.dto';
import { LongShotLeaguesWeeklyEntity } from './entities/long-shot-leagues-weekly.entity';
import { LongShotMatchesEntity } from './entities/long-shot-matches.entity';
import { LongShotPacksEntity } from './entities/long-shot-packs.entity';
import { LongShotParticipantsEntity } from './entities/long-shot-participants.entity';
import { LongShotTeamEntity } from './entities/long-shot-teams.entity';
import { LongShotTicketEntity } from './entities/long-shot-tickets.entity';
import { CreateLongShotParticipateLeagueWeeklyDto } from './dto/create-long-shot-participate-league-weekly.dto';
import { LongShotLeagueWeeklyFilterDto } from './dto/long-shot-league-weekly-filter.dto';
import * as util from 'util'
import { TaskEnum } from 'src/common/enum/tasks.enum';

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
    @InjectRepository(LongShotTeamEntity)
    private readonly teamRepo: Repository<LongShotTeamEntity>,
    private readonly usersService: UsersService,
    
  ) { }
  onModuleInit() {}

  //find all pack => match group by league
  async findMatchByAllPack() {
    const currentDate = new Date();

    // Fetch all packs with their matches and related data
    const packs = await this.packsRepo
      .createQueryBuilder('pack')
      .where('pack.endDate > :currentDate', { currentDate })
      .leftJoinAndSelect('pack.matches', 'matches')
      .leftJoinAndSelect('matches.leagueWeekly', 'leagueWeekly')
      .leftJoinAndSelect('matches.firstTeam', 'firstTeam')
      .leftJoinAndSelect('matches.secondTeam', 'secondTeam')
      .getMany();

    // Transform the packs to group matches by league
    const transformedPacks = packs.map((pack) => {
      const leaguesMap = new Map<string, any>();

      // Group matches by league
      for (const match of pack.matches) {
        const leagueId = match.leagueWeekly.id;

        if (!leaguesMap.has(leagueId)) {
          leaguesMap.set(leagueId, {
            ...match.leagueWeekly, // Include all leagueWeekly properties
            matches: [],
          });
        }

        leaguesMap.get(leagueId).matches.push({
          ...match, // Include all match properties
          firstTeam: match.firstTeam, // Already included via spread, but explicit for clarity
          secondTeam: match.secondTeam,
        });
      }

      // Convert the map to an array of leagues
      const leagues = Array.from(leaguesMap.values());

      // Return the pack with grouped leagues
      return {
        ...pack, // Include all pack properties
        leagues, // Array of leagues, each containing their matches
        matches: undefined, // Remove the original flat matches array
      };
    });

    return transformedPacks;
  }

  async lastestActivePack() {
    const currentDate = new Date();

    // Fetch all packs with their matches and related data
    const pack = await this.packsRepo
      .createQueryBuilder('pack')
      .where('pack.endDate > :currentDate', { currentDate })
      .andWhere('pack.startDate < :currentDate', { currentDate })
      .leftJoinAndSelect('pack.matches', 'matches')
      .leftJoinAndSelect('matches.leagueWeekly', 'leagueWeekly')
      .leftJoinAndSelect('matches.firstTeam', 'firstTeam')
      .leftJoinAndSelect('matches.secondTeam', 'secondTeam')
      .getOne();

      if (!pack) {
        throw new HttpException('Pack not found', HttpStatus.NOT_FOUND);
      }

      const leaguesMap = new Map<string, any>();

      for (const match of pack.matches) {
        const leagueId = match.leagueWeekly.id;

        if (!leaguesMap.has(leagueId)) {
          leaguesMap.set(leagueId, {
            ...match.leagueWeekly,
            matches: [],
          });
        }

        leaguesMap.get(leagueId).matches.push({
          ...match
        });
      }

      const leagues = Array.from(leaguesMap.values());

      delete pack.matches
      return {
        ...pack,
        leagues,
      };
  }

  //find one pack id => match group by league

  async findMatchByPack(id: string) {
    const pack = await this.packsRepo.findOne({
      where: { id },
      relations: {
        matches: {
          leagueWeekly: true,
          firstTeam: true,
          secondTeam: true,
        },
      },
    });

    if (!pack) {
      throw new HttpException('Pack not found', HttpStatus.NOT_FOUND);
    }

    const leaguesMap = new Map<string, any>();

    for (const match of pack.matches) {
      const leagueId = match.leagueWeekly.id;

      if (!leaguesMap.has(leagueId)) {
        leaguesMap.set(leagueId, {
          ...match.leagueWeekly,
          matches: [],
        });
      }

      leaguesMap.get(leagueId).matches.push({
        ...match
      });
    }

    const leagues = Array.from(leaguesMap.values());

    delete pack.matches
    return {
      ...pack,
      leagues,
    };
  }

  /*
  async findCountOfTicket(ticketId: string) {
    const ticket = await this.ticketsRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const pack = await this.packsRepo.findOne({
      where: {
        tickets: {
          id: ticketId,
        },
      },
    });

    if (!pack) {
      throw new Error('Pack not found for the given ticketId');
    }

    const packsInTimeLine = await this.packsRepo.find({
      where: [
        {
          startDate: Between(pack.startDate, pack.endDate),
        },
        {
          endDate: Between(pack.startDate, pack.endDate),
        },
        {
          tickets: {
            initData: ticket.initData,
          },
        },
      ],
    });
    if (packsInTimeLine.length < 1) {
      return 1
    }
    if (!packsInTimeLine.some((p) => p.id === pack.id)) {
      packsInTimeLine.push(pack);
    }

    return packsInTimeLine.length;
  }
*/

  // ------------------------- Teams -------------------------
  //#region team
  async teamCreate(createLongShotTeamDto: CreateLongShotTeamDto) {
    return await this.teamRepo.save(createLongShotTeamDto);
  }

  async teamDelete(id: string) {
    const haveMatch = await this.matchesRepo.find({
      where: [
        { firstTeamId: id },
        { secondTeamId: id }
      ],
    });
    if (haveMatch.length >= 1) {
      for (let i = 0; i < haveMatch.length; i++) {
        const element = haveMatch[i];
        await this.matchDelete(element.id);
      }
    }
    return await this.teamRepo.delete(id);
  }

  async teamUpdate(id: string, updateLongShotTeamDto: UpdateLongShotTeamDto) {
    return await this.teamRepo.update(id, updateLongShotTeamDto);
  }

  async teamFindOne(id: string) {
    return await this.teamRepo.findOne({
      where: { id },
      relations: {
        league: true
      }
    });
  }

  async findTeamsByLeague(leagueId: string) {
    return await this.teamRepo.find({
      where: { leagueId }
    });
  }

  async teamList() {
    return await this.teamRepo.find({
      relations: {
        league: true
      }
    });
  }
  //#endregion


  // ------------------------- Packs -------------------------
  //#region pack
  async packCreate(createLongShotPackDto: CreateLongShotPackDto) {
    // return await this.packsRepo.save({
    //   ...createLongShotPackDto,
    //   leagueWeeklyId: createLongShotPackDto.leagueWeaklyId
    // });

    const leagueIds = Array.from(new Set(createLongShotPackDto.matches.map(x => x.leagueWeeklyId)));
    const ticketLevel = this.ticketLevelMapper(leagueIds.length);

    const activePack=await this.packsRepo.findOne({
      where: [
        {
          startDate: Between(createLongShotPackDto.startDate, createLongShotPackDto.endDate),
        },
        {
          endDate: Between(createLongShotPackDto.startDate, createLongShotPackDto.endDate),
        }
      ],
    })

    if(activePack)
    throw new BadRequestException(ExceptionMessageEnum.ACTIVE_PACK_IS_EXIST_ALREADY)


    const createdPack = await this.packsRepo.save({
      startDate: createLongShotPackDto.startDate,
      endDate: createLongShotPackDto.endDate,
      guessTime: createLongShotPackDto.guessTime,
      reward: createLongShotPackDto.reward,
      title: createLongShotPackDto.title,
      ticketLevel: ticketLevel
    });

    for (const matchDto of createLongShotPackDto.matches) {
      const createMatchDto: CreateLongShotMatchDto = {
        firstTeamId: matchDto.firstTeamId,
        leagueWeeklyId: matchDto.leagueWeeklyId,
        matchDate: matchDto.matchDate,
        packId: createdPack.id,
        secondTeamId: matchDto.secondTeamId
      };

      await this.matchCreate(createMatchDto);
    }
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
      await this.packsRepo.find()
    ).map((i) => ({
      ...i,
      active: new Date() < new Date(i.endDate),
    }));
  }

  async packFindOne(id: string) {
    return await this.packsRepo.findOne({
      where: {
        id,
      }
    });
  }

  async packOfLeagues(leagueId: string) {
    let pack = await this.packsRepo.find({
      where: {
        matches: {
          leagueWeeklyId: leagueId
        }
      },
      relations: {
        matches: true,
      },
    });

    const updatedPack = pack.map((i) => {
      const currentTime = new Date();
      const guessEndTime = new Date(new Date(i.startDate).getTime() + i.guessTime);
      const isActive = currentTime < new Date(i.endDate);

      return {
        ...i,
        canGuess: currentTime < guessEndTime,
        active: isActive,
      };
    });

    return updatedPack;
  }

  async packDelete(id: string) {
    return await this.packsRepo.delete({
      id,
    });
  }
  //#endregion


  /*
  //#region updateResultWithFindWinner
  async updateMatchResultAndFindWinner(
    updateLongShotMatchResultDto: UpdateLongShotMatchResultDto,
  ) {

    for (let i = 0; i < updateLongShotMatchResultDto.matches.length; i++) {
      const element = updateLongShotMatchResultDto.matches[i];
      const matchFindOne = await this.matchesRepo.findOne({
        where: {
          id: element.matchId,
        },
      });

      if (matchFindOne) {
        matchFindOne.result = element.result;
        await this.matchesRepo.save(matchFindOne);
      } else {
        throw new HttpException(
          ExceptionMessageEnum.MATCH_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    if (updateLongShotMatchResultDto.packId) {
      await this.packsRepo.update(updateLongShotMatchResultDto.packId, {
        isUpdatedResult: true,
      });
    }
    const packFindOne = await this.packsRepo.findOne({
      where: {
        id: updateLongShotMatchResultDto.packId,
      },
      relations: {
        matches: true,
      },
    });

    if (!packFindOne) {
      throw new HttpException(
        ExceptionMessageEnum.PACK_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const allMatches = await this.matchesRepo.find({
      where: {
        leagueWeeklyId: packFindOne.leagueWeekly.id,
        packId: updateLongShotMatchResultDto.packId,
      },
    });

    const nullResults = allMatches.filter((i) => i.result === null);
    if (nullResults.length > 0) {
      throw new HttpException(
        ExceptionMessageEnum.SOME_MATCHES_RESULT_HAVE_NOT_BEEN_SET,
        HttpStatus.FORBIDDEN,
      );
    }

    const tickets = await this.ticketsRepo.find({
      where: {
        packId: updateLongShotMatchResultDto.packId,
      },
    });

    for (const ticket of tickets) {
      let checkWinner = true;

      for (const match of allMatches) {
        const choiceOfUser = await this.participantsRepo.findOne({
          where: {
            matchId: match.id,
            initData: ticket.initData,
          },
        });

        if (!choiceOfUser || match.result !== choiceOfUser.choice) {
          checkWinner = false;
          break;
        }
      }


      if (
        checkWinner &&
        ticket.participatedLeagues.length >= matchesCount[ticket.ticketLevel]
      ) {
        packFindOne.winner.push(ticket.initData);
        packFindOne.hasWinnerClaimedReward.push(false);
      }
    }


    await this.packsRepo.save(packFindOne);

    return {
      status: HttpStatus.OK,
      message: 'Match results updated and winners calculated successfully.',
    };
  }
  //#endregion
*/

  async matchUpdateResult(
    updateLongShotMatchResultDto: UpdateLongShotMatchResultDto,
  ) {

    for (let i = 0; i < updateLongShotMatchResultDto.matches.length; i++) {
      const element = updateLongShotMatchResultDto.matches[i];
      const matchFindOne = await this.matchesRepo.findOne({
        where: {
          id: element.matchId,
        }
      });

      if (matchFindOne) {
        matchFindOne.result = element.result;
        await this.matchesRepo.save(matchFindOne);
      } else {
        throw new HttpException(ExceptionMessageEnum.MATCH_NOT_FOUND, HttpStatus.NOT_FOUND);
      }
    }




    if (updateLongShotMatchResultDto.packId) {
      const findPack=await this.packsRepo.findOne({
        where:{
          id:updateLongShotMatchResultDto.packId
        },
        relations:{
          matches:true
        }
      })
      const leagues=findPack.matches.map(x=>x.leagueWeeklyId)
      const uniqueLeagueIds=Array.from(new Set(leagues))

      for (let index = 0; index < uniqueLeagueIds.length; index++) {
        const unqieuLeague = uniqueLeagueIds[index];
        const leagueMatches=findPack.matches.filter(x=>x.leagueWeeklyId==unqieuLeague)
        const checkMatchesResults=leagueMatches.filter(x=>x.result=='')
        if(checkMatchesResults.length==0)
        {
         if(!findPack.leagueUpdateResult.find(x=>x==unqieuLeague))
         {
          findPack.leagueUpdateResult.push(unqieuLeague)
          await this.packsRepo.update(findPack.id,{
            leagueUpdateResult:findPack.leagueUpdateResult
          })
         }
        }
      }

      const findMatchsPack=await this.packsRepo.findOne({
        where:{
          id:updateLongShotMatchResultDto.packId
        },
        relations:{
          matches:true
        }
      })
      const matchResults=findMatchsPack.matches.map(x=>x.result)
      console.log(matchResults)
      const emptyResult=matchResults.filter(x=>x=='')
      console.log(emptyResult)
      if(emptyResult.length>0)
      {
        await this.packsRepo.update(updateLongShotMatchResultDto.packId, {
          isUpdatedResult: false
        });
      }
      if(emptyResult.length==0)
      {
        await this.packsRepo.update(updateLongShotMatchResultDto.packId, {
          isUpdatedResult: true
        });
      }

    }
    return true;
  }


  // Find Winner Endpoint
  async findWinner(packId: string, initData: string) {
    const packFindOne = await this.packsRepo.findOne({
      where: {
        id: packId,
      },
      relations: {
        matches: true
      },
    });
    if (!packFindOne) {
      throw new HttpException(ExceptionMessageEnum.PACK_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const ticketFindOne = await this.ticketsRepo.findOne({
      where: {
        initData,
        pack: {id:packFindOne.id},
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

    const allMatches = packFindOne.matches

    const nullResults = allMatches.filter((i) => i.result === null);
    if (nullResults.length > 0) {
      throw new HttpException(
        ExceptionMessageEnum.SOME_MATCHES_RESULT_HAVE_NOT_BEEN_SET,
        HttpStatus.FORBIDDEN,
      );
    }
    let participatedCompetitionsCount = 0;
    let checkWinner = true;
    for (let i = 0; i < allMatches.length; i++) {
      const element = allMatches[i];
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

    };

    //TODO THIS SHOULD BE CHECKED
    if (
      checkWinner &&
      ticketFindOne.participatedLeagues.length >= matchesCount[ticketFindOne.ticketLevel]
    ) {
      packFindOne.winner.push(initData);
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



  // ------------------------- Leagues Weekly -------------------------
  //#region league
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
        matches: true
      },
    });
  }


  async leagueWeeklyFindAllByPack(longShotLeagueWeeklyFilterDto: LongShotLeagueWeeklyFilterDto) {
    return await this.packsRepo.findOne({
      where:{id:longShotLeagueWeeklyFilterDto.packId},
      relations:{
        matches:true
      }
    })
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
    const leagueMatch = await this.matchFindAllByLeague(id);
    if (leagueMatch.length >= 1) {
      for (let y = 0; y < leagueMatch.length; y++) {
        const element = leagueMatch[y];
        await this.matchDelete(element.id);
      }
    }
    const leagueTeam = await this.findTeamsByLeague(id);
    if (leagueTeam.length >= 1) {
      for (let y = 0; y < leagueTeam.length; y++) {
        const element = leagueTeam[y];
        await this.teamDelete(element.id);
      }
    }
    const leaguePacks = await this.packOfLeagues(id);
    if (leaguePacks.length >= 1) {
      for (let y = 0; y < leaguePacks.length; y++) {
        const element = leaguePacks[y];
        await this.packDelete(element.id);
      }
    }
    return await this.leaguesWeeklyRepo.delete({
      id,
    });
  }
  //#endregion

  // ------------------------- Matches -------------------------
  //#region match
  async matchCreate(createLongShotMatchDto: CreateLongShotMatchDto) {
    return await this.matchesRepo.save(createLongShotMatchDto);
  }

  async matchFindAll() {
    return await this.matchesRepo.find({
      relations: {
        participants: true,
        firstTeam: true,
        secondTeam: true
      },
    });
  }

  async matchFindAllByLeague(leagueId: string) {
    return await this.matchesRepo.find({
      relations: {
        participants: true,
        firstTeam: true,
        secondTeam: true
      },
      where: {
        leagueWeeklyId: leagueId
      }
    });
  }

  async matchFindAllByPack(packId: string) {
    return await this.matchesRepo.find({
      relations: {
        participants: true,
        firstTeam: true,
        secondTeam: true
      },
      where: {
        packId: packId
      }
    });
  }

  async matchFindOne(id: string) {
    return await this.matchesRepo.findOne({
      where: {
        id,
      },
      relations: {
        participants: true,
        firstTeam: true,
        secondTeam: true
      },
    });
  }



  async matchDelete(id: string) {
    const findParticipant = await this.participantsRepo.find({
      where: {
        matchId: id
      }
    });
    if (findParticipant.length >= 1) {
      for (let x = 0; x < findParticipant.length; x++) {
        const element = findParticipant[x];
        await this.participantsRepo.delete(element.id);
      }
    }
    return await this.matchesRepo.delete({
      id,
    });
  }
  //#endregion

  // ------------------------- Participants -------------------------
  //#region Participants
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
  //#endregion

  // ------------------------- Tickets -------------------------
  //#region ticket
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

  async ticketFindOneActivePack(initData: string) {
    const currentDate = new Date();
    const pack = await this.packsRepo
    .createQueryBuilder('pack')
    .where('pack.endDate > :currentDate', { currentDate })
    .andWhere('pack.startDate < :currentDate', { currentDate })
    .getOne();
    return await this.ticketsRepo.find({
      where: {
        initData,
        pack: {
          id: pack.id
        }
      },
    });
  }


  /*
  async ticketFindOneWithPackOrFail(initData: string, packId: string) {
    return await this.ticketsRepo.findOne({
      where: {
        initData,
        packId
      },
    });
  }
  */

  /*
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
  */


  // Ticket Buy
  async ticketBuy(initData: string, packId: string, ticketLevel: 1 | 2 | 3) {
    const userFindOne = await this.usersService.findOneUser(initData);
    const findPack = await this.packsRepo.findOne({
      where: { id: packId }
    });

    if (ticketLevel > findPack.ticketLevel)
      throw new BadRequestException(ExceptionMessageEnum.YOU_CANT_BUY_THIS_LEVEL_OF_TICKET_FOR_THIS_PACK);

    const ticket = await this.ticketsRepo.findOne({
      where: {
        initData,
        pack: {
          id: packId
        }
      }
    });

    if (ticket) {
      throw new HttpException(
        ExceptionMessageEnum.TICKET_ALREADY_HAS_BEEN_BOUGHT,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!userFindOne)
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (ticketLevel === 1) {
      await this.usersService.updateUserTgmCount(initData, 10, 'SUBTRACT');
      await this.createTicket(initData, packId, 10, 1, 1);

      await this.usersService.addTask(initData, TaskEnum.FIRST_LONG_SHOT)
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

        await this.usersService.addTask(initData, TaskEnum.FIRST_LONG_SHOT)
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

          await this.usersService.addTask(initData, TaskEnum.FIRST_LONG_SHOT)
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
        pack:{id:packId},
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


  //#endregion


  ticketLevelMapper(input: number): number {
    switch (input) {
      case 1:
        return 1;
      case 2:
      case 3:
        return 2;
      case 4:
      case 5:
        return 3;
      default:
        throw new Error("Invalid number");

    }
  }

  async findUserDeActivePacksAndCalculateWinning(initData:string){
    const currentDate=new Date()
    const tickets=await this.ticketsRepo.find({
      where:{
        initData
      },
      relations:{
        pack:true
      }
    })

    let deActiveTickets=tickets.filter(x=>new Date(x.pack.endDate).getTime() < currentDate.getTime())

    for (let index = 0; index < deActiveTickets.length; index++) {
      const deActiveTicket = deActiveTickets[index];

      const checkIfUserIsWinner=deActiveTicket.pack.winner.find(x=>x==initData)
      if(checkIfUserIsWinner)
          deActiveTicket.pack["winninStatus"]=true


        if(!checkIfUserIsWinner)
          deActiveTicket.pack["winninStatus"]=false
    }

    return deActiveTickets
  }

  async checkUserWinninStatus(initData:string,packId:string){
    const findUserTicket=await this.ticketsRepo.findOne({
      where:{
        initData,
        pack:{
          id:packId
        }
      },
      relations: {
        pack: {
          matches: true
        }
      }
    })

    if(!findUserTicket)
    throw new BadRequestException(ExceptionMessageEnum.YOU_DID_NOT_BUY_TICKET_FOR_THIS_PACK)


    let lostMatches:string[]=[]
    let lostGuess:string[]=[]

    for (let index = 0; index < findUserTicket.pack.matches.length; index++) {
      const packMatch = findUserTicket.pack.matches[index];

      const userGuess=await this.participantsRepo.findOne({
        where:{
          initData,
          matchId:packMatch.id
        }
      })


      if(userGuess)
      {
       if(userGuess.choice!==packMatch.result)
       {
        lostMatches.push(packMatch.id)
       }
      }

      if(!userGuess)
      lostGuess.push(packMatch.id)
    }

    const userCheckedDuplicate=findUserTicket.pack.userChecked.find(x=>x==initData)
    if(!userCheckedDuplicate)
    {
      findUserTicket.pack.userChecked.push(initData)
    }

    if(lostMatches.length==0 && lostGuess.length==0)
    {
      const checkDuplicate=findUserTicket.pack.winner.find(x=>x==initData)
      if(!checkDuplicate)
      {
        findUserTicket.pack.winner.push(initData)
      }
      const userPack= await this.packsRepo.save(findUserTicket.pack)
      return {
       pack:userPack,
        winningStatus:true
     }
    }else{
      return {
        pack:findUserTicket.pack,
        winningStatus:false
      }
    }
  }

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
      !packFindOne.hasWinnerClaimedReward.includes(initData) &&
      packFindOne.winner.includes(initData)
    ) {
      const ticket = await this.ticketsRepo.findOne({
        where:{
          initData,
          pack:{id:packId}
        }
      })

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

      packFindOne.hasWinnerClaimedReward.push(initData)
      return await this.packsRepo.save(packFindOne);
    } else if (packFindOne.hasWinnerClaimedReward.includes(initData)) {
      throw new HttpException(
        ExceptionMessageEnum.USER_HAS_CLIAMED_REWARD_BEFORE,
        HttpStatus.FORBIDDEN,
      );
    } else if (!packFindOne.winner.includes(initData)) {
      throw new HttpException(ExceptionMessageEnum.WINNER_IS_ANOTHER_ONE, HttpStatus.FORBIDDEN);
    }
  }

}