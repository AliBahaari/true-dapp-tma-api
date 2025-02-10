import {
  Column,
  CreateDateColumn,
  Entity, OneToMany, PrimaryGeneratedColumn
} from 'typeorm';

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

  @Column({default: false})
  isUpdatedResult: boolean;

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

  @Column({nullable:true})
  ticketLevel:number

  @CreateDateColumn()
  createdAt: string;

  @OneToMany(
    () => LongShotMatchesEntity,
    (longShowMatchesEntity) => longShowMatchesEntity.pack,
  )
  matches: LongShotMatchesEntity[];

}
