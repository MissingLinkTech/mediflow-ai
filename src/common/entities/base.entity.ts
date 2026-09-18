import { CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

export abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({name: 'created_at', type: 'timestamptz'})
    createdAt: Date;

    @CreateDateColumn({name: 'updated_at', type: 'timestamptz'})
    updatedAt: Date;
}