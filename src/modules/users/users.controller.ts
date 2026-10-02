import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard.js';
import { ApiUsersDocs } from './docs/users.docs.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiUsersDocs.findAll()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.userService.findAll(query);
  }
}
