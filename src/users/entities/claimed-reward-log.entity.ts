import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';


@Entity({
    name: 'claimed_reward_log',
})
export class ClaimedRewardLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

    @Column()
    taskName: string;

    @Column()
    amount:string

    @Column({
        name: 'userId',
    })
    userId: string;

    @ManyToOne(
        () => UserEntity,
        (UserEntity) => UserEntity.ref_claimed_rewards,
    )
    @JoinColumn({
        name: 'userId',
    })
    user: UserEntity;
}
