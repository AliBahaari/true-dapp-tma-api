import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  
  @Entity({
    name: 'treasury',
  })
  export class TreasuryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      unique: true,
    })
    address: string
  
    @CreateDateColumn()
    createdAt: string;
  }
  