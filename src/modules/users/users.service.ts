import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

    findByEmail(email: string): Promise<User | null> {
        const emailTrim = email.trim().toLowerCase();
        return this.userRepository.findOne({
            where: {email: emailTrim}
        })
    }

    findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: {id}
        });
    }

    async findByIdOrFail(id: string): Promise<User| null> {
        const user = this.findById(id);
        if (!user) {
            throw new NotFoundException('User not found.');
        }
        return user;
    }

    async create(registerUserDto: RegisterDto): Promise<User> {
        const { password, email, ...rest } = registerUserDto;
        const findUser = await this.findByEmail(email);
        if (findUser) {
            throw new BadRequestException(`User already exists with this email address: ${email}`);
        }
        // Hash manually right before database insertion
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = this.userRepository.create({ password: hashedPassword, ...rest });
        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            order: {
                createdAt: 'DESC'
            }
        });
    }
}
