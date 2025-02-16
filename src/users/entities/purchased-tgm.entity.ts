import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { UserEntity } from './user.entity';
  
  
  @Entity({
    name: 'purchased_tgm',
  })
  export class PurchasedTgmEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt:string

    @Column()
    amount:string

    @Column()
    type:number

    @ManyToOne(()=>UserEntity,(x)=>x.purchasedTgms)
    user:UserEntity
  }
  