import { Test, TestingModule } from '@nestjs/testing';
import { LongShotService } from './long-shot.service';

describe('LongShotService', () => {
  let service: LongShotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LongShotService],
    }).compile();

    service = module.get<LongShotService>(LongShotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
