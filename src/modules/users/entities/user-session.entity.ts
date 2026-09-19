import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity.js";
import { User } from "./user.entity.js";

@Entity('user_sessions')
export class UserSession extends BaseEntity {
    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'text' })
    refreshTokenHash: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    revokedAt: Date | null;

    @Column({ nullable: true })
    userAgent: string | null;

    @Column({ nullable: true })
    ipAddress: string | null;
}