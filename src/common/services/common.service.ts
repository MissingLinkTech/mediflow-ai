import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { User } from "../../modules/users/entities/user.entity.js";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class CommonService {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

    generateUuid(): string {
        return randomUUID();
    }

    async findUserBy(id: string | null, email: string | null): Promise<User | null> {
        let user;

        if (id) {
            user = this.userRepository.findOne({ where: { id } });
        }

        if (email) {
            user = this.userRepository.findOne({ where: { email } });
        }

        if (!user) {
            throw new NotFoundException('User not found!');
        }
        return user;
    }
}