import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponse } from 'src/common/base.response';
import { CurrentUser } from './current-user.decorator';
import { UserSerializer } from './serializers/user.serializer';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async register(
    @Body() body: RegisterUserDto,
  ): Promise<BaseResponse<Record<string, any>>> {
    return await this.usersService.registerUser(body);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('all')
  @ApiOperation({ summary: 'Get all users' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async findAll(): Promise<BaseResponse<Record<string, any>[]>> {
    return await this.usersService.findAllUsers();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  getCurrentUser(@CurrentUser() user: UserSerializer) {
    return user;
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put()
  @ApiOperation({ summary: 'Update current user' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async updateCurrentUser(
    @Body() body: UpdateUserDto,
    @CurrentUser() user: UserSerializer,
  ) {
    const id = user['id'] as number;
    const updatedUser = await this.usersService.updateUser(id, body);
    return updatedUser;
  }
}
