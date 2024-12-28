import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  name: 'wallets',
})
export class WalletEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({
    type: 'json',
  })
  walletsInfo: string;

  @CreateDateColumn()
  createdAt: string;
}
