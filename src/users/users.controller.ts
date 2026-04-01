import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
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
  ): Promise<BaseResponse<User | null>> {
    return await this.usersService.createUser(body);
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
  async findAll(): Promise<BaseResponse<User[]>> {
    return await this.usersService.findAllUsers();
  }
}
