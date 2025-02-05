import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotLeaguesWeeklyEntity } from './long-shot-leagues-weekly.entity';
import { LongShotTicketEntity } from './long-shot-tickets.entity';

@Entity({
  name: 'long-shot-packs',
})
export class LongShotPacksEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  reward: number;

  @Column({
    type: 'jsonb',
    default: []
  })
  winner: string[];

  @Column({
    type: 'jsonb',
    default: []
  })
  hasWinnerClaimedReward: boolean[];

  @Column()
  endDate: string;

  @CreateDateColumn()
  createdAt: string;

  @OneToMany(
    () => LongShotLeaguesWeeklyEntity,
    (longShotLeaguesWeeklyEntity) => longShotLeaguesWeeklyEntity.pack,
  )
  leaguesWeekly: LongShotLeaguesWeeklyEntity[];

  @OneToMany(
    () => LongShotTicketEntity,
    (longShotTicketEntity) => longShotTicketEntity.pack,
  )
  tickets: LongShotTicketEntity[];
}
