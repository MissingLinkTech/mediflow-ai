import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { SignUpDto } from '@/modules/auth/dto/sign-up.dto.js';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto.js';
import {
  PageMetaDto,
  PaginatedResponseDto,
} from '@/common/dto/paginated-response.dto.js';
import { Role } from '@/common/enums/role.enum.js';
import { User, UserSettings } from './entities/user.entity.js';
import { UpdateAccountSettingsDto } from './dto/update-account-settings.dto.js';

@Injectable()
export class UsersService {
  private readonly passwordSaltRounds = 12;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async findByResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetPasswordTokenHash: tokenHash },
    });
  }

  async create(signUpDto: SignUpDto): Promise<User> {
    const email = this.normalizeEmail(signUpDto.email);
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await this.hashPassword(signUpDto.password);
    const user = this.userRepository.create({
      email,
      name: signUpDto.name?.trim() ? signUpDto.name.trim() : null,
      passwordHash,
      refreshTokenHash: null,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
      settings: {},
      role: Role.USER,
      isActive: true,
      emailVerifiedAt: null,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<User>> {
    const [items, totalItems] = await this.userRepository.findAndCount({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items,
      meta: PageMetaDto.create({
        page: query.page,
        limit: query.limit,
        totalItems,
      }),
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.passwordSaltRounds);
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash });
  }

  async setPasswordResetToken(
    userId: string,
    resetPasswordTokenHash: string,
    resetPasswordExpiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      resetPasswordTokenHash,
      resetPasswordExpiresAt,
    });
  }

  async updatePasswordAndClearSensitiveTokens(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      passwordHash,
      refreshTokenHash: null,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
    });
  }

  async updateAccountSettings(
    userId: string,
    dto: UpdateAccountSettingsDto,
  ): Promise<User> {
    const user = await this.findByIdOrFail(userId);
    const settings: UserSettings = { ...user.settings };

    if (dto.name !== undefined) {
      user.name = dto.name.trim();
      settings.displayName = dto.name.trim();
    }

    if (dto.locale !== undefined) {
      settings.locale = dto.locale;
    }

    if (dto.timezone !== undefined) {
      settings.timezone = dto.timezone;
    }

    if (dto.notificationEmails !== undefined) {
      settings.notificationEmails = dto.notificationEmails;
    }

    user.settings = settings;
    return this.userRepository.save(user);
  }
}
