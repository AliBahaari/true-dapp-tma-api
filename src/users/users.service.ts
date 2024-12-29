import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { TasksService } from 'src/tasks/tasks.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private taskService: TasksService,
  ) {}

  async create(createUserDto: CreateUserDto | string) {
    const referralCode = Math.random().toString(36).substring(2, 7);
    const initData =
      typeof createUserDto === 'string'
        ? createUserDto
        : createUserDto.initData;
    return await this.userRepo.save({
      initData,
      tgmCount: 0,
      tapCoinCount: 0,
      level: 1,
      referralCount: 0,
      referralCode,
      tasks: [],
      lastOnline: '',
      secretCode: initData + referralCode.toString(),
    });
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

  async findOrCreate(initData: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      const usersFindAll = await this.userRepo.find();
      let allEstimatedTgmPrices = 0;
      usersFindAll.map((i) => {
        allEstimatedTgmPrices += Number(i.estimatedTgmPrice);
      });

      userFindOne.lastOnline = new Date().toLocaleDateString();
      const { secretCode, ...restProps } = userFindOne;
      await this.userRepo.save(userFindOne);
      return {
        ...restProps,
        allEstimatedTgmPrices:
          allEstimatedTgmPrices / (await this.userRepo.count()),
      };
    }

    return await this.create(initData);
  }

  async updateReferralCode(referralCode: string) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        referralCode,
      },
    });
    if (userFindOne) {
      userFindOne.referralCount += 1;
      userFindOne.tgmCount += 100;
      userFindOne.level = Math.ceil(userFindOne.referralCount / 6.18);
      const { secretCode, ...restProps } = userFindOne;
      await this.userRepo.save(userFindOne);
      return restProps;
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
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
        const { secretCode, ...restProps } = userFindOne;
        await this.userRepo.save(userFindOne);
        return restProps;
      } else {
        throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
      }
    } else {
      throw new HttpException('Task ID Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async findStats(initData: string) {
    const usersFindAll = await this.userRepo.find({
      order: {
        tapCoinCount: 'DESC',
      },
    });

    const foundIndex = usersFindAll.findIndex((i) => i.initData === initData);

    return {
      highestRank: usersFindAll[0],
      sequenceRanks: [
        usersFindAll[foundIndex - 5],
        usersFindAll[foundIndex - 4],
        usersFindAll[foundIndex - 3],
        usersFindAll[foundIndex - 2],
        usersFindAll[foundIndex - 1],
        usersFindAll[foundIndex],
        usersFindAll[foundIndex + 1],
        usersFindAll[foundIndex + 2],
        usersFindAll[foundIndex + 3],
        usersFindAll[foundIndex + 4],
        usersFindAll[foundIndex + 5],
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
      userFindOne.estimatedTgmPrice = Number(estimatedPrice);
      userFindOne.hasEstimatedTgmPrice = true;
      const { secretCode, ...restProps } = userFindOne;
      await this.userRepo.save(userFindOne);
      return restProps;
    } else {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
  }
}
