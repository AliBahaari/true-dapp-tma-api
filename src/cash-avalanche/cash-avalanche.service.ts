import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCashAvalancheDto } from './dto/create-cash-avalanche.dto';
import { BidDto } from './dto/bid.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CashAvalancheEntity } from './entities/cash-avalanche.entity';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { OnModuleInit } from '@nestjs/common/interfaces';
import { ExceptionMessageEnum } from 'src/common/enum/exception-messages.enum';
import { TaskEnum } from 'src/common/enum/tasks.enum';

@Injectable()
export class CashAvalancheService {
  constructor(
    @InjectRepository(CashAvalancheEntity)
    private readonly cashAvalancheRepo: Repository<CashAvalancheEntity>,
    private readonly usersService: UsersService,
  ) { }

  // async onModuleInit() {
  //   for (let i = 0; i < this.x.length; i++) {
  //     const element = this.x[i];
  //     const res = this.cashAvalancheRepo.create({
  //       allParticipants: element.allParticipants,
  //       allParticipantsCount: element.allParticipantsCount,
  //       bidStart: element.bidStart,
  //       bidStep: element.bidStep,
  //       gameId: element.gameId,
  //       hasClaimedReward: Boolean(element.hasClaimedReward),
  //       id: element.id,
  //       intervalTime: element.intervalTime,
  //       nextBid: element.nextBid,
  //       remainingTime: element.remainingTime,
  //       startAt: element.startAt,
  //       startReward: element.startReward,
  //       totalReward: element.totalReward,
  //     });
  //     console.log("created");
  //     console.log(res.id);
  //     await this.cashAvalancheRepo.save(res);
  //   }
  // }
  async create(createCashAvalancheDto: CreateCashAvalancheDto) {
    const latestCashAvalancheGame = await this.cashAvalancheRepo.find({
      order: {
        gameId: 'DESC',
      },
      take: 1,
    });
    let gameId = 0;
    if (latestCashAvalancheGame[0]) {
      gameId = latestCashAvalancheGame[0].gameId + 1;
    }

    return await this.cashAvalancheRepo.save({
      gameId,
      startReward: createCashAvalancheDto.startReward,
      bidStep: createCashAvalancheDto.bidStep,
      intervalTime: createCashAvalancheDto.intervalTime * 60 * 1000,
      startAt: createCashAvalancheDto.startAt,
      remainingTime:
        createCashAvalancheDto.startAt +
        createCashAvalancheDto.intervalTime * 60 * 1000,
      totalReward: createCashAvalancheDto.startReward,
      allParticipants: [],
      allParticipantsCount: 0,
      bidStart: createCashAvalancheDto.bidStart,
      nextBid: createCashAvalancheDto.bidStart + createCashAvalancheDto.bidStep,
    });
  }

  async bid(bidDto: BidDto) {
    const findOneGame = await this.cashAvalancheRepo.findOne({
      where: {
        gameId: bidDto.gameId,
      },
    });

    const findOneUser = await this.usersService.find(bidDto.initData);

    if (findOneGame) {
      if (
        Date.now() < Number(findOneGame.remainingTime) &&
        Date.now() > Number(findOneGame.startAt)
      ) {
        if (findOneUser.tgmCount >= findOneGame.nextBid) {
          findOneGame.allParticipants.push({
            initData: bidDto.initData,
            bid: findOneGame.nextBid,
          });
          findOneGame.allParticipantsCount += 1;
          findOneGame.totalReward =
            findOneGame.totalReward + findOneGame.nextBid;
          findOneGame.nextBid = findOneGame.nextBid + findOneGame.bidStep;
          findOneGame.remainingTime =
            Date.now() + Number(findOneGame.intervalTime);

          await this.usersService.addTask(bidDto.initData, TaskEnum.FIRST_CASH_AVALANCHE);
          await this.usersService.updateUserTgmCount(
            bidDto.initData,
            findOneUser.tgmCount - findOneGame.nextBid,
          );
          return await this.cashAvalancheRepo.save(findOneGame);
        } else {
          throw new HttpException(ExceptionMessageEnum.TGM_IS_NOT_ENOUGH, HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException(ExceptionMessageEnum.TIME_HAS_NOT_BEEN_PASSED, HttpStatus.FORBIDDEN);
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.GAME_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  async findWinner(gameId: string) {
    const findOneGame = await this.cashAvalancheRepo.findOne({
      where: {
        gameId: Number(gameId),
      },
    });

    if (findOneGame) {
      if (Date.now() > Number(findOneGame.remainingTime)) {
        if (!findOneGame.hasClaimedReward) {
          await this.usersService.updateUserTgmCount(
            findOneGame.allParticipants[findOneGame.allParticipants.length - 1]
              .initData,
            Math.floor((findOneGame.totalReward * 90) / 100),
            'ADD',
          );
          findOneGame.hasClaimedReward = true;
          this.cashAvalancheRepo.save(findOneGame);
        }

        return {
          winner:
            findOneGame.allParticipants[findOneGame.allParticipants.length - 1],
          totalReward: (findOneGame.totalReward * 90) / 100,
        };
      } else {
        throw new HttpException(
          ExceptionMessageEnum.THE_GAME_IS_BEING_CONTINUED,
          HttpStatus.FORBIDDEN,
        );
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.GAME_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  async findAll() {
    const allGames = await this.cashAvalancheRepo.find();
    const refactoredGames = [];
    for (const i of allGames) {
      let highestBidParticipant = null;
      if (i.allParticipants.length > 0) {
        highestBidParticipant = await this.usersService.find(
          i.allParticipants[i.allParticipants.length - 1].initData,
        );
      }

      refactoredGames.push({
        ...i,
        active:
          Date.now() < Number(i.remainingTime) && Date.now() > Number(i.startAt)
            ? true
            : false,
        highestBidParticipant,
      });
    }
    return refactoredGames;
  }

  async findOne(gameId: string) {
    return await this.cashAvalancheRepo.findOne({
      where: {
        gameId: Number(gameId),
      },
    });
  }

  async findUserGames(initData: string, type: 'active' | 'history') {
    const cashAvalancheGamesFind = await this.cashAvalancheRepo.find({
      where: {
        remainingTime:
          type === 'active' ? MoreThan(Date.now()) : LessThan(Date.now()),
      },
    });
    const participatedCashAvalancheGames = [];
    if (cashAvalancheGamesFind.length > 0) {
      for (const i of cashAvalancheGamesFind) {
        if (i.allParticipants.find((i) => i.initData === initData)) {
          participatedCashAvalancheGames.push(i);
        }
      }
    }

    return participatedCashAvalancheGames;
  }

  async delete(gameId: string) {
    return await this.cashAvalancheRepo.delete({
      gameId: Number(gameId),
    });
  }
}
