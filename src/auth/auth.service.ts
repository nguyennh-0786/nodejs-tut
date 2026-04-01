import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { BaseResponse } from 'src/common/base.response';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { t } from 'src/shared/utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly i18nService: I18nService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<BaseResponse<{ accessToken: string } | null>> {
    const user = await this.usersService.findUserByEmailOrThrow(email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        await t(this.i18nService, 'lang.invalid_credentials'),
      );
    }
    const payload = { email: user.email, id: user.id };
    const accessToken = this.jwtService.sign(payload);
    return new BaseResponse(await t(this.i18nService, 'lang.sign_in_success'), {
      accessToken: accessToken,
    });
  }
}
