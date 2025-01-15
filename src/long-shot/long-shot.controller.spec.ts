import { Test, TestingModule } from '@nestjs/testing';
import { LongShotController } from './long-shot.controller';
import { LongShotService } from './long-shot.service';

describe('LongShotController', () => {
  let controller: LongShotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LongShotController],
      providers: [LongShotService],
    }).compile();

    controller = module.get<LongShotController>(LongShotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
