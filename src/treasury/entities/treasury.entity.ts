import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
  
  @Entity({
    name: 'treasury',
  })
  export class TreasuryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    address: string
  
    @CreateDateColumn()
    createdAt: string;
  }
  