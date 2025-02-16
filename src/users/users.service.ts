import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import Decimal from 'decimal.js';
import * as fs from 'fs';
import * as path from 'path';
import { ExceptionMessageEnum } from 'src/common/enum/exception-messages.enum';
import { TaskEnum } from 'src/common/enum/tasks.enum';
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { BuyTgmDto } from './dto/buy-tgm.dto';
import { CreateRedEnvelopeDto } from './dto/create-red-envelope.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { NewCreateRedEnvelopeDto } from './dto/new-create-red-envelope.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { PurchasedTgmEntity } from './entities/purchased-tgm.entity';
import { UserEntity, UserRoles } from './entities/user.entity';
import { fibonacciPosition } from './utils/fibonacciPosition';
var crypto = require('crypto');

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
    @InjectRepository(PurchasedTgmEntity) private purchasedTgmRepo: Repository<PurchasedTgmEntity>,
  ) {}

  private botToken = '8076475716:AAFoJwuUQShEQVFRQpSD-0ns1C62wRhS1a8';
  private apiUrl = `https://api.telegram.org/bot${this.botToken}`;

  async create(createUserDto: CreateUserDto) {
   try {
    let image = null;
        let downloadedImage = '';


    try {
      const response = await axios.get(`${this.apiUrl}/getUserProfilePhotos`, {
        params: { user_id: String(createUserDto.userId), limit: 1 },
      });


      const photos = response.data.result.photos;


      if(photos && photos.length>0)
      {
        console.log("-- im freaking here -------")
        const fileId = photos[0][0].file_id;

      const fileResponse = await axios.get(`${this.apiUrl}/getFile`, {
        params: { file_id: fileId },
      });

      const filePath = fileResponse.data.result.file_path;

      image = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
      }



    if (!fs.existsSync(this.imageFolder)) {
      fs.mkdirSync(this.imageFolder, { recursive: true });
    }


      if(photos && photos.length>0)
      {
        const response = await axios({
          url: image,
          method: 'GET',
          responseType: 'stream',
        });

        const extension = path.extname(image) || '.jpg'; // Default to .jpg if no extension
        const filename = `${crypto.randomUUID()}${extension}`;
        const filePath = path.join(this.imageFolder, filename);


        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        downloadedImage = `/static/images/${filename}`;
      }
    } catch (error) {
      console.log(error);
      // throw new HttpException(
      //   `${ExceptionMessageEnum.FAILED_TO_DOWNLOAD_IMAGE} ${error.message}`,
      //   HttpStatus.INTERNAL_SERVER_ERROR,
      // );
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
      userHasInvitedLink:createUserDto.invitedBy?true:false,
      isVip: false,
      referralRewardsCount: 0,
      levelUpRewardsCount: 0,
      boughtTgmCount: 0,
      roles: createUserDto.roles,
      hourlyRewardTime,
      invitedUserBuyTgmCommission: 0,
      packageIds: [],
      redEnvelopeCount: 0,
      isBanned: false,
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
      isVip: false,
      referralRewardsCount: 0,
      levelUpRewardsCount: 0,
      boughtTgmCount: 0,
      roles: createUserDto.roles,
      hourlyRewardTime,
      invitedUserBuyTgmCommission: 0,
      packageIds: [],
      redEnvelopeCount: 0,
      isBanned: false,
      userHasInvitedLink:createUserDto.invitedBy?true:false,
    };
   } catch (error) {
    console.log("------- catch ------")
    console.log(error)
   }
  }

  async buyTgm(buyTgmDto: BuyTgmDto) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData: buyTgmDto.initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (
      buyTgmDto.type &&
      buyTgmDto.type !== 1 &&
      buyTgmDto.type !== 2 &&
      buyTgmDto.type !== 3 &&
      buyTgmDto.type !== 4 &&
      buyTgmDto.type !== 5
    ) {
      throw new HttpException(ExceptionMessageEnum.PACKAGE_ID_IS_WRONG, HttpStatus.FORBIDDEN);
    }
    if (buyTgmDto.type && userFindOne.packageIds.includes(buyTgmDto.type)) {
      throw new HttpException(
        ExceptionMessageEnum.THE_PACKAGE_ID_HAS_BEEN_BOUGHT_PREVIOUSLY,
        HttpStatus.FORBIDDEN,
      );
    }

    let packageReward = 0;
    if (buyTgmDto.type) {
      if (buyTgmDto.type === 1) {
        packageReward = 10000;
      } else if (buyTgmDto.type === 2) {
        packageReward = 1000000;
      } else if (buyTgmDto.type === 3) {
        packageReward = 100000;
      } else if (buyTgmDto.type === 4) {
        packageReward = 1000000;
        userFindOne.isVip = true;
      } else if (buyTgmDto.type === 5) {
        packageReward = 12000000;
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


    const purchasedInstance= this.purchasedTgmRepo.create({
      amount:buyTgmDto.type?String(packageReward):String(buyTgmDto.amount),
      type:buyTgmDto.type?buyTgmDto.type:0,
      user:userFindOne
    })

    await this.purchasedTgmRepo.save(purchasedInstance)

    return await this.userRepo.save(userFindOne);
  }

  async createRedEnvelope(createRedEnvelopeDto: CreateRedEnvelopeDto) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        referralCode: createRedEnvelopeDto.referralCode,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    userFindOne.redEnvelopeCount += createRedEnvelopeDto.amount;
    await this.userRepo.save(userFindOne);

    return true
  }

  async newCreateRedEnvelope(createRedEnvelopeDto: NewCreateRedEnvelopeDto) {
    const fromUser=await this.userRepo.findOne({
      where:{initData:createRedEnvelopeDto.initData}
    })

    const toUser = await this.userRepo.findOne({
      where: {
        referralCode: createRedEnvelopeDto.referralCode,
      },
    });

    if (!fromUser || !toUser)
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

      if(fromUser.roles.includes(UserRoles.OWNER))
      {
        toUser.redEnvelopeCount += createRedEnvelopeDto.amount;
        return await this.userRepo.save(toUser)
      }

      if(fromUser.tgmCount<createRedEnvelopeDto.amount)
      throw new BadRequestException(ExceptionMessageEnum.TGM_COUNT_NOT_ENOOUGH_FOR_RED_ENVELOPE)

      fromUser.tgmCount-=createRedEnvelopeDto.amount
      toUser.redEnvelopeCount += createRedEnvelopeDto.amount;

    await this.userRepo.save([fromUser,toUser]);

    return true
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
    console.log("----- init data -------")
    console.log(initData)
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });

    console.log("--------- finding user --------")
    console.log(userFindOne)

    let whoInvitedUser = null;


    if (userFindOne) {
      if (userFindOne.invitedBy) {
        whoInvitedUser = await this.userRepo.findOne({
          where: {
            referralCode: userFindOne.invitedBy,
          },
        });
      }
      const usersFindAll = await this.userRepo.find({
        order: {
          tgmCount: 'DESC',
        },
      });
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
      userFindOne['rank'] =
        usersFindAll.findIndex((x) => x.initData == userFindOne.initData) + 1;
      const { secretCode, ...restProps } = userFindOne;
      const rowsCount = usersFindAll.length

      return {
        ...restProps,
        allEstimatedTgmPrices: Decimal.div(
          allEstimatedTgmPrices,
          rowsCount,
        ).toFixed(8),
        // allEstimatedTgmPrices: '0.0004',
        whoInvitedUser: {
          walletAddress: whoInvitedUser && whoInvitedUser.walletAddress,
          isVip: whoInvitedUser && whoInvitedUser.isVip,
        },
      };
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twentyFourHoursAgoString = twentyFourHoursAgo.toISOString();
    const todayUsers = await this.userRepo.find({
      where: {
        lastOnline: MoreThanOrEqual(twentyFourHoursAgoString),
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
    try {
      const fibonacciNumbers = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    const referralCodeUserFindOne = await this.userRepo.findOne({
      where: {
        referralCode,
      },
    });
    if (!referralCodeUserFindOne) {
      throw new HttpException(ExceptionMessageEnum.REFERRAL_CODE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const initDataUserFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!initDataUserFindOne) {
      throw new HttpException(ExceptionMessageEnum.INIT_DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if(initDataUserFindOne.initData == referralCodeUserFindOne.initData)
    throw new BadRequestException(ExceptionMessageEnum.CANT_REFERRAL_YOUR_SELF)

    if(!initDataUserFindOne.userHasInvitedLink)
    throw new BadRequestException(ExceptionMessageEnum.YOU_REGESTERED_WITHOUT_INVITED_LINK)

    if (
      initDataUserFindOne.invitedBy &&
      initDataUserFindOne.invitedBy.length > 0
    ) {
      throw new HttpException(
        ExceptionMessageEnum.USER_HAS_BEEN_INVITED_PREVIOUSLY,
        HttpStatus.NOT_FOUND,
      );
    }

    if (fibonacciNumbers.includes(referralCodeUserFindOne.referralCount + 1)) {
      referralCodeUserFindOne.completedTasks.push(
        `${TaskEnum.REFERRAL}${referralCodeUserFindOne.referralCount + 1}`,
      );
    }
    if (
      referralCodeUserFindOne.level !==
      fibonacciPosition(referralCodeUserFindOne.referralCount + 1)
    ) {
      referralCodeUserFindOne.levelUpRewardsCount += 1000;
    }
    referralCodeUserFindOne.level = fibonacciPosition(
      referralCodeUserFindOne.referralCount + 1,
    );
    referralCodeUserFindOne.referralCount += 1;

    if (referralCodeUserFindOne.isVip) {
      referralCodeUserFindOne.referralRewardsCount += 2000;
    } else {
      referralCodeUserFindOne.referralRewardsCount += 1000;
    }
    initDataUserFindOne.invitedBy = referralCode;

    await this.userRepo.save(referralCodeUserFindOne);
    await this.userRepo.save(initDataUserFindOne);

    const { secretCode, ...restProps } = initDataUserFindOne;
    return restProps;
    } catch (error) {
      console.log(error)
    }
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
          ExceptionMessageEnum.NO_REFERRAL_REWARD_REMAINED,
          HttpStatus.NOT_FOUND,
        );
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  async claimAllRewards(initData:string):Promise<UserEntity>
  {
    const findInitDatUser=await this.userRepo.findOne({
      where:{initData}
    })

    if(findInitDatUser.levelUpRewardsCount && findInitDatUser.levelUpRewardsCount>0)
    {
      findInitDatUser.tgmCount+=findInitDatUser.levelUpRewardsCount
      findInitDatUser.levelUpRewardsCount=0
    }

    if(findInitDatUser.referralRewardsCount && findInitDatUser.referralRewardsCount>0)
    {
      findInitDatUser.tgmCount+=findInitDatUser.referralRewardsCount
      findInitDatUser.referralRewardsCount=0
    }

    const invitedUsers=await this.userRepo.find({
      where:{
        invitedBy:findInitDatUser.referralCode,
        invitedUserBuyTgmCommission:MoreThan(0)
      }
    })

    for (let index = 0; index < invitedUsers.length; index++) {
      const invitedUser = invitedUsers[index];
      findInitDatUser.tgmCount+=invitedUser.invitedUserBuyTgmCommission
      invitedUser.invitedUserBuyTgmCommission=0
      await this.userRepo.save(invitedUser)
    }

    return await this.userRepo.save(findInitDatUser)
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
          ExceptionMessageEnum.NO_LEVEL__UP_REWARDS_REMAINED,
          HttpStatus.NOT_FOUND,
        );
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  async updateClaimAll(initData: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (
      userFindOne.referralRewardsCount > 0 ||
      userFindOne.levelUpRewardsCount > 0
    ) {
      userFindOne.tgmCount += userFindOne.referralRewardsCount;
      userFindOne.tgmCount += userFindOne.levelUpRewardsCount;
      userFindOne.referralRewardsCount = 0;
      userFindOne.levelUpRewardsCount = 0;
      await this.userRepo.save(userFindOne);
      const { secretCode, ...restProps } = userFindOne;
      return restProps;
    } else {
      throw new HttpException(ExceptionMessageEnum.NO_REWARD_REMAINED, HttpStatus.FORBIDDEN);
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
          ExceptionMessageEnum.TASK_HAS_BEEN_CLAIMED_BEFORE,
          HttpStatus.NOT_FOUND,
        );
      } else if (userFindOne.completedTasks.includes(taskName)) {
        userFindOne.tgmCount += Number(taskReward);
        userFindOne.claimedRewards.push(taskName);
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  async updateEstimatedTgmPrice(initData: string, estimatedPrice: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      if (userFindOne.completedTasks.includes(TaskEnum.TGM_PRICE_ESTIMATION)) {
        throw new HttpException(
          ExceptionMessageEnum.THE_TASK_HAS_BEEN_COMPLETE_BEFORE,
          HttpStatus.NOT_FOUND,
        );
      } else {
        userFindOne.estimatedTgmPrice = estimatedPrice;
        userFindOne.completedTasks.push(TaskEnum.TGM_PRICE_ESTIMATION);
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  async updateCompleteTask(initData: string, taskName: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      if (userFindOne.completedTasks.includes(taskName)) {
        throw new HttpException(
          ExceptionMessageEnum.THE_TASK_HAS_BEEN_COMPLETE_BEFORE,
          HttpStatus.NOT_FOUND,
        );
      } else {
        userFindOne.completedTasks.push(taskName);
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
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
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (type === 'EQUAL') {
      userFindOne.tgmCount = tgmCount;
    } else if (type === 'ADD') {
      userFindOne.tgmCount += tgmCount;
    } else if (type === 'SUBTRACT') {
      userFindOne.tgmCount -= tgmCount;
    }


    if(userFindOne.tgmCount<0)
    throw new BadRequestException(ExceptionMessageEnum.TGM_IS_NOT_ENOUGH)

    await this.userRepo.save(userFindOne);
  }

  async updateUserWalletAddress(initData: string, walletAddress: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    userFindOne.walletAddress = walletAddress;
    await this.userRepo.save(userFindOne);

    const { secretCode, ...restProps } = userFindOne;
    return restProps;
  }

  async updateUserRoles(updateUserRolesDto: UpdateUserRolesDto) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        referralCode: updateUserRolesDto.userId,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
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
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (!invitedUserFindOne.invitedBy) {
      throw new HttpException(
        ExceptionMessageEnum.USER_HAS_NOT_BEEN_INVITED_BY_ANYONE,
        HttpStatus.FORBIDDEN,
      );
    }
    if (invitedUserFindOne.invitedUserBuyTgmCommission === 0) {
      throw new HttpException(ExceptionMessageEnum.NO_COMMISSION_REMAINED, HttpStatus.FORBIDDEN);
    }

    const initDataUserFindOne = await this.userRepo.findOne({
      where: {
        referralCode: invitedUserFindOne.invitedBy,
      },
    });
    if (!initDataUserFindOne) {
      throw new HttpException(ExceptionMessageEnum.INIT_DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    initDataUserFindOne.tgmCount +=
      invitedUserFindOne.invitedUserBuyTgmCommission;
    invitedUserFindOne.invitedUserBuyTgmCommission = 0;

    await this.userRepo.save(invitedUserFindOne);
    await this.userRepo.save(initDataUserFindOne);
  }

  async updateUserHourlyReward(initData: string) {
    try {
      const hourlyRewardTime = Date.now() + 3600000;
    const hourlyRewardCount = 100;

    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (Date.now() > userFindOne.hourlyRewardTime) {
      userFindOne.hourlyRewardTime = hourlyRewardTime;
      await this.userRepo.save(userFindOne);
      return await this.updateUserTgmCount(initData, hourlyRewardCount, 'ADD');
    } else {
      throw new HttpException(ExceptionMessageEnum.TIME_HAS_NOT_BEEN_PASSED, HttpStatus.FORBIDDEN);
    }
    } catch (error) {
     console.log(error)
    }
  }

  async updateClaimUserRedEnvelope(initData: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    userFindOne.tgmCount += userFindOne.redEnvelopeCount;
    userFindOne.redEnvelopeCount = 0;

    await this.userRepo.save(userFindOne);
  }

  async updateIsBannedUser(referralCode: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        referralCode,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    userFindOne.isBanned = !userFindOne.isBanned;
    await this.userRepo.save(userFindOne);
    const { secretCode, ...restProps } = userFindOne;
    return restProps;
  }

  async deleteUser(initData: string) {
    return await this.userRepo.delete({
      initData,
    });
  }

  public async userBannedStatus(secretCode:string):Promise<boolean>
  {
    const findedUser=await this.userRepo.findOne({
      where:{secretCode}
    })

    return findedUser.isBanned
  }

  async purchasedTgmPagination(paginationDto: PaginationDto): Promise<{ data: PurchasedTgmEntity[]; count: number; hasNextPage: boolean }> {
    const { page, limit, sortBy, sortOrder } = paginationDto;
    const [data, count] = await this.purchasedTgmRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations:{user:true},
      order: {
        [sortBy]: sortOrder, // Apply sorting
      },
    });

    // Calculate if there is a next page
    const hasNextPage = page * limit < count;

    return { data, count, hasNextPage };
  }
}
