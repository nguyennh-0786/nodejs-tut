import { Body, Controller, Post } from '@nestjs/common';
import { SignInDto } from './sign-in.dto';
import { AuthService } from './auth.service';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { I18n } from 'nestjs-i18n/dist/decorators/i18n.decorator';
import { BaseResponse } from 'src/common/base.response';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in a user' })
  @ApiHeader({
    name: 'Accept-Language',
    description:
      'Language code (e.g., en, vi) to specify the language for the response',
    required: false,
  })
  async signin(
    @Body() signInDto: SignInDto,
    @I18n() i18n: I18nContext,
  ): Promise<BaseResponse<{ accessToken: string } | null>> {
    const { email, password } = signInDto;
    return await this.authService.signIn(email, password, i18n);
  }
}
