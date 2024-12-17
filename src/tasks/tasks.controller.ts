import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('create')
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get('findAll')
  findAll() {
    return this.tasksService.findAll();
  }

  @Get('findOne/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }
}
