import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nContext } from 'nestjs-i18n';
import { BaseResponse } from 'src/common/base.response';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
    i18n: I18nContext,
  ): Promise<BaseResponse<{ accessToken: string } | null>> {
    const user = await this.usersService.findUserByEmail(email, i18n);
    if (!user.data) {
      return new BaseResponse(
        401,
        await i18n.t('lang.invalid_credentials'),
        null,
      );
    }
    const isPasswordValid = password === user.data?.password;
    if (!isPasswordValid) {
      return new BaseResponse(
        401,
        await i18n.t('lang.invalid_credentials'),
        null,
      );
    }
    const payload = { username: user.data?.email, sub: user.data?.id };
    const accessToken = this.jwtService.sign(payload);
    return new BaseResponse(200, await i18n.t('lang.sign_in_success'), {
      accessToken: accessToken,
    });
  }
}
