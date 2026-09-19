import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh_token')
    refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto)
    }
}
