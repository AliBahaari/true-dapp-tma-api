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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  fullName: string;

  @Column({
    type: 'json',
  })
  walletsInfo: string;

  @CreateDateColumn()
  createdAt: string;
}
