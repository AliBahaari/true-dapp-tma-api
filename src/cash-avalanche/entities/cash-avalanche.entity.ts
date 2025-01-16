import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'cash-avalanche',
})
export class CashAvalancheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Init

  @Column()
  gameId: string;

  @Column()
  startReward: number;

  @Column()
  bidStep: number;

  @Column({
    type: 'bigint',
  })
  intervalTime: number;

  // Bid

  @Column()
  totalReward: number;

  @Column({
    type: 'simple-array',
  })
  allParticipants: string[];

  @Column({
    default: 0,
  })
  allParticipantsCount: number;

  @Column()
  nextBid: number;

  @Column({
    type: 'bigint',
  })
  remainingTime: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  hasClaimedReward: boolean;
}
