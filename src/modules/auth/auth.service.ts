import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '@/modules/users/entities/user-session.entity.js';
import { CommonService } from '@/common/services/common.service.js';
import { COMMON_MESSAGES } from '@/common/constants/common-message.constants.js';
import { getCurrentDate } from '@/common/utils/date.util.js';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserSession) private readonly userSessionRepository: Repository<UserSession>,
        private readonly commonService: CommonService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
        const { email, password } = loginDto;
        // Search user from database by email
        const validateUser = await this.commonService.findUserBy(null, email);
        if (!validateUser) throw new UnauthorizedException(COMMON_MESSAGES.AUTH.INVALID_CRED);
        // Check user status
        if (!validateUser.isActive) throw new ForbiddenException(COMMON_MESSAGES.AUTH.INACTIVE_USER);

        // Verify user password
        const isValidPassword = await bcrypt.compare(password, validateUser.password);
        if (!isValidPassword) throw new UnauthorizedException(COMMON_MESSAGES.AUTH.INVALID_CRED);
        // Create user session
        const sessionData = {
            userId: validateUser.id,
            refreshTokenHash: '',
            expiresAt: this.getRefreshExpiry(),
            revokedAt: null,
            userAgent: userAgent ?? null,
            ipAddress: ipAddress ?? null

        };
        let session = this.userSessionRepository.create(sessionData);
        session = await this.userSessionRepository.save(session)
        // JWT payload
        const payload = {
            sub: validateUser.id,
            sessionId: session.id,
            email: validateUser.email
        };
        // Generate tokens
        const tokens = await this.generateTokens(payload);
        // Hash refresh token
        const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
        // Store hash
        session.refreshTokenHash = refreshTokenHash;
        await this.userSessionRepository.save(session);

        return {
            user: {
                id: validateUser.id,
                name: validateUser.name,
                email: validateUser.email
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        };
    }
    
    async refreshToken(refreshTokenDto: RefreshTokenDto) {
        let payload;
        // Verify JWT
        try {
            payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);
        } catch {
            throw new UnauthorizedException(COMMON_MESSAGES.AUTH.INVALID_OR_EXPIRE_REFRESH_TOKEN);
        }
        // Find session
        const session = await this.userSessionRepository.findOne({
            where: {
                id: payload.sessionId,
                userId: payload.sub
            }
        });
        if (!session) throw new NotFoundException(COMMON_MESSAGES.AUTH.SESSION_NOT_FOUND);
        if (session.revokedAt) throw new UnauthorizedException(COMMON_MESSAGES.AUTH.SESSION_REVOKED);
        
    
    }

    private async saveRefreshToken() {}

    private async generateTokens(payload: JwtPayload) {
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(payload),
            this.generateRefreshToken(payload)
        ]); 

        return { accessToken, refreshToken };
    }

    private async generateAccessToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') as any
        });
    }

    private async generateRefreshToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any
        });
    }

    private async verifyRefreshToken(token: string): Promise<JwtPayload> {
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
        return this.jwtService.verifyAsync(token, { secret: refreshSecret });
    }

    private getRefreshExpiry() {
        const currentDate = getCurrentDate();
        currentDate.setDate(currentDate.getDate() + 7);
        return currentDate;
    }
}
