import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common/exceptions';
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
import { FindManyOptions, In, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { BuyTgmDto } from './dto/buy-tgm.dto';
import { CreateRedEnvelopeDto } from './dto/create-red-envelope.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { NewCreateRedEnvelopeDto } from './dto/new-create-red-envelope.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateMarketerDto } from './dto/update-marketer.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { PurchasedTgmEntity } from './entities/purchased-tgm.entity';
import { RedEnvelopeLogEntity } from './entities/red-envelope-log.entity';
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
    @InjectRepository(LongShotTicketEntity) private ticketRepo: Repository<LongShotTicketEntity>,
    @InjectRepository(LongShotPacksEntity) private packRepo: Repository<LongShotPacksEntity>,
    @InjectRepository(CashAvalancheEntity) private cashAvalancheRepo: Repository<CashAvalancheEntity>,
    private readonly tonService:TonService,
    @InjectRepository(PurchasedTgmEntity) private purchasedTgmRepo: Repository<PurchasedTgmEntity>,
    @InjectRepository(RedEnvelopeLogEntity) private redEnvelopeLogRepo: Repository<RedEnvelopeLogEntity>,

  ) { }

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
        lastOnline: '',
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

  async buyTgm(buyTgmDto: BuyTgmDto) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData: buyTgmDto.initData,
      },
    });
    if (!userFindOne) {
      throw new HttpException(ExceptionMessageEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.tonService.txIdIsValid(buyTgmDto.txId,userFindOne.walletAddress)

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
        packageReward = 2000000;
      } else if (buyTgmDto.type === 3) {
        packageReward = 100000;
      } else if (buyTgmDto.type === 4) {
        packageReward = 1000000;
        userFindOne.isVip = true;
      } else if (buyTgmDto.type === 5) {
        packageReward = 24000000;
      }
      userFindOne.packageIds.push(buyTgmDto.type);
    }

    let percentOfRemainingForUser = 100;

    const createPurchasedDto: Partial<PurchasedTgmEntity> = {
      amount: buyTgmDto.type ? String(packageReward) : String(buyTgmDto.amount),
      type: buyTgmDto.type ? buyTgmDto.type : 0,
      user: userFindOne,
      txId: buyTgmDto.txId
    };



    if (userFindOne.invitedBy) {
      const inviter = await this.userRepo.findOne({ where: { referralCode: userFindOne.invitedBy } });
      createPurchasedDto.inviter = inviter;
      if (inviter.isVip) {
        createPurchasedDto.invitedByVip = true;
      }

      // if(inviter.roles.includes(UserRoles.HEAD_OF_MARKETING) || inviter.roles.includes(UserRoles.MARKETER))
      // {
      //   if(inviter.roles.includes(UserRoles.HEAD_OF_MARKETING))
      //   {
      //     createPurchasedDto.invitedByMarketer=true
      //     createPurchasedDto.headOfInviter=inviter
      //   }

      //   if(inviter.roles.includes(UserRoles.MARKETER))
      //   {
      //     const findHeadOfMarketing=await this.userRepo.findOne({where:{referralCode:inviter.invitedBy}})
      //     createPurchasedDto.invitedByMarketer=true
      //     createPurchasedDto.headOfInviter=findHeadOfMarketing
      //   }
      // }

      let inviterType = UserRoles.NORMAL;

      if (inviter.getMarketerBy && inviter.roles.find(x => x == UserRoles.MARKETER)) {
        const findHeadOfMarketing = await this.userRepo.findOne({ where: { referralCode: inviter.getMarketerBy } });
        createPurchasedDto.invitedByMarketer = true;
        createPurchasedDto.headOfInviter = findHeadOfMarketing;

        if (inviter.marketerVip) {
          createPurchasedDto.invitedByVipMarketer = true;

          createPurchasedDto.marketerCommission = String(Math.floor(
            (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (inviter.marketerCommision / 100),
          ));
          percentOfRemainingForUser -= inviter.marketerCommision;
        } else {
          createPurchasedDto.marketerCommission = String(Math.floor(
            (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (10 / 100),
          ));
          percentOfRemainingForUser -= 10;
        }

        createPurchasedDto.headOfMarketerCommission = String(Math.floor(
          (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (10 / 100),
        ));

        percentOfRemainingForUser -= 10;

        inviterType = UserRoles.MARKETER;
      }

      if (!inviter.getMarketerBy && inviter.roles.find(x => x == UserRoles.HEAD_OF_MARKETING)) {
        createPurchasedDto.invitedByMarketer = false;
        createPurchasedDto.headOfInviter = inviter;

        createPurchasedDto.headOfMarketerCommission = String(Math.floor(
          (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (20 / 100),
        ));

        percentOfRemainingForUser -= 20;

        inviterType = UserRoles.HEAD_OF_MARKETING;
      }

      createPurchasedDto.inviterType = inviterType;

      createPurchasedDto.inviterCommission = String(Math.floor(
        (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (5 / 100),
      ));

      userFindOne.invitedUserBuyTgmCommission += Math.floor(
        (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (5 / 100),
      );
      userFindOne.boughtTgmCount += buyTgmDto.type
        ? packageReward
        : buyTgmDto.amount;
      userFindOne.tgmCount += Math.floor(
        (buyTgmDto.type ? packageReward : buyTgmDto.amount) * (percentOfRemainingForUser / 100),
      );
    } else {
      userFindOne.boughtTgmCount += buyTgmDto.type
        ? packageReward
        : buyTgmDto.amount;
      userFindOne.tgmCount += buyTgmDto.type ? packageReward : buyTgmDto.amount;
    }



    const purchasedInstance = this.purchasedTgmRepo.create(createPurchasedDto);

    await this.purchasedTgmRepo.save(purchasedInstance);

    return await this.userRepo.save(userFindOne);
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
      findInitDatUser.tgmCount += 2000;
      findInitDatUser.claimedRewards.push(TaskEnum.CONNNECT_WALLET);
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.FIRST_CASH_AVALANCHE)
      && !findInitDatUser.claimedRewards.includes(TaskEnum.FIRST_CASH_AVALANCHE)
    ) {
      findInitDatUser.tgmCount += 2000;
      findInitDatUser.claimedRewards.push(TaskEnum.FIRST_CASH_AVALANCHE);
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.FIRST_LONG_SHOT)
      && !findInitDatUser.claimedRewards.includes(TaskEnum.FIRST_LONG_SHOT)
    ) {
      findInitDatUser.tgmCount += 2000;
      findInitDatUser.claimedRewards.push(TaskEnum.FIRST_LONG_SHOT);
    }



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

      return await this.userRepo.save(findInitDatUser);
    }
  }


  // DEEP SEEK VERSION
  /*
  async claimAllRewards(initData: string): Promise<UserEntity> {
    const findInitDatUser = await this.userRepo.findOne({
      where: { initData },
    });

    if (!findInitDatUser) {
      throw new NotFoundException('User not found');
    }

    if (findInitDatUser.levelUpRewardsCount && findInitDatUser.levelUpRewardsCount > 0) {
      findInitDatUser.tgmCount += findInitDatUser.levelUpRewardsCount;
      findInitDatUser.levelUpRewardsCount = 0;
    }

    if (findInitDatUser.referralRewardsCount && findInitDatUser.referralRewardsCount > 0) {
      findInitDatUser.tgmCount += findInitDatUser.referralRewardsCount;
      findInitDatUser.referralRewardsCount = 0;
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.CONNNECT_WALLET) &&
      !findInitDatUser.claimedRewards.includes(TaskEnum.CONNNECT_WALLET)
    ) {
      findInitDatUser.tgmCount += 1000;
      findInitDatUser.claimedRewards.push(TaskEnum.CONNNECT_WALLET);
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.FIRST_CASH_AVALANCHE) &&
      !findInitDatUser.claimedRewards.includes(TaskEnum.FIRST_CASH_AVALANCHE)
    ) {
      findInitDatUser.tgmCount += 1000;
      findInitDatUser.claimedRewards.push(TaskEnum.FIRST_CASH_AVALANCHE);
    }

    if (
      findInitDatUser.completedTasks.includes(TaskEnum.FIRST_LONG_SHOT) &&
      !findInitDatUser.claimedRewards.includes(TaskEnum.FIRST_LONG_SHOT)
    ) {
      findInitDatUser.tgmCount += 1000;
      findInitDatUser.claimedRewards.push(TaskEnum.FIRST_LONG_SHOT);
    }

    if (findInitDatUser.roles.includes(UserRoles.MARKETER)) {
      const invitedUsers = await this.userRepo.find({
        where: {
          invitedBy: findInitDatUser.referralCode,
        },
        relations: { purchasedTgms: true },
      });

      let finalNotClaimedPurchasedTgm: PurchasedTgmEntity[] = [];
      for (const invitedUser of invitedUsers) {
        const finalPurchasedTgms = invitedUser.purchasedTgms.filter(
          (x) => x.marketerClaimedCommission === false,
        );
        for (const notClaimedPurchasedTgm of finalPurchasedTgms) {
          findInitDatUser.tgmCount += Number(notClaimedPurchasedTgm.marketerCommission);
          notClaimedPurchasedTgm.marketerClaimedCommission = true;
          finalNotClaimedPurchasedTgm.push(notClaimedPurchasedTgm);
        }
      }

      // Save only if there are records to update
      if (finalNotClaimedPurchasedTgm.length > 0) {
        await this.purchasedTgmRepo.save(finalNotClaimedPurchasedTgm);
      }
    } else {
      const invitedUsers = await this.userRepo.find({
        where: {
          invitedBy: findInitDatUser.referralCode,
          invitedUserBuyTgmCommission: MoreThan(0),
        },
      });
      for (const invitedUser of invitedUsers) {
        findInitDatUser.tgmCount += invitedUser.invitedUserBuyTgmCommission;
        invitedUser.invitedUserBuyTgmCommission = 0;
        await this.userRepo.save(invitedUser);
      }
    }

    // Save only if there are changes
    if (
      findInitDatUser.levelUpRewardsCount !== 0 ||
      findInitDatUser.referralRewardsCount !== 0 ||
      findInitDatUser.claimedRewards.length > 0 ||
      findInitDatUser.tgmCount > 0
    ) {
      return await this.userRepo.save(findInitDatUser);
    }

    return findInitDatUser;
  }
  */

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
        switch (taskName) {
          case TaskEnum.CONNNECT_WALLET:
            userFindOne.tgmCount += Number(2000);
            break;
          case TaskEnum.FIRST_CASH_AVALANCHE:
            userFindOne.tgmCount += Number(2000);
            break;
          case TaskEnum.FIRST_LONG_SHOT:
            userFindOne.tgmCount += Number(2000);
            break;
          default:
            break;
        }
        userFindOne.claimedRewards.push(taskName);
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


    if (userFindOne.tgmCount < 0)
      throw new BadRequestException(ExceptionMessageEnum.TGM_IS_NOT_ENOUGH);
    await this.userRepo.save(userFindOne);
  }

  async updateUserWalletAddress(initData: string, walletAddress: string) {
    const x = await this.addTask(initData, TaskEnum.CONNNECT_WALLET);
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
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

    const purchases = await this.purchasedTgmRepo
      .createQueryBuilder('pt')
      .where("pt.inviter->>'id' IN (:...ids)", { ids: ['09437688-f2af-4556-b869-63f3e8ba5aed'] })
      .getMany();
    // purchases=purchases.filter(x=>marketerIds.includes(x.inviter?.id)==true)

    let shouldCalimOrNot: boolean;

    const findClaimablePurchase = purchases.find(x => x.headOfMarketerCommission && x.headOfMarketerClaimedCommission == false);

    return { data, count, hasNextPage, claim: findClaimablePurchase ? true : false };
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
      .getMany();
    let finalCommission: number;
    let purchaseIds: string[] = [];

    purchases.forEach(x => {
      finalCommission += Math.floor(Number(x.headOfMarketerCommission)),
        purchaseIds.push(x.id);
    });

    await this.purchasedTgmRepo.update(purchaseIds, { headOfMarketerClaimedCommission: true });
    findHeadMarketer.tgmCount += finalCommission;
    return await this.userRepo.save(findHeadMarketer);
  }
}
