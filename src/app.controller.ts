import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';

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
  async getHello(@I18n() i18n: I18nContext): Promise<string> {
    return await i18n.t('lang.hello_world');
  }
}
