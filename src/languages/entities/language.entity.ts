import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  name: 'languages',
})
export class LanguageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  language: string;

  @Column({
    unique: true,
  })
  languageCode: string;

  @CreateDateColumn()
  createdAt: string;
}
