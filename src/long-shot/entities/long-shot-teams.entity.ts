import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { LongShotMatchesEntity } from './long-shot-matches.entity';
import { LongShotLeaguesWeeklyEntity } from './long-shot-leagues-weekly.entity';

@Entity({
    name: 'long-shot-teams',
})
export class LongShotTeamEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    logo: string;

    @OneToMany(
        () => LongShotMatchesEntity,
        (match) => match.firstTeam,
    )
    matchesAsFirstTeam: LongShotMatchesEntity[];

    @OneToMany(
        () => LongShotMatchesEntity,
        (match) => match.secondTeam,
    )
    matchesAsSecondTeam: LongShotMatchesEntity[];

    @Column({
        name: 'leagueId',
    })
    leagueId: string;
    @ManyToOne(
        () => LongShotLeaguesWeeklyEntity,
        (longShotLeaguesWeeklyEntity) => longShotLeaguesWeeklyEntity.team,
    )
    @JoinColumn({
        name: 'leagueId',
    })
    league: LongShotLeaguesWeeklyEntity;
}
