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
    name: 'wallet_log',
})
export class WalletLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

    @Column()
    walletAddress: string;

    @Column({
        name: 'userId',
    })
    userId: string;

    @ManyToOne(
        () => UserEntity,
        (UserEntity) => UserEntity.wallets,
    )
    @JoinColumn({
        name: 'userId',
    })
    user: UserEntity;
}
