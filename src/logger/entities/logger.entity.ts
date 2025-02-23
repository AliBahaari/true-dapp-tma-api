import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('request_logger')
export class RequestLoggerEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    method: string;

    @Column()
    url: string;

    @Column('json', { nullable: true })
    headers: Record<string, any>;

    @Column('json', { nullable: true })
    params: Record<string, any>;

    @Column('json', { nullable: true })
    query: Record<string, any>;

    @Column('json', { nullable: true })
    body: Record<string, any>;

    @Column()
    statusCode: number;

    @CreateDateColumn()
    createdAt: string;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true })
    roles: string;

    @Column({ nullable: true })
    initData: string;

    @Column({ nullable: true })
    secretCode: string;
}
