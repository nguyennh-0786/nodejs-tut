import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Hello')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  @ApiOperation({ summary: 'Get Hello Message (supports i18n)' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async getHello(): Promise<string> {
    return await this.appService.getHello();
  }
}
