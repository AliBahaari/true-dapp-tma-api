import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { TasksService } from 'src/tasks/tasks.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as CryptoJS from 'crypto-js';
import Decimal from 'decimal.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private taskService: TasksService,
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
      lastOnline: '',
      privateCode,
      hasEstimatedTgmPrice: false,
      estimatedTgmPrice: '0',
      invitedBy: createUserDto.invitedBy || null,
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
      lastOnline: '',
      privateCode,
      hasEstimatedTgmPrice: false,
      estimatedTgmPrice: '0',
      invitedBy: createUserDto.invitedBy || null,
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
      referralCodeUserFindOne.tgmCount += 100;
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

  async updateUserTask(initData: string, taskId: string) {
    const taskFindOne = await this.taskService.findOne(taskId);
    if (taskFindOne) {
      const userFindOne = await this.userRepo.findOne({
        where: {
          initData,
        },
      });
      if (userFindOne) {
        userFindOne.tapCoinCount += taskFindOne.reward;
        userFindOne.completedTasks.push(taskId);
        await this.userRepo.save(userFindOne);
        const { secretCode, ...restProps } = userFindOne;
        return restProps;
      } else {
        throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
      }
    } else {
      throw new HttpException('Task ID Not Found', HttpStatus.NOT_FOUND);
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
        tapCoinCount: 'DESC',
      },
    });

    const foundIndex = usersFindAll.findIndex((i) => i.initData === initData);

    return {
      highestRank: usersFindAll[0],
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
    const todayUsers = await this.userRepo.find({
      where: {
        lastOnline: new Date().toLocaleDateString(),
      },
    });

    return {
      allUsers: await this.userRepo.count(),
      todayUsers: todayUsers.length,
    };
  }

  async updateEstimatedTgmPrice(initData: string, estimatedPrice: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      userFindOne.estimatedTgmPrice = estimatedPrice;
      userFindOne.hasEstimatedTgmPrice = true;
      await this.userRepo.save(userFindOne);
      const { secretCode, ...restProps } = userFindOne;
      return restProps;
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async deleteUser(initData: string) {
    return await this.userRepo.delete({
      initData,
    });
  }
}
