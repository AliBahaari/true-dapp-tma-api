import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClaimedRewardLogEntity } from './claimed-reward-log.entity';
import { CompleteTaskLogEntity } from './complete-task-log.entity';
import { PurchasedTgmEntity } from './purchased-tgm.entity';
import { RedEnvelopeLogEntity } from './red-envelope-log.entity';
import { WalletLogEntity } from './wallet-log.entity';

export enum UserRoles {
  ADMIN = 1,
  DEVELOPER = 2,
  NORMAL = 3,
  HEAD_OF_MARKETING = 4,
  MARKETER = 5,
  OWNER = 6
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
  walletAddress: string;

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

  @Column({
    default: 0,
  })
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
    default: '0.000777',
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

  @Column({
    type: 'boolean',
    default: false,
  })
  isMilioner: boolean;

  @Column()
  referralRewardsCount: number;

  @Column()
  levelUpRewardsCount: number;

  @Column({
    default: 0,
  })
  boughtTgmCount: number;

  @Column({
    default: 0,
  })
  invitedUserBuyTgmCommission: number;

  @Column({
    type: 'simple-array',
  })
  packageIds: (1 | 2 | 3 | 4 | 5)[];

  @Column({
    type: 'simple-array',
  })
  roles: UserRoles[];

  @Column({
    type: 'bigint',
  })
  hourlyRewardTime: number;

  @Column({ nullable: true })
  marketerVip: boolean;

  @Column({ nullable: true })
  marketerCommision: number;

  @Column({
    default: 0,
  })
  redEnvelopeCount: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  isBanned: boolean;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  userHasInvitedLink: boolean;

  @Column({ nullable: true })
  deletedAtOfMarketers: Date;

  @Column({ nullable: true })
  getMarketerBy: string;

  @CreateDateColumn()
  createdAt: string;

  @OneToMany(() => PurchasedTgmEntity, (x) => x.user)
  purchasedTgms: PurchasedTgmEntity[];


  @OneToMany(() => RedEnvelopeLogEntity, (x) => x.creator)
  createdRedEnvelope: RedEnvelopeLogEntity[];

  @OneToMany(() => RedEnvelopeLogEntity, (x) => x.receiver)
  receivedRedEnvelope: RedEnvelopeLogEntity[];

  @OneToMany(() => WalletLogEntity, (x) => x.user)
  wallets: WalletLogEntity[];

  @OneToMany(()=>CompleteTaskLogEntity,(x)=>x.user)
  ref_complete_tasks:CompleteTaskLogEntity[]

  @OneToMany(()=>ClaimedRewardLogEntity,(x)=>x.user)
  ref_claimed_rewards:ClaimedRewardLogEntity[]
}
