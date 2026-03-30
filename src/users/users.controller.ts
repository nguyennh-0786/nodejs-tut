import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { I18n } from 'nestjs-i18n/dist/decorators/i18n.decorator';
import { CreateUserDto } from './create-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async create(
    @Body() body: CreateUserDto,
    @I18n() i18n: I18nContext,
  ): Promise<string> {
    const user = await this.usersService.createUser(body);
    return await i18n.t('lang.create_user_success', {
      args: { username: user.username },
    });
  }
}
