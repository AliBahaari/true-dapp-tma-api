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
    name: 'red_envelope_log',
})
export class RedEnvelopeLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

    @Column({ nullable: true, type: 'timestamptz' })
    claimDate: string;

    @Column()
    amount: string;

    @Column({
        name: 'creatorId',
    })
    creatorId: string;

    @ManyToOne(
        () => UserEntity,
        (UserEntity) => UserEntity.createdRedEnvelope,
    )
    @JoinColumn({
        name: 'creatorId',
    })
    creator: UserEntity;

    @Column({
        name: 'receiverId',
    })
    receiverId: string;

    @ManyToOne(
        () => UserEntity,
        (UserEntity) => UserEntity.receivedRedEnvelope,
    )
    @JoinColumn({
        name: 'receiverId',
    })
    receiver: UserEntity;
}
