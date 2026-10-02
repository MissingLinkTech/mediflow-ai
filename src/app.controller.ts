import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from './common/decorators/response-message.decorator.js';
import { ApiStandardResponse } from './common/decorators/swagger/index.js';
import { AppService } from './app.service.js';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ResponseMessage('Service is healthy')
  @ApiOperation({
    summary: 'Health check',
    description: [
      'Returns a plain-text greeting wrapped in the standard success envelope.',
      '',
      'Headers: none (public route). Useful for uptime probes and Swagger smoke tests.',
    ].join('\n'),
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Service is running. Envelope wraps a greeting string.',
    message: 'Service is healthy',
    exampleData: { greeting: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
