import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRoles {
  ADMIN = 1,
  DEVELOPER = 2,
  NORMAL = 3,
}

@Entity({
  name: 'users',
})
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  initData: string;

  @Column({
    default: '',
  })
  fullName: string;

  @Column({
    default: '',
  })
  image: string;

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

  @Column({
    type: 'simple-array',
  })
  claimedRewards: string[];

  @Column()
  lastOnline: string;

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

  @Column({
    type: 'boolean',
    default: false,
  })
  isVip: boolean;

  @Column()
  referralRewardsCount: number;

  @Column()
  levelUpRewardsCount: number;

  @Column({
    default: 0,
  })
  boughtTgmCount: number;

  @Column({
    type: 'simple-array',
  })
  roles: UserRoles[];

  @CreateDateColumn()
  createdAt: string;
}
