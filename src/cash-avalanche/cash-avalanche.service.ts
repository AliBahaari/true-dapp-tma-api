import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCashAvalancheDto } from './dto/create-cash-avalanche.dto';
import { BidDto } from './dto/bid.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CashAvalancheEntity } from './entities/cash-avalanche.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CashAvalancheService {
  constructor(
    @InjectRepository(CashAvalancheEntity)
    private readonly cashAvalancheRepo: Repository<CashAvalancheEntity>,
    private readonly usersService: UsersService,
  ) {}

  async create(createCashAvalancheDto: CreateCashAvalancheDto) {
    const gameId = Math.ceil(Math.random() * 100000000000000).toString();

    return await this.cashAvalancheRepo.save({
      gameId,
      startReward: createCashAvalancheDto.startReward,
      bidStep: createCashAvalancheDto.bidStep,
      intervalTime: createCashAvalancheDto.intervalTime * 60 * 1000,
      remainingTime:
        Date.now() + createCashAvalancheDto.intervalTime * 60 * 1000,
      totalReward: createCashAvalancheDto.startReward,
      allParticipants: [],
      allParticipantsCount: 0,
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
      if (Date.now() < Number(findOneGame.remainingTime)) {
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
        gameId,
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
    return (await this.cashAvalancheRepo.find()).map((i) => ({
      ...i,
      active: Date.now() < Number(i.remainingTime) ? true : false,
    }));
  }

  async findOne(gameId: string) {
    return await this.cashAvalancheRepo.findOne({
      where: {
        gameId,
      },
    });
  }

  async delete(gameId: string) {
    return await this.cashAvalancheRepo.delete({
      gameId,
    });
  }
}
