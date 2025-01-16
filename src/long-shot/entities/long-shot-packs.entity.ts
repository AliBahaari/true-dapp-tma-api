import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotLeaguesWeeklyEntity } from './long-shot-leagues-weekly.entity';

@Entity({
  name: 'long-shot-packs',
})
export class LongShotPacksEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  endDate: string;

  @CreateDateColumn()
  createdAt: string;

  @OneToMany(
    () => LongShotLeaguesWeeklyEntity,
    (longShotLeaguesWeeklyEntity) => longShotLeaguesWeeklyEntity.pack,
  )
  leaguesWeekly: LongShotLeaguesWeeklyEntity[];
}
