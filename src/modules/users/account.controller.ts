import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard.js';
import { AuthService } from '@/modules/auth/auth.service.js';
import { ChangePasswordDto } from '@/modules/auth/dto/change-password.dto.js';
import type { JwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface.js';
import { ApiAccountDocs } from './docs/users.docs.js';
import { UpdateAccountSettingsDto } from './dto/update-account-settings.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Account')
@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get('profile')
  @ApiAccountDocs.getProfile()
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.findByIdOrFail(user.sub);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAccountDocs.changePassword()
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user.sub, changePasswordDto);
  }

  @Patch('settings')
  @HttpCode(HttpStatus.OK)
  @ApiAccountDocs.updateSettings()
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() updateAccountSettingsDto: UpdateAccountSettingsDto,
  ) {
    return this.usersService.updateAccountSettings(
      user.sub,
      updateAccountSettingsDto,
    );
  }
}
