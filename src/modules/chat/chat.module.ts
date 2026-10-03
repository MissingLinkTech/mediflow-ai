import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '@/modules/ai/ai.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ChatContext } from './entities/chat-context.entity.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { MessageMetadata } from './entities/message-metadata.entity.js';
import { Message } from './entities/message.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatSession,
      Message,
      ChatContext,
      MessageMetadata,
    ]),
    AiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
