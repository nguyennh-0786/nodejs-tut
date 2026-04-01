import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { BaseResponse } from 'src/common/base.response';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly i18nService: I18nService,
  ) {}

  private async t(
    key: string,
    args?: Record<string, unknown>,
  ): Promise<string> {
    return this.i18nService.t(key, { args });
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<BaseResponse<{ accessToken: string } | null>> {
    const user = await this.usersService.findUserByEmailOrThrow(email);
    if (!user) {
      return new BaseResponse(
        401,
        await this.t('lang.invalid_credentials'),
        null,
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new BaseResponse(
        401,
        await this.t('lang.invalid_credentials'),
        null,
      );
    }
    const payload = { username: user.email, id: user.id };
    const accessToken = this.jwtService.sign(payload);
    return new BaseResponse(
      200,
      await this.i18nService.t('lang.sign_in_success'),
      {
        accessToken: accessToken,
      },
    );
  }
}
