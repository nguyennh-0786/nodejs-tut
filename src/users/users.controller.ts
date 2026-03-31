import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { I18n } from 'nestjs-i18n/dist/decorators/i18n.decorator';
import { CreateUserDto } from './create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponse } from 'src/common/base.response';
import { User } from './users.entity';

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
  ): Promise<BaseResponse<User | null>> {
    return await this.usersService.createUser(body, i18n);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async findAll(@I18n() i18n: I18nContext): Promise<BaseResponse<User[]>> {
    return await this.usersService.findAllUsers(i18n);
  }
}
