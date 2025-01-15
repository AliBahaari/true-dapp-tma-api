import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LongShotMatchesEntity } from './long-shot-matches.entity';

@Entity({
  name: 'long-shot-leagues-weekly',
})
export class LongShotLeaguesWeeklyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @OneToMany(
    () => LongShotMatchesEntity,
    (longShowMatchesEntity) => longShowMatchesEntity.leagueWeekly,
  )
  matches: LongShotMatchesEntity[];
}
