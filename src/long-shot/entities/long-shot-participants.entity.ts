import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotMatchesEntity } from './long-shot-matches.entity';

@Entity({
  name: 'long-shot-participants',
})
export class LongShotParticipantsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  initData: string;

  @Column()
  choice: string;

  @Column({
    name: 'matchId',
  })
  matchId: string;

  @ManyToOne(
    () => LongShotMatchesEntity,
    (longShotMatchesEntity) => longShotMatchesEntity.participants,
  )
  @JoinColumn({
    name: 'matchId',
  })
  match: LongShotMatchesEntity;
}
