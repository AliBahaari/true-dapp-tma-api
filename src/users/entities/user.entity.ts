import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  name: 'users',
})
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ unique: true })
  initData: string;

  @Column({ default: 1 })
  level: number;

  @Column()
  referralCode: string;

  @Column()
  referralCount: number;

  @Column()
  tapCoinCount: number;

  @Column()
  tgmCount: number;

  @Column({
    type: 'simple-array',
  })
  completedTasks: number[];

  @Column()
  lastOnline: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  hasEstimatedTgmPrice: boolean;

  @Column({
    default: 0,
  })
  estimatedTgmPrice: number;

  @CreateDateColumn()
  createdAt: string;
}
