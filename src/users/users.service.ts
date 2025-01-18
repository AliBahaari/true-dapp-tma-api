import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as CryptoJS from 'crypto-js';
import Decimal from 'decimal.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const referralCode = Math.random().toString(36).substring(2, 7);
    const privateCode = Math.random().toString(36).substring(2, 7);
    const initData = createUserDto.initData;
    const secretCodeHash = CryptoJS.SHA256(
      initData + privateCode.toString(),
    ).toString();

    await this.userRepo.save({
      initData,
      fullName: createUserDto.fullName,
      tgmCount: 0,
      tapCoinCount: 0,
      level: 1,
      referralCount: 0,
      referralCode,
      completedTasks: [],
      claimedRewards: [],
      lastOnline: '',
      privateCode,
      estimatedTgmPrice: '0',
      invitedBy: createUserDto.invitedBy || null,
      isVip: false,
      referralRewardsCount: 0,
      boughtTgmCount: 0,
      secretCode: secretCodeHash,
    });

    return {
      initData,
      fullName: createUserDto.fullName,
      tgmCount: 0,
      tapCoinCount: 0,
      level: 1,
      referralCount: 0,
      referralCode,
      completedTasks: [],
      claimedRewards: [],
      lastOnline: '',
      privateCode,
      estimatedTgmPrice: '0',
      invitedBy: createUserDto.invitedBy || null,
      isVip: false,
      referralRewardsCount: 0,
      boughtTgmCount: 0,
    };
  }

  async findAll() {
    return await this.userRepo.find();
  }

  async compareBySecretCode(secretCode: string) {
    return await this.userRepo.findOne({
      where: {
        secretCode,
      },
    });
  }

  async find(initData: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      const usersFindAll = await this.userRepo.find();
      let allEstimatedTgmPrices = '0';
      usersFindAll.map((i) => {
        const previousValue = new Decimal(allEstimatedTgmPrices);
        const currentValue = new Decimal(i.estimatedTgmPrice);
        allEstimatedTgmPrices = Decimal.sum(
          previousValue,
          currentValue,
        ).toString();
      });

      userFindOne.lastOnline = new Date().toLocaleDateString();
      await this.userRepo.save(userFindOne);
      const { secretCode, ...restProps } = userFindOne;
      const rowsCount = await this.userRepo.count();

      return {
        ...restProps,
        allEstimatedTgmPrices: Decimal.div(
          allEstimatedTgmPrices,
          rowsCount,
        ).toFixed(8),
      };
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async updateReferralCode(initData: string, referralCode: string) {
    const initDataUserFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (initDataUserFindOne) {
      if (
        initDataUserFindOne.invitedBy &&
        initDataUserFindOne.invitedBy.length > 0
      ) {
        throw new HttpException(
          'User Has Been Invited Previously',
          HttpStatus.NOT_FOUND,
        );
      } else {
        initDataUserFindOne.invitedBy = referralCode;
        this.userRepo.save(initDataUserFindOne);
      }
    } else {
      throw new HttpException('Init Data Not Found', HttpStatus.NOT_FOUND);
    }

    const referralCodeUserFindOne = await this.userRepo.findOne({
      where: {
        referralCode,
      },
    });
    if (referralCodeUserFindOne) {
      referralCodeUserFindOne.referralCount += 1;
      referralCodeUserFindOne.referralRewardsCount += 100;
      referralCodeUserFindOne.level = Math.ceil(
        referralCodeUserFindOne.referralCount / 6.18,
      );
      await this.userRepo.save(referralCodeUserFindOne);
      const { secretCode, ...restProps } = referralCodeUserFindOne;
      return restProps;
    } else {
      throw new HttpException('Referral Code Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async updateClaimReferralReward(initData: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });

    if (userFindOne) {
      if (userFindOne.referralRewardsCount > 0) {
        userFindOne.tgmCount += userFindOne.referralRewardsCount;
        userFindOne.referralRewardsCount = 0;
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      } else {
        throw new HttpException('No Rewards Remained', HttpStatus.NOT_FOUND);
      }
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async findInvitedBy(referralCode: string) {
    const allInvitedByUser = await this.userRepo.find({
      where: {
        invitedBy: referralCode,
      },
    });
    return allInvitedByUser.map((i) => {
      const { secretCode, ...restProps } = i;
      return restProps;
    });
  }

  async findRanking(initData: string) {
    const usersFindAll = await this.userRepo.find({
      order: {
        tgmCount: 'DESC',
      },
    });

    const foundIndex = usersFindAll.findIndex((i) => i.initData === initData);

    return {
      highestRanks: usersFindAll.slice(0, 10),
      sequenceRanks: [
        {
          rank: foundIndex - 5 + 1,
          value: usersFindAll[foundIndex - 5],
        },
        {
          rank: foundIndex - 4 + 1,
          value: usersFindAll[foundIndex - 4],
        },
        {
          rank: foundIndex - 3 + 1,
          value: usersFindAll[foundIndex - 3],
        },
        {
          rank: foundIndex - 2 + 1,
          value: usersFindAll[foundIndex - 2],
        },
        {
          rank: foundIndex - 1 + 1,
          value: usersFindAll[foundIndex - 1],
        },
        {
          rank: foundIndex + 1,
          value: usersFindAll[foundIndex],
        },
        {
          rank: foundIndex + 1 + 1,
          value: usersFindAll[foundIndex + 1],
        },
        {
          rank: foundIndex + 2 + 1,
          value: usersFindAll[foundIndex + 2],
        },
        {
          rank: foundIndex + 3 + 1,
          value: usersFindAll[foundIndex + 3],
        },
        {
          rank: foundIndex + 4 + 1,
          value: usersFindAll[foundIndex + 4],
        },
        {
          rank: foundIndex + 5 + 1,
          value: usersFindAll[foundIndex + 5],
        },
      ],
    };
  }

  async findAllUsersCount() {
    const findAllUsers = await this.userRepo.find();

    let tgmCount = 0;
    findAllUsers.forEach((i) => {
      tgmCount += i.tgmCount;
    });

    const todayUsers = await this.userRepo.find({
      where: {
        lastOnline: new Date().toLocaleDateString(),
      },
    });

    return {
      allUsers: await this.userRepo.count(),
      todayUsers: todayUsers.length,
      tapCount: 0,
      tgmCount,
    };
  }

  async deleteUser(initData: string) {
    return await this.userRepo.delete({
      initData,
    });
  }

  async updateTaskReward(
    initData: string,
    taskName: string,
    taskReward: string,
  ) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      if (userFindOne.claimedRewards.includes(taskName)) {
        throw new HttpException(
          'The Task Has Been Claimed Before',
          HttpStatus.NOT_FOUND,
        );
      } else {
        userFindOne.tgmCount += Number(taskReward);
        userFindOne.claimedRewards.push(taskName);
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      }
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async updateEstimatedTgmPrice(initData: string, estimatedPrice: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      if (userFindOne.completedTasks.includes('TGMPriceEstimation')) {
        throw new HttpException(
          'The Task Has Been Completed Before',
          HttpStatus.NOT_FOUND,
        );
      } else {
        userFindOne.estimatedTgmPrice = estimatedPrice;
        userFindOne.completedTasks.push('TGMPriceEstimation');
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      }
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async updateUserTgmCount(
    initData: string,
    tgmCount: number,
    type: 'ADD' | 'EQUAL' | 'SUBTRACT' = 'EQUAL',
  ) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    if (type === 'EQUAL') {
      userFindOne.tgmCount = tgmCount;
    } else if (type === 'ADD') {
      userFindOne.tgmCount += tgmCount;
    } else if (type === 'SUBTRACT') {
      userFindOne.tgmCount -= tgmCount;
    }
    await this.userRepo.save(userFindOne);
  }
}
