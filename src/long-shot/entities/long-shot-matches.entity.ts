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

@Entity({
  name: 'long-shot-matches',
})
export class LongShotMatchesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstSide: string;

  @Column()
  secondSide: string;

  @Column({
    default: '',
  })
  result: string;

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

  @OneToMany(
    () => LongShotParticipantsEntity,
    (longShotParticipantsEntity) => longShotParticipantsEntity.match,
  )
  participants: LongShotParticipantsEntity[];
}
