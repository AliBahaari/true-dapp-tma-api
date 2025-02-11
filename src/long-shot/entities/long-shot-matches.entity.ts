import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotLeaguesWeeklyEntity } from './long-shot-leagues-weekly.entity';
import { LongShotParticipantsEntity } from './long-shot-participants.entity';
import { LongShotTeamEntity } from './long-shot-teams.entity';
import { LongShotPacksEntity } from './long-shot-packs.entity';

@Entity({
  name: 'long-shot-matches',
})
export class LongShotMatchesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LongShotTeamEntity, { nullable: true })
  @JoinColumn({ name: 'firstTeamId' })
  firstTeam: LongShotTeamEntity;

  @Column({
    name: 'firstTeamId',
    nullable: true,
  })
  firstTeamId: string;

  @ManyToOne(() => LongShotTeamEntity, { nullable: true })
  @JoinColumn({ name: 'secondTeamId' })
  secondTeam: LongShotTeamEntity;

  @Column({
    name: 'secondTeamId',
    nullable: true,
  })
  secondTeamId: string;

  @Column({
    default: '',
  })
  result: string;

  @Column({
    default: new Date(),
    type: 'date'
  })
  matchDate: Date;

  @Column({
    name: 'leagueWeeklyId',
  })
  leagueWeeklyId: string;

  @ManyToOne(
    () => LongShotLeaguesWeeklyEntity,
    (longShotLeaguesWeeklyEntity) => longShotLeaguesWeeklyEntity.matches,
  )
  @JoinColumn({
    name: 'leagueWeeklyId',
  })
  leagueWeekly: LongShotLeaguesWeeklyEntity;


  @Column({
    name: 'packId',
    nullable: true
  })
  packId: string;
  
  @ManyToOne(
    () => LongShotPacksEntity,
    (longShotPacksEntity) => longShotPacksEntity.matches,
  )
  @JoinColumn({
    name: 'packId',
  })
  pack: LongShotPacksEntity;

  @OneToMany(
    () => LongShotParticipantsEntity,
    (longShotParticipantsEntity) => longShotParticipantsEntity.match,
  )
  participants: LongShotParticipantsEntity[];
}
