import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Post()
    async create(@Body() userCreateDto: RegisterDto) {
        return await this.userService.create(userCreateDto);
    }

    @Get()
    async findAll() {
        return await this.userService.findAll();
    }
}
