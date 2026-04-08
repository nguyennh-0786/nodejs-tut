import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { BaseResponse } from 'src/common/base.response';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { t } from 'src/shared/utils';
import { User } from 'src/users/users.entity';
import { UserSerializer } from 'src/users/serializers/user.serializer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly i18nService: I18nService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<BaseResponse<User | null>> {
    const user = await this.usersService.findUserByEmailOrThrow(email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        await t(this.i18nService, 'lang.invalid_credentials'),
      );
    }
    const payload = { email: user.email, id: user.id };
    const accessToken = this.jwtService.sign(payload);
    const formattedUser = new UserSerializer(user, {
      type: 'BASIC_INFO',
    }).serialize();
    return new BaseResponse(await t(this.i18nService, 'lang.sign_in_success'), {
      ...formattedUser,
      token: accessToken,
    } as User);
  }
}
