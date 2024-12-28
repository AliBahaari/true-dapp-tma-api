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
    return await this.userRepo.save({
      initData:
        typeof createUserDto === 'string'
          ? createUserDto
          : createUserDto.initData,
      tgmCount: 0,
      tapCoinCount: 0,
      level: 1,
      referralCount: 0,
      referralCode: Math.random().toString(36).substring(2, 7),
      tasks: [],
      lastOnline: '',
    });
  }

  async findAll() {
    return await this.userRepo.find();
  }

  async findOne(initData: string) {
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
      await this.userRepo.save(userFindOne);
      return {
        ...userFindOne,
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
    if (!userFindOne) {
      return {
        status: HttpStatus.BAD_REQUEST,
      };
    }
    userFindOne.referralCount += 1;
    userFindOne.tgmCount += 100;
    userFindOne.level = Math.ceil(userFindOne.referralCount / 6.18);

    return await this.userRepo.save(userFindOne);
  }

  async updateUserTask(initData: string, taskId: number) {
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
        return await this.userRepo.save(userFindOne);
      }
    }

    throw new HttpException('Task ID Not Found', HttpStatus.NOT_FOUND);
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

  async updateEstimatedTgmPrice(initData: string, estimatedPrice: number) {
    const userFindOne = await this.userRepo.findOne({
      where: {
        initData,
      },
    });
    if (userFindOne) {
      userFindOne.estimatedTgmPrice = estimatedPrice;
      userFindOne.hasEstimatedTgmPrice = true;
      await this.userRepo.save(userFindOne);
      return userFindOne;
    }

    throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
  }
}
