import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';
import { ApiAuthDocs } from './docs/auth.docs.js';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiAuthDocs.signUp()
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiAuthDocs.login()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh_token')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuthDocs.refreshToken()
  async refreshToken(
    @CurrentUser() user: JwtPayload,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(
      user.sub,
      refreshTokenDto.refreshToken,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthDocs.logout()
  async logout(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logout(user.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthDocs.forgotPassword()
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthDocs.resetPassword()
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }
}
