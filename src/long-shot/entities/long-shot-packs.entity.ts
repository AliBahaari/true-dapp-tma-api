import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotLeaguesWeeklyEntity } from './long-shot-leagues-weekly.entity';
import { LongShotTicketEntity } from './long-shot-tickets.entity';
import { LongShotMatchesEntity } from './long-shot-matches.entity';

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

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  guessTime: string;

  @Column()
  endDate: string;

  @CreateDateColumn()
  createdAt: string;

  @OneToMany(
    () => LongShotTicketEntity,
    (longShotTicketEntity) => longShotTicketEntity.pack,
  )
  tickets: LongShotTicketEntity[];

  @Column({
    name: 'leagueWeeklyId',
    nullable: true,
  })
  leagueWeeklyId: string;

  @ManyToOne(
    () => LongShotLeaguesWeeklyEntity,
    (longShotLeaguesWeeklyEntity) => longShotLeaguesWeeklyEntity.pack,
  )
  @JoinColumn({
    name: 'leagueWeeklyId',
  })
  leagueWeekly: LongShotLeaguesWeeklyEntity;

  @OneToMany(
    () => LongShotMatchesEntity,
    (longShowMatchesEntity) => longShowMatchesEntity.pack,
  )
  matches: LongShotMatchesEntity[];

}
