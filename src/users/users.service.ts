import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as CryptoJS from 'crypto-js';
import Decimal from 'decimal.js';
import { BuyTgmDto } from './dto/buy-tgm.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { CreateRedEnvelopeDto } from './dto/create-red-envelope.dto';
import { fibonacciPosition } from './utils/fibonacciPosition';

@Injectable()
export class UsersService {
  private readonly imageFolder = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'images',
  );

  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (!fs.existsSync(this.imageFolder)) {
      fs.mkdirSync(this.imageFolder, { recursive: true });
    }

    let downloadedImage = '';
    try {
      const response = await axios({
        url: createUserDto.image,
        method: 'GET',
        responseType: 'stream',
      });

      const extension = path.extname(createUserDto.image) || '.jpg'; // Default to .jpg if no extension
      const filename = `${crypto.randomUUID()}${extension}`;
      const filePath = path.join(this.imageFolder, filename);

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      downloadedImage = `/static/images/${filename}`;
    } catch (error) {
      throw new HttpException(
        `Failed To Download The Image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const referralCode = Math.random().toString(36).substring(2, 7);
    const privateCode = Math.random().toString(36).substring(2, 7);
    const initData = createUserDto.initData;
    const secretCodeHash = CryptoJS.SHA256(
      initData + privateCode.toString(),
    ).toString();
    const hourlyRewardTime = Date.now() + 3600000;

    await this.userRepo.save({
      initData,
      fullName: createUserDto.fullName,
      image: downloadedImage,
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
      hourlyRewardTime,
      invitedUserBuyTgmCommission: 0,
      packageIds: [],
      redEnvelopeCount: 0,
      secretCode: secretCodeHash,
    });

    return {
      initData,
      fullName: createUserDto.fullName,
      image: downloadedImage,
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
      hourlyRewardTime,
      invitedUserBuyTgmCommission: 0,
      packageIds: [],
      redEnvelopeCount: 0,
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
    if (
      buyTgmDto.type &&
      buyTgmDto.type !== 1 &&
      buyTgmDto.type !== 2 &&
      buyTgmDto.type !== 3 &&
      buyTgmDto.type !== 4
    ) {
      throw new HttpException('Package ID Is Wrong', HttpStatus.FORBIDDEN);
    }
    if (buyTgmDto.type && userFindOne.packageIds.includes(buyTgmDto.type)) {
      throw new HttpException(
        'The Package ID Has Been Bought Previously',
        HttpStatus.FORBIDDEN,
      );
    }

    let packageReward = 0;
    if (buyTgmDto.type) {
      if (buyTgmDto.type === 1) {
        packageReward = 100000;
      } else if (buyTgmDto.type === 2) {
        packageReward = 1000000;
      } else if (buyTgmDto.type === 3) {
        packageReward = 10000000;
      } else if (buyTgmDto.type === 4) {
        packageReward = 1000000;
        userFindOne.isVip = true;
      }
      userFindOne.packageIds.push(buyTgmDto.type);
    }

    if (userFindOne.invitedBy) {
      userFindOne.invitedUserBuyTgmCommission += Math.floor(
        (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (5 / 100),
      );
      userFindOne.boughtTgmCount += buyTgmDto.type
        ? packageReward
        : buyTgmDto.amount;
      userFindOne.tgmCount += Math.floor(
        (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (95 / 100),
      );
    } else {
      userFindOne.boughtTgmCount += buyTgmDto.type
        ? packageReward
        : buyTgmDto.amount;
      userFindOne.tgmCount += buyTgmDto.type ? packageReward : buyTgmDto.amount;
    }

    return await this.userRepo.save(userFindOne);
  }

  async createRedEnvelope(createRedEnvelopeDto: CreateRedEnvelopeDto) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        referralCode: createRedEnvelopeDto.referralCode,
      },
    });
    if (!userFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    userFindOne.redEnvelopeCount += createRedEnvelopeDto.amount;
    await this.userRepo.save(userFindOne);
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

    let whoInvitedUser = null;
    if (userFindOne.invitedBy) {
      whoInvitedUser = await this.userRepo.findOne({
        where: {
          referralCode: userFindOne.invitedBy,
        },
      });
    }

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
        whoInvitedUser: {
          walletAddress: whoInvitedUser && whoInvitedUser.walletAddress,
          isVip: whoInvitedUser && whoInvitedUser.isVip,
        },
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
    referralCodeUserFindOne.level = fibonacciPosition(
      referralCodeUserFindOne.referralCount,
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

  async updateInvitedUserBuyTgmCommission(invitedUserId: string) {
    const invitedUserFindOne = await this.userRepo.findOne({
      where: {
        id: invitedUserId,
      },
    });
    if (!invitedUserFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    if (!invitedUserFindOne.invitedBy) {
      throw new HttpException(
        'User Has Not Been Invited By Anyone',
        HttpStatus.FORBIDDEN,
      );
    }
    if (invitedUserFindOne.invitedUserBuyTgmCommission === 0) {
      throw new HttpException('No Commission Remained', HttpStatus.FORBIDDEN);
    }

    const initDataUserFindOne = await this.userRepo.findOne({
      where: {
        referralCode: invitedUserFindOne.invitedBy,
      },
    });
    if (!initDataUserFindOne) {
      throw new HttpException('Init Data User Not Found', HttpStatus.NOT_FOUND);
    }

    initDataUserFindOne.tgmCount +=
      invitedUserFindOne.invitedUserBuyTgmCommission;
    invitedUserFindOne.invitedUserBuyTgmCommission = 0;

    await this.userRepo.save(invitedUserFindOne);
    await this.userRepo.save(initDataUserFindOne);
  }

  async updateUserHourlyReward(initData: string) {
    const hourlyRewardTime = Date.now() + 3600000;
    const hourlyRewardCount = 100;

    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    if (Date.now() > userFindOne.hourlyRewardTime) {
      userFindOne.hourlyRewardTime = hourlyRewardTime;
      await this.userRepo.save(userFindOne);
      return await this.updateUserTgmCount(initData, hourlyRewardCount, 'ADD');
    } else {
      throw new HttpException('Time Has Not Been Passed', HttpStatus.FORBIDDEN);
    }
  }

  async updateClaimUserRedEnvelope(initData: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    userFindOne.tgmCount += userFindOne.redEnvelopeCount;
    userFindOne.redEnvelopeCount = 0;

    await this.userRepo.save(userFindOne);
  }

  async deleteUser(initData: string) {
    return await this.userRepo.delete({
      initData,
    });
  }
}
