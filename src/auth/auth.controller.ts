import { Body, Controller, Post } from '@nestjs/common';
import { LogInDto } from './log-in.dto';
import { AuthService } from './auth.service';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/base.response';
import { User } from 'src/users/users.entity';

@Controller('api/users')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async login(@Body() logInDto: LogInDto): Promise<BaseResponse<User | null>> {
    const { email, password } = logInDto;
    return await this.authService.login(email, password);
  }
}
