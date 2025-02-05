import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({
    name: 'file',
})
export class FileEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @Column()
    originalName: string;

    @Column()
    size: number;

    @CreateDateColumn()
    createdAt: string;
}
