import { Test, TestingModule } from '@nestjs/testing';
import { CashAvalancheController } from './cash-avalanche.controller';
import { CashAvalancheService } from './cash-avalanche.service';

describe('CashAvalancheController', () => {
  let controller: CashAvalancheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashAvalancheController],
      providers: [CashAvalancheService],
    }).compile();

    controller = module.get<CashAvalancheController>(CashAvalancheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
