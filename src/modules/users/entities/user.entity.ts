import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity.js";
import { Role } from "../../../common/enums/role.enum.js";

@Entity('users')
export class User extends BaseEntity {
    @Column({length: 100})
    name: string;

    @Column({unique: true})
    email: string;

    @Column({select: false})
    password: string;

    @Column({type: 'enum', enum: Role, default: Role.USER})
    role: Role;

    @Column({name: 'is_active', default: true})
    isActive: boolean;

    @Column({name: 'email_verified_at', type: 'timestamptz', nullable: true})
    emailVerifiedAt: Date | null
}