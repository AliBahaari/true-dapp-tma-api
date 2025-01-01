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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  initData: string;

  @Column()
  fullName: string;

  @Column({ default: 1 })
  level: number;

  @Column({
    unique: true,
  })
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
  completedTasks: string[];

  @Column()
  lastOnline: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  hasEstimatedTgmPrice: boolean;

  @Column({
    default: '0',
  })
  estimatedTgmPrice: string;

  @Column({
    unique: true,
  })
  secretCode: string;

  @Column({
    unique: true,
  })
  privateCode: string;

  @Column({
    nullable: true,
  })
  invitedBy: string | null;

  @CreateDateColumn()
  createdAt: string;
}
