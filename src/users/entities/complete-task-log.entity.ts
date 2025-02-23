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
    name: 'complete_task_log',
})
export class CompleteTaskLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

    @Column()
    taskName: string;

    @Column({
        name: 'userId',
    })
    userId: string;

    @ManyToOne(
        () => UserEntity,
        (UserEntity) => UserEntity.ref_complete_tasks,
    )
    @JoinColumn({
        name: 'userId',
    })
    user: UserEntity;
}
