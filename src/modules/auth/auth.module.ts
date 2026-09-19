import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/users/entities/user.entity.js';
import { CommonModule } from '@/common/common.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CommonModule
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
