import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { UsersService } from '@/modules/users/users.service.js';
import { User } from '@/modules/users/entities/user.entity.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokenPair {
  user: User;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenSaltRounds = 12;
  private readonly resetTokenTtlMs = 1000 * 60 * 30;
  private readonly dummyPasswordHash =
    '$2b$12$0pUTkZC4F8QhTHepDIEPaeIl16I7xPG5xHoOamUxeo45pvVrW.DUa';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const user = await this.usersService.create(signUpDto);
    const tokens = await this.issueAndStoreTokenPair(user);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    const passwordHash = user?.passwordHash ?? this.dummyPasswordHash;
    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      passwordHash,
    );

    if (!user || !isValidPassword || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.issueAndStoreTokenPair(user);

    return {
      user,
      ...tokens,
    };
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokenPair> {
    const user = await this.usersService.findByIdOrFail(userId);

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const isValidRefreshToken = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return this.issueAndStoreTokenPair(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      return;
    }

    const resetToken = this.generateOpaqueToken();
    const resetPasswordTokenHash = this.hashOpaqueToken(resetToken);
    const resetPasswordExpiresAt = new Date(Date.now() + this.resetTokenTtlMs);

    await this.usersService.setPasswordResetToken(
      user.id,
      resetPasswordTokenHash,
      resetPasswordExpiresAt,
    );
    await this.dispatchPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const resetPasswordTokenHash = this.hashOpaqueToken(dto.token);
    const user = await this.usersService.findByResetTokenHash(
      resetPasswordTokenHash,
    );

    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (
      !this.compareOpaqueTokenHashes(
        resetPasswordTokenHash,
        user.resetPasswordTokenHash,
      )
    ) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const passwordHash = await this.usersService.hashPassword(dto.password);
    await this.usersService.updatePasswordAndClearSensitiveTokens(
      user.id,
      passwordHash,
    );
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findByIdOrFail(userId);
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const passwordHash = await this.usersService.hashPassword(dto.newPassword);
    await this.usersService.updatePasswordAndClearSensitiveTokens(
      user.id,
      passwordHash,
    );
  }

  private async issueAndStoreTokenPair(user: User): Promise<AuthTokenPair> {
    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.refreshTokenSaltRounds,
    );

    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);
    user.refreshTokenHash = refreshTokenHash;

    return tokens;
  }

  private async generateTokens(user: User): Promise<AuthTokenPair> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
      jti: randomUUID(),
    };
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
      jti: randomUUID(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private compareOpaqueTokenHashes(
    firstHash: string,
    secondHash: string | null,
  ): boolean {
    if (!secondHash) {
      return false;
    }

    const first = Buffer.from(firstHash, 'hex');
    const second = Buffer.from(secondHash, 'hex');

    if (first.length !== second.length) {
      return false;
    }

    return timingSafeEqual(first, second);
  }

  private async dispatchPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    void email;
    void resetToken;
    await Promise.resolve();
  }
}
