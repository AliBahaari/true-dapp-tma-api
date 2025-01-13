import { Test, TestingModule } from '@nestjs/testing';
import { CashAvalancheService } from './cash-avalanche.service';

describe('CashAvalancheService', () => {
  let service: CashAvalancheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashAvalancheService],
    }).compile();

    service = module.get<CashAvalancheService>(CashAvalancheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
