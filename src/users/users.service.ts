import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import Decimal from 'decimal.js';
import * as fs from 'fs';
import * as path from 'path';
import { CashAvalancheEntity } from 'src/cash-avalanche/entities/cash-avalanche.entity';
import { ExceptionMessageEnum } from 'src/common/enum/exception-messages.enum';
import { TaskEnum } from 'src/common/enum/tasks.enum';
import { IUserToken } from 'src/common/interfaces/user-token.interface';
import { LongShotPacksEntity } from 'src/long-shot/entities/long-shot-packs.entity';
import { LongShotTicketEntity } from 'src/long-shot/entities/long-shot-tickets.entity';
import { TonService } from 'src/utils/ton/service/ton-service';
import { DeepPartial, FindManyOptions, In, MoreThan, Repository } from 'typeorm';
import { BuyTgmDto } from './dto/buy-tgm.dto';
import { CreateRedEnvelopeDto } from './dto/create-red-envelope.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { NewCreateRedEnvelopeDto } from './dto/new-create-red-envelope.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateMarketerDto } from './dto/update-marketer.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { ClaimedRewardLogEntity } from './entities/claimed-reward-log.entity';
import { CompleteTaskLogEntity } from './entities/complete-task-log.entity';
import { PurchasedTgmEntity } from './entities/purchased-tgm.entity';
import { RedEnvelopeLogEntity } from './entities/red-envelope-log.entity';
import { UserEntity, UserRoles } from './entities/user.entity';
import { WalletLogEntity } from './entities/wallet-log.entity';
import { AccessToken } from './interfaces/access-token.interface';
import { fibonacciPosition } from './utils/fibonacciPosition';
import { LoginUserDto } from './dto/login.dto';
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
    @InjectRepository(LongShotTicketEntity) private ticketRepo: Repository<LongShotTicketEntity>,
    @InjectRepository(LongShotPacksEntity) private packRepo: Repository<LongShotPacksEntity>,
    @InjectRepository(CashAvalancheEntity) private cashAvalancheRepo: Repository<CashAvalancheEntity>,
    private readonly tonService: TonService,
    @InjectRepository(PurchasedTgmEntity) private purchasedTgmRepo: Repository<PurchasedTgmEntity>,
    @InjectRepository(RedEnvelopeLogEntity) private redEnvelopeLogRepo: Repository<RedEnvelopeLogEntity>,
    @InjectRepository(WalletLogEntity) private walletLogRepo: Repository<WalletLogEntity>,
    @InjectRepository(CompleteTaskLogEntity) private completeTaskLogRepo: Repository<CompleteTaskLogEntity>,
    @InjectRepository(ClaimedRewardLogEntity) private claimedRewardRepo: Repository<ClaimedRewardLogEntity>,
    private readonly jwtService: JwtService

  ) { }

  async samad() {
    const users = await this.userRepo.createQueryBuilder('s')
      .where('s.invitedUserBuyTgmCommission > 0').getMany();
    console.log(users.length);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const createPurchasedDto: Partial<PurchasedTgmEntity> = {
        amount: String(user.invitedUserBuyTgmCommission),
        type: null,
        user: user,
        txId: 'txid' + ' ' + i
      };

      const inviter = await this.findInviterOrThrow(user.invitedBy);
      createPurchasedDto.inviter = inviter;

      let inviterType = UserRoles.NORMAL;

      if (!inviter.getMarketerBy && inviter.roles.find(x => x == UserRoles.HEAD_OF_MARKETING)) {

        createPurchasedDto.invitedByMarketer = false;
        createPurchasedDto.headOfInviter = inviter;
        createPurchasedDto.headOfMarketerCommission = String(user.invitedUserBuyTgmCommission);
        createPurchasedDto.inviterType = UserRoles.HEAD_OF_MARKETING;

      } else if (inviter.getMarketerBy && inviter.roles.find(x => x == UserRoles.MARKETER)) {

        const headOfMarketing = await this.userRepo.findOne({ where: { referralCode: inviter.getMarketerBy } });
        createPurchasedDto.invitedByMarketer = true;
        createPurchasedDto.headOfInviter = headOfMarketing;

        if (inviter.marketerVip) {

          createPurchasedDto.invitedByVipMarketer = true;

          createPurchasedDto.marketerCommission = String(user.invitedUserBuyTgmCommission);

        } else {

          createPurchasedDto.marketerCommission = String(user.invitedUserBuyTgmCommission);

        }

        createPurchasedDto.headOfMarketerCommission = '0';

        createPurchasedDto.inviterType = UserRoles.MARKETER;

      } else {
        if (inviter.isVip) createPurchasedDto.invitedByVip = true;
        createPurchasedDto.inviterType = inviterType;
        createPurchasedDto.inviterCommission = String(user.invitedUserBuyTgmCommission);
      }

      await this.purchasedTgmRepo.save(this.purchasedTgmRepo.create(createPurchasedDto));
      console.log('user ' + i, 'DONE');
    }
  }

  public async login(user: LoginUserDto): Promise<{token: string}> {
    const findUser = await this.userRepo.findOne({ where: { initData :user.initData  } });
    const accessTokenPayload: AccessToken = {
      id: findUser.id,
      roles: findUser.roles
    };

    const token = await this.jwtService.sign(accessTokenPayload, { expiresIn: "12h" });
    return {token};
  }

  public async findOneUser(initData: string): Promise<UserEntity> {
    return await this.userRepo.findOne({ where: { initData } });
  }

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


        if (photos && photos.length > 0) {
          console.log("-- im freaking here -------");
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


        if (photos && photos.length > 0) {
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
        lastOnline: new Date().toLocaleDateString(),
        privateCode,
        userHasInvitedLink: createUserDto.invitedBy ? true : false,
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
        userHasInvitedLink: createUserDto.invitedBy ? true : false,
      };
    } catch (error) {
      console.log("------- catch ------");
      console.log(error);
    }
  }

  async createRedEnvelope(createRedEnvelopeDto: CreateRedEnvelopeDto, user: IUserToken) {
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
    if (user) {
      await this.redEnvelopeLogRepo.save(this.redEnvelopeLogRepo.create({
        amount: String(createRedEnvelopeDto.amount),
        creator: {
          id: user.id
        },
        receiver: {
          id: userFindOne.id
        },
      }));
    }
    return true;
  }

  async newCreateRedEnvelope(createRedEnvelopeDto: NewCreateRedEnvelopeDto) {
    const fromUser = await this.userRepo.findOne({
      where: { initData: createRedEnvelopeDto.initData }
    });

    const toUser = await this.userRepo.findOne({
      where: {
        referralCode: createRedEnvelopeDto.referralCode,
      },
    });

    if (!fromUser || !toUser)
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (fromUser.roles.find(x => x == UserRoles.OWNER)) {
      toUser.redEnvelopeCount += createRedEnvelopeDto.amount;
      return await this.userRepo.save(toUser);
    }

    if (fromUser.tgmCount < createRedEnvelopeDto.amount)
      throw new BadRequestException(ExceptionMessageEnum.TGM_COUNT_NOT_ENOOUGH_FOR_RED_ENVELOPE);

    fromUser.tgmCount -= createRedEnvelopeDto.amount;
    toUser.redEnvelopeCount += createRedEnvelopeDto.amount;

    await this.userRepo.save([fromUser, toUser]);

    return true;
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
    let whoInvitedUser: UserEntity | null = null;

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
      const rowsCount = usersFindAll.length;

      const longShotGame = await this.ticketRepo.find({
        where: {
          initData,
        },
        relations: {
          pack: true
        }
      });

      const cashAvalancheGamesFind = await this.cashAvalancheRepo.find({
        where: {
          remainingTime: MoreThan(Date.now()),
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
      let isInvitedMarketer: boolean = false;
      let isInviterHeadOfMarketer = false;
      let marketerAddress: string;
      let headOfMarketerAddress: string;
      let isMarketerVip = false;
      let marketerCommission: number;

      if (whoInvitedUser && whoInvitedUser.roles.find(x => x == UserRoles.MARKETER) && whoInvitedUser.getMarketerBy) {
        isInvitedMarketer = true;
        marketerAddress = whoInvitedUser.walletAddress;
        const findHeadOfMarketer = await this.userRepo.findOne({ where: { referralCode: whoInvitedUser.getMarketerBy } });
        headOfMarketerAddress = findHeadOfMarketer.walletAddress;
        isMarketerVip = whoInvitedUser.marketerVip ? whoInvitedUser.marketerVip : false;
        marketerCommission = whoInvitedUser.marketerCommision ? whoInvitedUser.marketerCommision : 0;
      }

      if (whoInvitedUser && whoInvitedUser.roles.find(x => x == UserRoles.HEAD_OF_MARKETING) && !whoInvitedUser.getMarketerBy) {
        isInviterHeadOfMarketer = true;
        headOfMarketerAddress = whoInvitedUser.walletAddress;
      }

      if (isInviterHeadOfMarketer == false && userFindOne.getMarketerBy) {
        const findHeadOfMarketer = await this.userRepo.findOne({ where: { referralCode: userFindOne.getMarketerBy } });
        isInviterHeadOfMarketer = true;
        headOfMarketerAddress = findHeadOfMarketer.walletAddress;
      }



      const countOfReferral = await this.userRepo.count({
        where: {
          invitedBy: userFindOne.referralCode
        }
      });

      const currentDate = new Date();
      return {
        ...restProps,
        allEstimatedTgmPrices: Decimal.div(
          allEstimatedTgmPrices,
          rowsCount,
        ).toFixed(8),
        activeLongShotGame: longShotGame?.find(x => x.pack.endDate > currentDate.toISOString() && x.pack.startDate < currentDate.toISOString()),
        longShotGame,
        countOfReferral,
        activeCashAvalanche: participatedCashAvalancheGames,
        // allEstimatedTgmPrices: '0.0004',
        whoInvitedUser: {
          walletAddress: whoInvitedUser && whoInvitedUser.walletAddress,
          isVip: whoInvitedUser && whoInvitedUser.isVip,
          isInvitedMarketer,
          isInviterHeadOfMarketer,
          marketerAddress,
          headOfMarketerAddress,
          isMarketerVip,
          marketerCommission
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
    for (let i = 0; i < allInvitedByUser.length; i++) {
      const invitedUser = allInvitedByUser[i];
      const havePurchase = await this.purchasedTgmRepo.createQueryBuilder('a')
        .where('a."inviterClaimedCommission" = false AND a."inviterCommission"::int > 0 AND a."userId" = :userId', { userId: invitedUser.id })
        .getMany();
      if (havePurchase && havePurchase.length > 0) {
        invitedUser["inviterClaimCount"] =
          havePurchase.reduce((accumulator, currentValue) => accumulator + Number(currentValue.inviterCommission), 0);
        invitedUser["canInviterClaim"] = true;
      } else {
        invitedUser["canInviterClaim"] = false;
      }
    }
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

  //   async findAllUsersCount() {
  //     const findAllUsers = await this.userRepo.find();

  //     let tgmCount = 0;
  //     findAllUsers.forEach((i) => {
  //       tgmCount += i.tgmCount;
  //     });
  //     // const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  //     // const twentyFourHoursAgoString = twentyFourHoursAgo.toISOString();
  //     const startOfToday = new Date();
  // startOfToday.setHours(0, 0, 0, 0); // Set to the start of the day (midnight)
  // const startOfTodayString = startOfToday.toISOString(); // Convert to ISO string
  //     const todayUsers = await this.userRepo.find({
  //       where: {
  //         lastOnline: MoreThanOrEqual(startOfTodayString),
  //       },
  //     });

  //     return {
  //       allUsers: await this.userRepo.count(),
  //       todayUsers: todayUsers.length,
  //       tapCount: 0,
  //       tgmCount,
  //     };
  //   }

  async findAllUsersCount() {
    // Get all users
    const findAllUsers = await this.userRepo.find();

    // Calculate total tgmCount
    let tgmCount = 0;
    findAllUsers.forEach((i) => {
      tgmCount += i.tgmCount;
    });

    // Get the current time
    // const now = new Date();

    // // Calculate the timestamp for 24 hours ago
    // const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    // // Convert to ISO string
    // const twentyFourHoursAgoString = twentyFourHoursAgo.toISOString();

    // // Find users who were online in the last 24 hours
    // const todayUsers = await this.userRepo.find({
    //   where: {
    //     lastOnline: MoreThanOrEqual(twentyFourHoursAgoString),
    //   },
    // });

    const todayUsers = await this.userRepo.query(`SELECT *
      FROM users u
      WHERE u."lastOnline"::timestamp >= NOW() - INTERVAL '24 hours';`);


    return {
      allUsers: await this.userRepo.count(), // Total number of users
      todayUsers: todayUsers.length, // Number of users online today
      tapCount: 0, // Placeholder for tapCount
      tgmCount, // Total tgmCount
    };
  }

  async addTask(initData: string, taskName: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      if (userFindOne.completedTasks.includes(taskName)) {
        return true;
      } else {
        userFindOne.completedTasks.push(taskName);
        await this.userRepo.save(userFindOne);
        await this.completeTaskLogRepo.save(this.completeTaskLogRepo.create({
          taskName,
          user: {
            id: userFindOne.id
          }
        }));
        return true;
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
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

      if (initDataUserFindOne.initData == referralCodeUserFindOne.initData)
        throw new BadRequestException(ExceptionMessageEnum.CANT_REFERRAL_YOUR_SELF);

      if (!initDataUserFindOne.userHasInvitedLink)
        throw new BadRequestException(ExceptionMessageEnum.YOU_REGESTERED_WITHOUT_INVITED_LINK);

      if (
        initDataUserFindOne.invitedBy &&
        initDataUserFindOne.invitedBy.length > 0
      ) {
        throw new HttpException(
          ExceptionMessageEnum.USER_HAS_BEEN_INVITED_PREVIOUSLY,
          HttpStatus.NOT_FOUND,
        );
      }

      let taskLog;
      if (fibonacciNumbers.includes(referralCodeUserFindOne.referralCount + 1)) {
        referralCodeUserFindOne.completedTasks.push(
          `${TaskEnum.REFERRAL}${referralCodeUserFindOne.referralCount + 1}`,
        );
        taskLog = `${TaskEnum.REFERRAL}${referralCodeUserFindOne.referralCount + 1}`;
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
      if (taskLog && taskLog !== "") {
        await this.completeTaskLogRepo.save(this.completeTaskLogRepo.create({
          taskName: taskLog,
          user: {
            id: referralCodeUserFindOne.id
          }
        }));
      }

      const { secretCode, ...restProps } = initDataUserFindOne;
      return restProps;
    } catch (error) {
      console.log(error);
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

  async claimAllRewards(initData: string): Promise<UserEntity> {
    const findInitDatUser = await this.userRepo.findOne({
      where: { initData }
    });

    let createClaimedRewardLog: DeepPartial<ClaimedRewardLogEntity>[] = [];

    if (findInitDatUser.levelUpRewardsCount && findInitDatUser.levelUpRewardsCount > 0) {
      findInitDatUser.tgmCount += findInitDatUser.levelUpRewardsCount;
      findInitDatUser.levelUpRewardsCount = 0;
    }

    if (findInitDatUser.referralRewardsCount && findInitDatUser.referralRewardsCount > 0) {
      findInitDatUser.tgmCount += findInitDatUser.referralRewardsCount;
      findInitDatUser.referralRewardsCount = 0;
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.CONNNECT_WALLET)
      && !findInitDatUser.claimedRewards.includes(TaskEnum.CONNNECT_WALLET)
    ) {
      const reward = 2000;
      findInitDatUser.tgmCount += reward;
      findInitDatUser.claimedRewards.push(TaskEnum.CONNNECT_WALLET);
      createClaimedRewardLog.push({
        amount: String(reward),
        taskName: TaskEnum.CONNNECT_WALLET,
        user: {
          id: findInitDatUser.id
        }
      });
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.FIRST_CASH_AVALANCHE)
      && !findInitDatUser.claimedRewards.includes(TaskEnum.FIRST_CASH_AVALANCHE)
    ) {
      const reward = 2000;
      findInitDatUser.tgmCount += reward;
      findInitDatUser.claimedRewards.push(TaskEnum.FIRST_CASH_AVALANCHE);
      createClaimedRewardLog.push({
        amount: String(reward),
        taskName: TaskEnum.FIRST_CASH_AVALANCHE,
        user: {
          id: findInitDatUser.id
        }
      });
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.FIRST_LONG_SHOT)
      && !findInitDatUser.claimedRewards.includes(TaskEnum.FIRST_LONG_SHOT)
    ) {
      const reward = 2000;
      findInitDatUser.tgmCount += reward;
      findInitDatUser.claimedRewards.push(TaskEnum.FIRST_LONG_SHOT);
      createClaimedRewardLog.push({
        amount: String(reward),
        taskName: TaskEnum.FIRST_LONG_SHOT,
        user: {
          id: findInitDatUser.id
        }
      });
    }

    /*
    if (findInitDatUser.roles.find(x => x == UserRoles.MARKETER)) {
      const invitedUsers = await this.userRepo.find({
        where: {
          invitedBy: findInitDatUser.referralCode,
        },
        relations: { purchasedTgms: true }
      });

      let finalNotClaimedPurchasedTgm: PurchasedTgmEntity[] = [];
      for (let index = 0; index < invitedUsers.length; index++) {
        const invitedUser = invitedUsers[index];
        const finalPurchasedTgms = invitedUser.purchasedTgms.filter(x => x.marketerClaimedCommission == false);
        for (let index = 0; index < finalPurchasedTgms.length; index++) {
          const notClaimedPurchasedTgm = finalPurchasedTgms[index];
          findInitDatUser.tgmCount = findInitDatUser.tgmCount + Number(notClaimedPurchasedTgm.marketerCommission);
          notClaimedPurchasedTgm.marketerClaimedCommission = true;
          finalNotClaimedPurchasedTgm.push(notClaimedPurchasedTgm);
        }
      }
      console.log("--------- changed purchases --------");
      console.log(finalNotClaimedPurchasedTgm.length);

      console.log("------- user tgm count ----------");
      console.log(findInitDatUser.tgmCount);
      await this.purchasedTgmRepo.save(finalNotClaimedPurchasedTgm);
      return await this.userRepo.save(findInitDatUser);
    } else {
      const invitedUsers = await this.userRepo.find({
        where: {
          invitedBy: findInitDatUser.referralCode,
          invitedUserBuyTgmCommission: MoreThan(0)
        }
      });
      for (let index = 0; index < invitedUsers.length; index++) {
        const invitedUser = invitedUsers[index];
        findInitDatUser.tgmCount += invitedUser.invitedUserBuyTgmCommission;
        invitedUser.invitedUserBuyTgmCommission = 0;
        await this.userRepo.save(invitedUser);
      }

      // return await this.userRepo.save(findInitDatUser);
    }
      */

    let updatedUser: UserEntity;

    if (findInitDatUser.roles.find(x => x == UserRoles.MARKETER)) {
      const invitedUsers = await this.userRepo.find({
        where: {
          invitedBy: findInitDatUser.referralCode,
        },
        relations: { purchasedTgms: true }
      });

      let finalNotClaimedPurchasedTgm: PurchasedTgmEntity[] = [];
      for (let index = 0; index < invitedUsers.length; index++) {
        const invitedUser = invitedUsers[index];
        let finalPurchasedTgms = invitedUser.purchasedTgms.filter(x => x.marketerCommission !== null);
        finalPurchasedTgms = finalPurchasedTgms.filter(x => x.marketerClaimedCommission == false);

        for (let index = 0; index < finalPurchasedTgms.length; index++) {
          const notClaimedPurchasedTgm = finalPurchasedTgms[index];
          findInitDatUser.tgmCount = findInitDatUser.tgmCount + Number(notClaimedPurchasedTgm.marketerCommission);
          notClaimedPurchasedTgm.marketerClaimedCommission = true;
          finalNotClaimedPurchasedTgm.push(notClaimedPurchasedTgm);
        }
      }
      await this.purchasedTgmRepo.save(finalNotClaimedPurchasedTgm);
      updatedUser = await this.userRepo.save(findInitDatUser);
    }

    if (findInitDatUser.roles.find(x => x == UserRoles.NORMAL)) {
      const invitedUsers = await this.userRepo.find({
        where: {
          invitedBy: findInitDatUser.referralCode,
        },
        relations: { purchasedTgms: true }
      });

      let finalNotClaimedPurchasedTgm: PurchasedTgmEntity[] = [];
      for (let index = 0; index < invitedUsers.length; index++) {
        const invitedUser = invitedUsers[index];
        let finalPurchasedTgms = invitedUser.purchasedTgms.filter(x => x.inviterCommission !== null);
        finalPurchasedTgms = finalPurchasedTgms.filter(x => x.inviterClaimedCommission == false);

        for (let index = 0; index < finalPurchasedTgms.length; index++) {
          const notClaimedPurchasedTgm = finalPurchasedTgms[index];
          findInitDatUser.tgmCount = findInitDatUser.tgmCount + Number(notClaimedPurchasedTgm.inviterCommission);
          notClaimedPurchasedTgm.inviterClaimedCommission = true;
          finalNotClaimedPurchasedTgm.push(notClaimedPurchasedTgm);
        }
      }

      await this.purchasedTgmRepo.save(finalNotClaimedPurchasedTgm);
      updatedUser = await this.userRepo.save(findInitDatUser);
    }

    return updatedUser;
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

  async updateTaskRewardByTask(
    initData: string,
    taskName: string
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
        let createClaimedRewardLog: DeepPartial<ClaimedRewardLogEntity>[] = [];

        switch (taskName) {
          case TaskEnum.CONNNECT_WALLET:
            userFindOne.tgmCount += Number(2000);
            createClaimedRewardLog.push({
              amount: String(2000),
              user: {
                id: userFindOne.id
              },
              taskName: TaskEnum.CONNNECT_WALLET
            });
            break;
          case TaskEnum.FIRST_CASH_AVALANCHE:
            userFindOne.tgmCount += Number(2000);

            createClaimedRewardLog.push({
              amount: String(2000),
              user: {
                id: userFindOne.id
              },
              taskName: TaskEnum.FIRST_CASH_AVALANCHE
            });
            break;
          case TaskEnum.FIRST_LONG_SHOT:
            userFindOne.tgmCount += Number(2000);

            createClaimedRewardLog.push({
              amount: String(2000),
              user: {
                id: userFindOne.id
              },
              taskName: TaskEnum.FIRST_LONG_SHOT
            });
            break;
          default:
            break;
        }

        userFindOne.claimedRewards.push(taskName);

        await this.claimedRewardRepo.save(this.claimedRewardRepo.create(createClaimedRewardLog));

        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      }
    } else {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
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
        await this.claimedRewardRepo.save(this.claimedRewardRepo.create({
          amount: taskReward,
          taskName: taskName,
          user: {
            id: userFindOne.id
          }
        }));
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
        await this.completeTaskLogRepo.save(this.completeTaskLogRepo.create({
          taskName: TaskEnum.TGM_PRICE_ESTIMATION,
          user: {
            id: userFindOne.id
          }
        }));
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

        await this.completeTaskLogRepo.save(this.completeTaskLogRepo.create({
          taskName,
          user: {
            id: userFindOne.id
          }
        }));

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


    if (userFindOne.tgmCount < 0)
      throw new BadRequestException(ExceptionMessageEnum.TGM_IS_NOT_ENOUGH);
    await this.userRepo.save(userFindOne);
  }

  async updateUserWalletAddress(initData: string, walletAddress: string) {
    await this.addTask(initData, TaskEnum.CONNNECT_WALLET);
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    userFindOne.walletAddress = walletAddress;
    await this.userRepo.save(userFindOne);
    await this.walletLogRepo.save(this.walletLogRepo.create({
      user: {
        id: userFindOne.id
      },
      walletAddress: walletAddress
    }));
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
    // if (invitedUserFindOne.invitedUserBuyTgmCommission === 0) {
    //   throw new HttpException(ExceptionMessageEnum.NO_COMMISSION_REMAINED, HttpStatus.FORBIDDEN);
    // }

    const havePurchase = await this.purchasedTgmRepo.createQueryBuilder('a')
      .where('a."inviterClaimedCommission" = false AND a."inviterCommission"::int > 0 AND a."userId" = :userId', { userId: invitedUserId })
      .getMany();

    const initDataUserFindOne = await this.userRepo.findOne({
      where: {
        referralCode: invitedUserFindOne.invitedBy,
      },
    });
    if (!initDataUserFindOne) {
      throw new HttpException(ExceptionMessageEnum.INIT_DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (havePurchase && havePurchase.length > 0) {
      initDataUserFindOne.tgmCount +=
        havePurchase.reduce((accumulator, currentValue) => accumulator + Number(currentValue.inviterCommission), 0);
      for (let i = 0; i < havePurchase.length; i++) {
        const purchase = havePurchase[i];
        await this.purchasedTgmRepo.update(purchase.id, {
          inviterClaimedCommission: true
        });
      }
    }
    // initDataUserFindOne.tgmCount +=
    //   invitedUserFindOne.invitedUserBuyTgmCommission;
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
      console.log(error);
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
    await this.redEnvelopeLogRepo.update(
      { receiver: { id: userFindOne.id } }, // Where clause
      { claimDate: () => 'NOW()' } // Set claimDate to the current timestamp
    );
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

  public async userBannedStatus(secretCode: string): Promise<boolean> {
    const findedUser = await this.userRepo.findOne({
      where: { secretCode }
    });

    return findedUser.isBanned;
  }

  async purchasedTgmPagination(paginationDto: PaginationDto<{ type: number; }>): Promise<{ data: PurchasedTgmEntity[]; count: number; hasNextPage: boolean; }> {
    const { page, limit, sortBy, sortOrder } = paginationDto;
    const queryObject: FindManyOptions<PurchasedTgmEntity> = {
      skip: (page - 1) * limit,
      take: limit,
      relations: { user: true },
      order: {
        [sortBy]: sortOrder, // Apply sorting
      },

    };

    if (paginationDto.filter) {
      if (paginationDto.filter.type || paginationDto.filter.type == 0) {
        Object.assign(queryObject, {
          where: {
            type: paginationDto.filter.type
          }
        });
      }
    }

    const [data, count] = await this.purchasedTgmRepo.findAndCount(queryObject);

    // Calculate if there is a next page
    const hasNextPage = page * limit < count;

    return { data, count, hasNextPage };
  }
  /*
    async headMarketers(
      paginationDto: PaginationDto<{ initData: string }>,
    ): Promise<{ data: UserEntity[]; count: number; hasNextPage: boolean }> {
      const { page, limit, sortBy, sortOrder } = paginationDto;

      // Find head marketer and validate
      const findHead = await this.userRepo.findOne({
        where: { initData: paginationDto.filter.initData },
      });
      if (!findHead || !findHead.roles.find(x=>x==UserRoles.HEAD_OF_MARKETING)) {
        throw new ForbiddenException();
      }

      // Build pagination query
      const queryOptions: FindManyOptions<UserEntity> = {
        where: {
          getMarketerBy: findHead.referralCode,
          roles: In([UserRoles.MARKETER]),
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { [sortBy]: sortOrder },
      };

      // Get paginated marketers and total count
      const [data, count] = await this.userRepo.findAndCount(queryOptions);
      const hasNextPage = page * limit < count;

      // Efficiently fetch purchases for all marketers in the current page
      if (data.length > 0) {
        const referralCodes = data.map((marketer) => marketer.referralCode);
        const purchasedTgms = await this.purchasedTgmRepo.find({
          where: { user: { invitedBy: In(referralCodes) } },
          relations: ['user'],
        });

        // Group purchases by referral code
        const purchasesMap = new Map<string, PurchasedTgmEntity[]>();
        purchasedTgms.forEach((tgm) => {
          const key = tgm.user.invitedBy;
          purchasesMap.set(key, [...(purchasesMap.get(key) || []), tgm]);
        });

        // Assign purchases to each marketer
        data.forEach((marketer) => {
          marketer["purchases"] = purchasesMap.get(marketer.referralCode) || [];
        });
      }

      return { data, count, hasNextPage };
    }
    */

  async ownerHeadMarketers(
    paginationDto: PaginationDto<{}>, // No filter needed since we're fetching all head marketers
  ): Promise<{ data: UserEntity[]; count: number; hasNextPage: boolean; }> {
    const { page, limit, sortBy, sortOrder } = paginationDto;

    // Find all head marketers
    const headMarketers = await this.userRepo.find({
      where: { roles: In([UserRoles.HEAD_OF_MARKETING]) },
    });

    console.log(headMarketers);

    // If no head marketers found, return empty response
    if (headMarketers.length === 0) {
      return { data: [], count: 0, hasNextPage: false };
    }

    // Collect all head marketers' referral codes
    const headReferralCodes = headMarketers.map(head => head.referralCode);

    // Build pagination query to get marketers for all head marketers
    const queryOptions: FindManyOptions<UserEntity> = {
      where: {
        getMarketerBy: In(headReferralCodes),
        roles: In([UserRoles.MARKETER]),
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
    };

    // Get paginated marketers and total count
    const [data, count] = await this.userRepo.findAndCount(queryOptions);
    const hasNextPage = page * limit < count;
    console.log(data);

    // Efficiently fetch purchases for all marketers in the current page
    if (data.length > 0) {
      const referralCodes = data.map(marketer => marketer.referralCode);
      const purchasedTgms = await this.purchasedTgmRepo.find({
        where: { user: { invitedBy: In(referralCodes) } },
        relations: ['user'],
      });

      // Group purchases by referral code
      const purchasesMap = new Map<string, PurchasedTgmEntity[]>();
      purchasedTgms.forEach(tgm => {
        const key = tgm.user.invitedBy;
        purchasesMap.set(key, [...(purchasesMap.get(key) || []), tgm]);
      });

      // Assign purchases and calculate total inviterCommission for each marketer
      data.forEach(marketer => {
        const marketerPurchases = purchasesMap.get(marketer.referralCode) || [];
        marketer["purchases"] = marketerPurchases;
        marketer["purchaseCommissionCount"] = marketerPurchases.reduce(
          (total, purchase) => total + (Number(purchase.inviterCommission) || 0),
          0,
        );
      });
    }

    return { data, count, hasNextPage };
  }

  public async newOwnerHeadMarketers(
    paginationDto: PaginationDto<{}>, // No filter needed since we're fetching all head marketers
  ): Promise<{ data: UserEntity[]; count: number; hasNextPage: boolean; }> {
    const { page, limit, sortBy, sortOrder } = paginationDto;

    // Find all head marketers
    const headMarketers = await this.userRepo
      .createQueryBuilder("user")
      .where(`:role = ANY (string_to_array(user.roles, ','))`, { role: UserRoles.HEAD_OF_MARKETING.toString() }) // Convert roles to array and check if it includes the role
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`user.${sortBy}`, sortOrder)
      .getMany();

    // If no head marketers found, return empty response
    if (headMarketers.length === 0) {
      return { data: [], count: 0, hasNextPage: false };
    }

    // Get the total count of head marketers
    const totalCount = await this.userRepo
      .createQueryBuilder("user")
      .where(`:role = ANY (string_to_array(user.roles, ','))`, { role: UserRoles.HEAD_OF_MARKETING.toString() }) // Convert roles to array and check if it includes the role
      .getCount();

    const hasNextPage = page * limit < totalCount;

    // Fetch purchases for each head marketer
    for (let index = 0; index < headMarketers.length; index++) {
      const headMarketer = headMarketers[index];
      const purchases = await this.purchasedTgmRepo.createQueryBuilder("pt")
        .where(`pt."headOfInviter"->>'id' = :headId`, { headId: headMarketer.id }) // Access JSONB property correctly
        .getMany();

      headMarketer["purchases"] = purchases;
    }

    return { data: headMarketers, count: totalCount, hasNextPage };
  }

  async headMarketers(
    paginationDto: PaginationDto<{ initData: string; }>,
  ): Promise<{ data: UserEntity[]; count: number; hasNextPage: boolean; claim: boolean; }> {
    const { page, limit, sortBy, sortOrder } = paginationDto;

    // Find head marketer and validate
    const findHead = await this.userRepo.findOne({
      where: { initData: paginationDto.filter.initData },
    });
    if (!findHead || !findHead.roles.find((x) => x == UserRoles.HEAD_OF_MARKETING)) {
      throw new ForbiddenException();
    }

    // Build pagination query
    const queryOptions: FindManyOptions<UserEntity> = {
      where: {
        getMarketerBy: findHead.referralCode,
        roles: In([UserRoles.MARKETER]),
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
    };

    // Get paginated marketers and total count
    const [data, count] = await this.userRepo.findAndCount(queryOptions);
    const hasNextPage = page * limit < count;

    // Efficiently fetch purchases for all marketers in the current page
    if (data.length > 0) {
      const referralCodes = data.map((marketer) => marketer.referralCode);
      const purchasedTgms = await this.purchasedTgmRepo.find({
        where: { user: { invitedBy: In(referralCodes) } },
        relations: ['user'],
      });

      // Group purchases by referral code
      const purchasesMap = new Map<string, PurchasedTgmEntity[]>();
      purchasedTgms.forEach((tgm) => {
        const key = tgm.user.invitedBy;
        purchasesMap.set(key, [...(purchasesMap.get(key) || []), tgm]);
      });

      // Assign purchases and calculate total inviterCommission for each marketer
      data.forEach((marketer) => {
        const marketerPurchases = purchasesMap.get(marketer.referralCode) || [];
        marketer["purchases"] = marketerPurchases;

        // Calculate total inviterCommission
        const purchaseCommissionCount = marketerPurchases.reduce(
          (total, purchase) => total + (Number(purchase.inviterCommission) || 0),
          0,
        );
        marketer["purchaseCommissionCount"] = purchaseCommissionCount;
      });
    }

    const marketersOfThisHead = await this.userRepo.find({
      where: {
        getMarketerBy: findHead.referralCode,
        roles: In([UserRoles.MARKETER]),
      }
    });

    const marketerIds: string[] = marketersOfThisHead.map(x => x.id);

    // let purchases=await this.purchasedTgmRepo.find()
    if (marketerIds?.length > 0) {
      const purchases = await this.purchasedTgmRepo
        .createQueryBuilder('pt')
        .where("pt.inviter->>'id' IN (:...ids)", { ids: marketerIds })
        .andWhere("pt.marketerCommission is not null")
        .getMany();

      const findClaimablePurchase = purchases.find(x => x.headOfMarketerCommission && x.headOfMarketerClaimedCommission == false);
      return { data, count, hasNextPage, claim: findClaimablePurchase ? true : false };
    }
    // purchases=purchases.filter(x=>marketerIds.includes(x.inviter?.id)==true)

    return { data, count, hasNextPage, claim: false };
  }


  public async newHeadMarketers(
    paginationDto: PaginationDto<{ initData: string; }>, // No filter needed since we're fetching marketers for a specific head
  ): Promise<{ data: UserEntity[]; count: number; hasNextPage: boolean; claim: boolean; }> {
    let headId = paginationDto.filter.initData;
    const { page, limit, sortBy, sortOrder } = paginationDto;

    // Find head marketer and validate
    const findHead = await this.userRepo.findOne({ where: { initData: headId } });
    if (!findHead || !findHead.roles.find((x) => x == UserRoles.HEAD_OF_MARKETING)) {
      throw new ForbiddenException();
    }

    // Build pagination query
    const queryOptions: FindManyOptions<UserEntity> = {
      where: {
        getMarketerBy: findHead.referralCode,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
    };

    // Get paginated marketers and total count
    const [data, count] = await this.userRepo.findAndCount(queryOptions);
    const hasNextPage = page * limit < count;

    // Fetch purchases for each marketer in the current page
    if (data.length > 0) {
      for (let index = 0; index < data.length; index++) {
        const marketer = data[index];
        const purchases = await this.purchasedTgmRepo.createQueryBuilder("pt")
          .where("pt.inviter->>'id' = :marketerId", { marketerId: marketer.id })
          .leftJoinAndSelect("pt.user", "u")
          .getMany();
        marketer["purchases"] = purchases;
      }
    }

    // Check if there are any claimable purchases for the head marketer
    const marketersOfThisHead = await this.userRepo.find({
      where: {
        getMarketerBy: findHead.referralCode,
      },
    });

    const marketerIds: string[] = marketersOfThisHead.map((x) => x.id);

    let claim = false;

    if (marketerIds?.length > 0) {
      const purchases = await this.purchasedTgmRepo
        .createQueryBuilder("pt")
        .where("pt.inviter->>'id' IN (:...ids)", { ids: marketerIds })
        .andWhere("pt.marketerCommission IS NOT NULL")
        .getMany();

      const findClaimablePurchase = purchases.find(
        (x) => x.headOfMarketerCommission && x.headOfMarketerClaimedCommission == false,
      );

      claim = findClaimablePurchase ? true : false;
    }

    const headPurchases = await this.purchasedTgmRepo.createQueryBuilder("pt")
      .where('pt."headOfInviter"->>\'id\' = :headId', { headId: findHead.id })
      .andWhere("pt.headOfMarketerCommission IS NOT NULL")
      .getMany();

    const findClaimablePurchase = headPurchases.find(
      (x) => x.headOfMarketerCommission && x.headOfMarketerClaimedCommission == false,
    );

    if (findClaimablePurchase)
      claim = true;


    return { data, count, hasNextPage, claim };
  }

  async marketerUsers(
    paginationDto: PaginationDto<{ initData: string; }>,
  ): Promise<{ data: UserEntity[]; count: number; hasNextPage: boolean; claim: boolean; }> {
    const { page, limit, sortBy, sortOrder } = paginationDto;

    // Find the marketer
    const findMarketer = await this.userRepo.findOne({
      where: { initData: paginationDto.filter.initData },
    });
    if (!findMarketer) {
      throw new NotFoundException('Marketer not found');
    }

    // Build pagination query for users invited by the marketer
    const queryOptions: FindManyOptions<UserEntity> = {
      where: { invitedBy: findMarketer.referralCode },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['purchasedTgms'], // Include purchasedTgms relation
    };

    // Get paginated users and total count
    const [data, count] = await this.userRepo.findAndCount(queryOptions);
    const hasNextPage = page * limit < count;

    // let purchases=await this.purchasedTgmRepo.find({where:{  inviter: Raw((alias) => `"${alias}"->>'id' = :marketerId`, {
    //   marketerId:findMarketer.id,
    // }),}})

    //TODO
    let purchases = await this.purchasedTgmRepo.createQueryBuilder('pt')
      .where("pt.inviter->>'id' = :id", { id: findMarketer.id })
      .andWhere("pt.marketerCommission is not null")
      .andWhere('pt."marketerCommission"::int > 0')
      .andWhere('pt."invitedByMarketer" is true')
      .getMany();
    // purchases=purchases.filter(x=>x.inviter?.id==findMarketer.id)

    let shouldCalimOrNot: boolean;
    const findClaimablePurchase = purchases.find(x => x.marketerCommission && x.marketerClaimedCommission == false);
    return { data, count, hasNextPage, claim: findClaimablePurchase ? true : false };

  }

  async marketerUserPurchases(
    paginationDto: PaginationDto<{ initData: string; }>,
  ): Promise<{ data: PurchasedTgmEntity[]; count: number; hasNextPage: boolean; }> {
    const { page, limit, sortBy, sortOrder } = paginationDto;

    // Find the marketer by initData
    const marketer = await this.userRepo.findOne({
      where: { initData: paginationDto.filter.initData },
    });
    if (!marketer || !marketer.roles.find((x) => x == UserRoles.MARKETER)) {
      throw new ForbiddenException('Marketer not found or invalid role');
    }

    // Build pagination query for purchases
    const queryOptions: FindManyOptions<PurchasedTgmEntity> = {
      where: { user: { invitedBy: marketer.referralCode } }, // Filter purchases by marketer's referralCode
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['user'], // Include user relation if needed
    };

    // Get paginated purchases and total count
    const [data, count] = await this.purchasedTgmRepo.findAndCount(queryOptions);
    const hasNextPage = page * limit < count;

    return { data, count, hasNextPage };
  }

  public async addMarketer(initData: string, referralCode: string): Promise<UserEntity> {
    const findHead = await this.userRepo.findOne({ where: { initData } });

    if (!findHead)
      throw new NotFoundException(ExceptionMessageEnum.INIT_DATA_NOT_FOUND);

    if (!findHead.roles.find(x => x == UserRoles.HEAD_OF_MARKETING))
      throw new ForbiddenException();

    const findMarketer = await this.userRepo.findOne({ where: { referralCode } });
    if (!findMarketer)
      throw new NotFoundException(ExceptionMessageEnum.REFERRAL_CODE_NOT_FOUND);

    if (findMarketer.getMarketerBy && !findMarketer.deletedAtOfMarketers)
      throw new ConflictException("User Already is Marketer");


    if (findMarketer.roles.find(x => x == UserRoles.MARKETER))
      throw new ConflictException("User Already is Marketer");

    findMarketer.getMarketerBy = findHead.referralCode;
    findMarketer.roles.push(UserRoles.MARKETER);
    return await this.userRepo.save(findMarketer);

  }

  public async deleteMarketer(user: IUserToken, initData: string): Promise<UserEntity> {
    const findHead = await this.userRepo.findOne({ where: { initData: user.initData } });
    if (!findHead || !findHead?.roles.find(x => x == UserRoles.HEAD_OF_MARKETING))
      throw new ForbiddenException();

    const findMarketer = await this.userRepo.findOne({ where: { initData } });

    if (!findMarketer.roles.find(x => x == UserRoles.MARKETER) || !findMarketer.getMarketerBy)
      throw new BadRequestException();

    findMarketer.roles.splice(findMarketer.roles.findIndex(x => x == UserRoles.MARKETER), 1);
    findMarketer.deletedAtOfMarketers = new Date();
    return await this.userRepo.save(findMarketer);
  }

  public async updateMarketerVipStatusAndCommission(user: IUserToken, initData: string, updateMarketerDto: UpdateMarketerDto): Promise<UserEntity> {
    const findHead = await this.userRepo.findOne({ where: { initData: user.initData } });
    if (!findHead.roles.find(x => x == UserRoles.HEAD_OF_MARKETING))
      throw new ForbiddenException();

    const findMarketer = await this.userRepo.findOne({ where: { initData } });

    if (!findMarketer.roles.find(x => x == UserRoles.MARKETER))
      throw new BadRequestException("Init Data is not for Marketer");

    if (updateMarketerDto.commission)
      findMarketer.marketerCommision = updateMarketerDto.commission;

    if (updateMarketerDto.vip)
      findMarketer.marketerVip = updateMarketerDto.vip;

    return await this.userRepo.save(findMarketer);
  }

  public async claimAllMarketerCommissions(initData: string): Promise<UserEntity> {
    const findMarketer = await this.userRepo.findOne({ where: { initData } });

    if (!findMarketer.roles.find(x => x == UserRoles.MARKETER))
      throw new ForbiddenException();


    const purchases = await this.purchasedTgmRepo.find({ where: { inviter: { initData: initData }, marketerClaimedCommission: false } });
    let finalCommission: number;
    let purchaseIds: string[] = [];

    purchases.forEach(x => {
      finalCommission += Math.floor(Number(x.marketerCommission)),
        purchaseIds.push(x.id);
    });

    await this.purchasedTgmRepo.update(purchaseIds, { marketerClaimedCommission: true });
    findMarketer.tgmCount += finalCommission;
    return await this.userRepo.save(findMarketer);
  }

  public async claimAllHeadOfMarketerCommissions(initData: string): Promise<UserEntity> {
    const findHeadMarketer = await this.userRepo.findOne({ where: { initData } });

    if (!findHeadMarketer.roles.find(x => x == UserRoles.HEAD_OF_MARKETING))
      throw new ForbiddenException();

    // const purchases=await this.purchasedTgmRepo.find({where:{headOfInviter:{initData:initData},headOfMarketerClaimedCommission:false}})

    const purchases = await this.purchasedTgmRepo
      .createQueryBuilder('pt')
      .where(`pt."headOfInviter"->>'initData' = :initData`, { initData: initData })
      .andWhere('pt."headOfMarketerClaimedCommission" = :claimed', { claimed: false })
      .andWhere("pt.headOfMarketerCommission is not null")
      .getMany();
    let finalCommission: number = 0;
    let purchaseIds: string[] = [];

    if (purchases?.length <= 0)
      throw new BadRequestException("There is no purchase");

    purchases.forEach(x => {
      finalCommission = finalCommission + Math.floor(Number(x.headOfMarketerCommission)),
        purchaseIds.push(x.id);
    });
    console.log("-------- ids --------");
    console.log(purchaseIds);
    await this.purchasedTgmRepo.update(purchaseIds, { headOfMarketerClaimedCommission: true });
    findHeadMarketer.tgmCount += finalCommission;
    return await this.userRepo.save(findHeadMarketer);
  }

  async findUserOrThrow(initData: string) {
    const user = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (!user)
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    return user;
  }

  async findInviterOrThrow(invitedBy: string) {
    const inviter = await this.userRepo.findOne({ where: { referralCode: invitedBy } });
    if (!inviter)
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    return inviter;
  }

  async validateTraansaction(txId: string, walletAddress: string) {
    if (!txId)
      throw new BadRequestException("TxId NOT EXist");

    const txIdIsValidOrNot = await this.tonService.txIdIsValid(txId, walletAddress);
    if (txIdIsValidOrNot == false)
      throw new BadRequestException("Transaction Id is Not Valid");
  }

  validateBuyTypeAndAmount(type: number, amount: number) {
    if (type && amount)
      throw new BadRequestException("Somethings Wrong");
    if (
      type &&
      !amount &&
      type !== 2 &&
      type !== 4 &&
      type !== 5
    ) {
      throw new HttpException(ExceptionMessageEnum.PACKAGE_ID_IS_WRONG, HttpStatus.FORBIDDEN);
    }
  }

  commissionCalculater(amount: number | string, percentage: number | string) {
    return String(Math.floor(Number(amount) * (Number(percentage) / 100)));
  }

  // TODO REFACTOR
  async buyTgm(buyTgmDto: BuyTgmDto) {
    try {
      this.validateBuyTypeAndAmount(buyTgmDto.type, buyTgmDto.amount);
      const user = await this.findUserOrThrow(buyTgmDto.initData);

      if (process.env.NODE_ENV == "production")
        await this.validateTraansaction(buyTgmDto.txId, user.walletAddress);

      if (buyTgmDto.amount && !buyTgmDto.type)
        // BUY TGM WITHOUT TYPE
        return await this.buyTgmAmount(buyTgmDto, user);

      // BUY TGM WITH TYPE
      return await this.buyTgmType(buyTgmDto, user);
    } catch (error) {
      console.log(error);
    }
  }

  async buyTgmType(buyTgmDto: BuyTgmDto, user: UserEntity) {
    if (user.packageIds.find(x => x == buyTgmDto.type))
      throw new HttpException(
        ExceptionMessageEnum.THE_PACKAGE_ID_HAS_BEEN_BOUGHT_PREVIOUSLY,
        HttpStatus.FORBIDDEN,
      );

    let packageReward = 0;
    switch (buyTgmDto.type) {
      case 2:
        packageReward = 4000000;
        break;
      case 4:
        packageReward = 1000000;
        user.isVip = true;
        break;
      case 5:
        packageReward = 24000000;
        user.isMilioner = true;
        break;
    }

    user.packageIds.push(buyTgmDto.type);

    let percentOfRemainingForUser = 100;

    const createPurchasedDto: Partial<PurchasedTgmEntity> = {
      amount: String(packageReward),
      type: buyTgmDto.type ? buyTgmDto.type : 0,
      user: user,
      txId: buyTgmDto.txId
    };


    let inviterType;
    if (user.invitedBy) {
      const inviter = await this.findInviterOrThrow(user.invitedBy);
      createPurchasedDto.inviter = inviter;

      inviterType = UserRoles.NORMAL;

      if (inviter.roles.find(x => x == UserRoles.HEAD_OF_MARKETING)) {
        console.log("-------- im here ---------");
        createPurchasedDto.invitedByMarketer = false;
        createPurchasedDto.headOfInviter = inviter;
        createPurchasedDto.headOfMarketerCommission = this.commissionCalculater(packageReward, 20);
        percentOfRemainingForUser -= 20;
        createPurchasedDto.inviterType = UserRoles.HEAD_OF_MARKETING;

      } else if (inviter.roles.find(x => x == UserRoles.MARKETER) && !inviter.deletedAtOfMarketers) {

        const headOfMarketing = await this.userRepo.findOne({ where: { referralCode: inviter.getMarketerBy } });
        createPurchasedDto.invitedByMarketer = true;
        createPurchasedDto.headOfInviter = headOfMarketing;

        if (inviter.marketerVip) {

          createPurchasedDto.invitedByVipMarketer = true;

          createPurchasedDto.marketerCommission =
            this.commissionCalculater(packageReward, inviter.marketerCommision);

          percentOfRemainingForUser -= inviter.marketerCommision;

        } else {

          createPurchasedDto.marketerCommission = this.commissionCalculater(packageReward, 10);
          percentOfRemainingForUser -= 10;

        }

        createPurchasedDto.headOfMarketerCommission = this.commissionCalculater(packageReward, 10);
        percentOfRemainingForUser -= 10;

        createPurchasedDto.inviterType = UserRoles.MARKETER;

      } else {
        if (inviter.isVip) createPurchasedDto.invitedByVip = true;
        createPurchasedDto.inviterType = inviterType;
        createPurchasedDto.inviterCommission = this.commissionCalculater(packageReward, 5);
      }
    } else if (user.getMarketerBy && !user.deletedAtOfMarketers) {
      const inviter = await this.findInviterOrThrow(user.getMarketerBy);
      createPurchasedDto.inviter = inviter;

      if (inviter.roles.find(x => x == UserRoles.HEAD_OF_MARKETING)) {
        createPurchasedDto.invitedByMarketer = false;
        createPurchasedDto.headOfInviter = inviter;
        createPurchasedDto.headOfMarketerCommission = this.commissionCalculater(packageReward, 10);
        percentOfRemainingForUser -= 10;
        createPurchasedDto.inviterType = UserRoles.HEAD_OF_MARKETING;
      }
    }

    user.boughtTgmCount += packageReward;
    user.tgmCount += Number(this.commissionCalculater(packageReward, percentOfRemainingForUser));
    if (buyTgmDto.type === 2)
      user = await this.createMarketer(user);
    await this.purchasedTgmRepo.save(this.purchasedTgmRepo.create(createPurchasedDto));
    return await this.userRepo.save(user);
  }

  async createMarketer(user: UserEntity): Promise<UserEntity> {
    if (!user.roles.find(x => x == UserRoles.HEAD_OF_MARKETING)) {
      user.roles.push(UserRoles.HEAD_OF_MARKETING);
      user.roles.splice(user.roles.findIndex(x => x == UserRoles.MARKETER), 1);
      user.deletedAtOfMarketers = new Date();
    }
    return user;
  }

  async findHeadMarketingOwner(): Promise<UserEntity> {
    return await this.userRepo.createQueryBuilder("user")
      .where(`:role = ANY (string_to_array(user.roles, ','))`, { role: UserRoles.HEAD_OF_MARKETING.toString() })
      .where(`:role = ANY (string_to_array(user.roles, ','))`, { role: UserRoles.OWNER.toString() })
      .getOne();
  }

  async buyTgmAmount(buyTgmDto: BuyTgmDto, user: UserEntity) {
    const createPurchasedDto: Partial<PurchasedTgmEntity> = {
      amount: String(buyTgmDto.amount),
      type: null,
      user: user,
      txId: buyTgmDto.txId
    };

    user.boughtTgmCount += buyTgmDto.amount;

    user.tgmCount += buyTgmDto.amount;

    const purchasedInstance = this.purchasedTgmRepo.create(createPurchasedDto);

    await this.purchasedTgmRepo.save(purchasedInstance);

    return await this.userRepo.save(user);
  }

}
