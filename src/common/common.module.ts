import { Module } from '@nestjs/common';
import { CommonService } from './services/common.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([User])
    ],
    providers: [CommonService],
    exports: [CommonService],
})
export class CommonModule {}