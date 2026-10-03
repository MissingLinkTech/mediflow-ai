import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface.js';
import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateChatDto } from './dto/update-chat.dto.js';
import { ApiChatDocs } from './docs/chat.docs.js';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiChatDocs.createChat()
  async createChat(
    @CurrentUser() user: JwtPayload,
    @Body() createChatDto: CreateChatDto,
  ) {
    return this.chatService.createChat(user.sub, createChatDto);
  }

  @Get()
  @ApiChatDocs.listChats()
  async listChats(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatService.listChats(user.sub, query);
  }

  @Get(':id')
  @ApiChatDocs.getChat()
  async getChat(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.getChat(user.sub, id);
  }

  @Patch(':id')
  @ApiChatDocs.updateChat()
  async updateChat(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatService.updateChat(user.sub, id, updateChatDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiChatDocs.deleteChat()
  async deleteChat(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.chatService.deleteChat(user.sub, id);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiChatDocs.addMessage()
  async addMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.chatService.addMessage(user.sub, id, createMessageDto);
  }

  @Get(':id/messages')
  @ApiChatDocs.listMessages()
  async listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatService.listMessages(user.sub, id, query);
  }
}
