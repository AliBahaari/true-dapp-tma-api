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

    @Column({nullable:true})
    invitedByVip:boolean

    @Column({nullable:true})
    invitedByMarketer:boolean

    @Column({type:"jsonb",nullable:true})
    inviter:UserEntity

    @Column({type:"jsonb",nullable:true})
    headOfInviter:UserEntity

    @ManyToOne(()=>UserEntity,(x)=>x.purchasedTgms)
    user:UserEntity
  }
  