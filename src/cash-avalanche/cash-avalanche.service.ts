import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCashAvalancheDto } from './dto/create-cash-avalanche.dto';
import { BidDto } from './dto/bid.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CashAvalancheEntity } from './entities/cash-avalanche.entity';
import { ArrayContainedBy, LessThan, MoreThan, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CashAvalancheService {
  constructor(
    @InjectRepository(CashAvalancheEntity)
    private readonly cashAvalancheRepo: Repository<CashAvalancheEntity>,
    private readonly usersService: UsersService,
  ) {}

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
          findOneGame.allParticipants.push(bidDto.initData);
          findOneGame.allParticipantsCount += 1;
          findOneGame.totalReward =
            findOneGame.totalReward + findOneGame.nextBid;
          findOneGame.nextBid = findOneGame.nextBid + findOneGame.bidStep;
          findOneGame.remainingTime =
            Date.now() + Number(findOneGame.intervalTime);

          await this.usersService.updateUserTgmCount(
            bidDto.initData,
            findOneUser.tgmCount - findOneGame.nextBid,
          );
          return await this.cashAvalancheRepo.save(findOneGame);
        } else {
          throw new HttpException('TGM Is Not Enough', HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('Time Has Been Passed', HttpStatus.FORBIDDEN);
      }
    } else {
      throw new HttpException('Game Not Found', HttpStatus.NOT_FOUND);
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
            findOneGame.allParticipants[findOneGame.allParticipants.length - 1],
            (findOneGame.totalReward * 90) / 100,
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
          'The Game Is Being Continued',
          HttpStatus.FORBIDDEN,
        );
      }
    } else {
      throw new HttpException('Game Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async findAll() {
    const allGames = await this.cashAvalancheRepo.find();
    const refactoredGames = [];
    for (const i of allGames) {
      let highestBidParticipant = null;
      if (i.allParticipants.length > 0) {
        highestBidParticipant = await this.usersService.find(
          i.allParticipants[i.allParticipants.length - 1],
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
    return await this.cashAvalancheRepo.find({
      where: {
        allParticipants: ArrayContainedBy([initData]),
        remainingTime:
          type === 'active' ? MoreThan(Date.now()) : LessThan(Date.now()),
      },
    });
  }

  async delete(gameId: string) {
    return await this.cashAvalancheRepo.delete({
      gameId: Number(gameId),
    });
  }
}
