import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { UserEntity, UserRoles } from './user.entity';
  
  
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
    txId:string

    // type of inviter
    @Column({enum:UserRoles,nullable:true})
    inviterType: UserRoles
  

    // the inviter is vip or not
    @Column({nullable:true})
    invitedByVip:boolean

    // inviter is marketer or not
    @Column({nullable:true})
    invitedByMarketer:boolean

    //  inviter is vip marketer or not
    @Column({nullable:true})
    invitedByVipMarketer:boolean

    // inviter commission
    @Column({nullable:true})
    inviterCommission:string

    // if marketer is inviter whats the commission
    @Column({nullable:true})
    marketerCommission:string

    // head of marketer commission
    @Column({nullable:true})
    headOfMarketerCommission:string

    // is inviter claimed his commission
    @Column({default:false})
    inviterClaimedCommission:boolean

    // is marketer claimed his commission
    @Column({default:false})
    marketerClaimedCommission:boolean
    
    // head of marketer claimed his commission
    @Column({default:false})
    headOfMarketerClaimedCommission:boolean

    // who is the inviter
    @Column({type:"jsonb",nullable:true})
    inviter:UserEntity

    // who is head of inviter
    @Column({type:"jsonb",nullable:true})
    headOfInviter:UserEntity

    // who was the user 
    @ManyToOne(()=>UserEntity,(x)=>x.purchasedTgms)
    user:UserEntity
  }
  