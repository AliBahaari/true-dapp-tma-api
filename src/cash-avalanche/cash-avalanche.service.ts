import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCashAvalancheDto } from './dto/create-cash-avalanche.dto';
import { BidDto } from './dto/bid.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CashAvalancheEntity } from './entities/cash-avalanche.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CashAvalancheService {
  constructor(
    @InjectRepository(CashAvalancheEntity)
    private readonly cashAvalancheRepo: Repository<CashAvalancheEntity>,
  ) {}

  async create(createCashAvalancheDto: CreateCashAvalancheDto) {
    const gameId = Math.random().toString(36).substring(2, 10);

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
      nextBid:
        createCashAvalancheDto.startReward + createCashAvalancheDto.bidStep,
    });
  }

  async bid(bidDto: BidDto) {
    const findOneGame = await this.cashAvalancheRepo.findOne({
      where: {
        gameId: bidDto.gameId,
      },
    });

    if (findOneGame) {
      if (Date.now() < Number(findOneGame.remainingTime)) {
        findOneGame.allParticipants.push(bidDto.initData);
        findOneGame.allParticipantsCount += 1;
        findOneGame.totalReward = findOneGame.totalReward + findOneGame.nextBid;
        findOneGame.nextBid = findOneGame.nextBid + findOneGame.bidStep;
        findOneGame.remainingTime =
          Date.now() + Number(findOneGame.intervalTime);

        return await this.cashAvalancheRepo.save(findOneGame);
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
        return {
          winner:
            findOneGame.allParticipants[findOneGame.allParticipants.length - 1],
          totalReward: findOneGame.totalReward,
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

  async findAllActive() {
    return (await this.cashAvalancheRepo.find()).filter(
      (i) => Date.now() < Number(i.remainingTime),
    );
  }
}
