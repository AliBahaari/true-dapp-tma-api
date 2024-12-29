import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private taskRepo: Repository<TaskEntity>,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    return await this.taskRepo.save(createTaskDto);
  }

  async findAll() {
    return await this.taskRepo.find();
  }

  async findOne(id: string) {
    const taskFindOne = await this.taskRepo.findOne({
      where: {
        id,
      },
    });
    if (taskFindOne) {
      return taskFindOne;
    } else {
      throw new HttpException('Task ID Not Found', HttpStatus.NOT_FOUND);
    }
  }
}
