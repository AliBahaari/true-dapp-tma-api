import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'cash-avalanche',
})
export class CashAvalancheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Init

  @Column()
  gameId: number;

  @Column()
  startReward: number;

  @Column()
  bidStart: number;

  @Column()
  bidStep: number;

  @Column({
    type: 'bigint',
  })
  startAt: number;

  @Column({
    type: 'bigint',
  })
  intervalTime: number;

  // Bid

  @Column()
  totalReward: number;

  @Column({
    type: 'json',
  })
  allParticipants: { initData: string; bid: number }[];

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
