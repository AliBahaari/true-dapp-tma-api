import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotMatchesEntity } from './long-shot-matches.entity';
import { LongShotPacksEntity } from './long-shot-packs.entity';
import { LongShotTeamEntity } from './long-shot-teams.entity';

@Entity({
  name: 'long-shot-leagues-weekly',
})
export class LongShotLeaguesWeeklyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    name: 'packId',
    nullable: true
  })
  packId: string;

  @OneToMany(
    () => LongShotMatchesEntity,
    (longShowMatchesEntity) => longShowMatchesEntity.leagueWeekly,
  )
  matches: LongShotMatchesEntity[];

  @ManyToOne(
    () => LongShotPacksEntity,
    (longShotPacksEntity) => longShotPacksEntity.leaguesWeekly,
  )
  @JoinColumn({
    name: 'packId',
  })
  pack: LongShotPacksEntity;


  @OneToMany(
    () => LongShotTeamEntity,
    (longShowTeamEntity) => longShowTeamEntity.league,
  )
  team: LongShotTeamEntity[];
}
