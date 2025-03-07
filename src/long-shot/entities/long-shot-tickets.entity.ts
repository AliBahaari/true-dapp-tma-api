import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotPacksEntity } from './long-shot-packs.entity';

@Entity({
  name: 'long-shot-tickets',
})
export class LongShotTicketEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  initData: string;

  @Column({
    default: 0,
  })
  ticketLevel: 0 | 1 | 2 | 3;

  @Column({
    default: 0,
  })
  longShotGameTgmCount: number;

  @Column({
    default: 0,
  })
  allowanceLeagueCount: number;

  @Column({
    type: 'simple-array',
  })
  participatedLeagues: string[];

  @OneToOne(
    () => LongShotPacksEntity)
  @JoinColumn({
    name: 'packId',
  })
  pack: LongShotPacksEntity;
}
