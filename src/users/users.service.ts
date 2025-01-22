import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as CryptoJS from 'crypto-js';
import Decimal from 'decimal.js';
import { BuyTgmDto } from './dto/buy-tgm.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

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
      image: createUserDto.image,
      walletAddress: '',
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
      levelUpRewardsCount: 0,
      boughtTgmCount: 0,
      roles: createUserDto.roles,
      secretCode: secretCodeHash,
    });

    return {
      initData,
      fullName: createUserDto.fullName,
      image: createUserDto.image,
      walletAddress: '',
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
      levelUpRewardsCount: 0,
      boughtTgmCount: 0,
      roles: createUserDto.roles,
    };
  }

  async buyTgm(buyTgmDto: BuyTgmDto) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData: buyTgmDto.initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    if (userFindOne.invitedBy) {
      const invitedByFindOne = await this.userRepo.findOne({
        where: {
          invitedBy: userFindOne.invitedBy,
        },
      });
      if (!invitedByFindOne) {
        throw new HttpException(
          'Invited By User Not Found',
          HttpStatus.NOT_FOUND,
        );
      }

      invitedByFindOne.tgmCount += Math.floor(buyTgmDto.amount * (5 / 100));
      userFindOne.tgmCount += Math.floor(buyTgmDto.amount * (95 / 100));

      await this.userRepo.save(invitedByFindOne);
    } else {
      userFindOne.tgmCount += buyTgmDto.amount;
    }

    return await this.userRepo.save(userFindOne);
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

  async updateReferralCode(initData: string, referralCode: string) {
    const referralCodeUserFindOne = await this.userRepo.findOne({
      where: {
        referralCode,
      },
    });
    if (!referralCodeUserFindOne) {
      throw new HttpException('Referral Code Not Found', HttpStatus.NOT_FOUND);
    }

    const initDataUserFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!initDataUserFindOne) {
      throw new HttpException('Init Data Not Found', HttpStatus.NOT_FOUND);
    }
    if (
      initDataUserFindOne.invitedBy &&
      initDataUserFindOne.invitedBy.length > 0
    ) {
      throw new HttpException(
        'User Has Been Invited Previously',
        HttpStatus.NOT_FOUND,
      );
    }

    referralCodeUserFindOne.levelUpRewardsCount += 250;
    referralCodeUserFindOne.referralCount += 1;
    referralCodeUserFindOne.level = Math.ceil(
      referralCodeUserFindOne.referralCount / 6.18,
    );
    if (referralCodeUserFindOne.isVip) {
      initDataUserFindOne.referralRewardsCount += 200000;
    } else {
      initDataUserFindOne.referralRewardsCount += 100000;
    }
    initDataUserFindOne.invitedBy = referralCode;

    await this.userRepo.save(referralCodeUserFindOne);
    await this.userRepo.save(initDataUserFindOne);

    const { secretCode, ...restProps } = initDataUserFindOne;
    return restProps;
  }

  async updateClaimReferralReward(invitedUserId: string, initData: string) {
    const invitedUserFindOne = await this.userRepo.findOne({
      where: {
        id: invitedUserId,
      },
    });
    const initDataUserFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });

    if (invitedUserFindOne && initDataUserFindOne) {
      if (invitedUserFindOne.referralRewardsCount > 0) {
        initDataUserFindOne.tgmCount += invitedUserFindOne.referralRewardsCount;
        invitedUserFindOne.referralRewardsCount = 0;
        await this.userRepo.save(invitedUserFindOne);
        await this.userRepo.save(initDataUserFindOne);
        const { secretCode, ...restProps } = initDataUserFindOne;
        return restProps;
      } else {
        throw new HttpException(
          'No Referral Rewards Remained',
          HttpStatus.NOT_FOUND,
        );
      }
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async updateClaimLevelUpReward(initData: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });

    if (userFindOne) {
      if (userFindOne.levelUpRewardsCount > 0) {
        userFindOne.tgmCount += userFindOne.levelUpRewardsCount;
        userFindOne.levelUpRewardsCount = 0;
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      } else {
        throw new HttpException(
          'No Level Up Rewards Remained',
          HttpStatus.NOT_FOUND,
        );
      }
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
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

  async updateUserWalletAddress(initData: string, walletAddress: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    userFindOne.walletAddress = walletAddress;
    await this.userRepo.save(userFindOne);

    const { secretCode, ...restProps } = userFindOne;
    return restProps;
  }

  async updateUserRoles(updateUserRolesDto: UpdateUserRolesDto) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData: updateUserRolesDto.initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    userFindOne.roles = updateUserRolesDto.roles;

    return await this.userRepo.save(userFindOne);
  }

  async deleteUser(initData: string) {
    return await this.userRepo.delete({
      initData,
    });
  }
}
