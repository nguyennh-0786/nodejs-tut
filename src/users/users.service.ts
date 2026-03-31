import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './create-user.dto';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { BaseResponse } from 'src/common/base.response';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(
    value: CreateUserDto,
    i18n: I18nContext,
  ): Promise<BaseResponse<User | null>> {
    try {
      const existingUser = await this.findUserByEmail(value.email, i18n);
      if (existingUser.data) {
        return new BaseResponse(400, await i18n.t('lang.email_exists'), null);
      }
      const newUser = this.userRepository.create({ ...value });
      await this.userRepository.save(newUser);
      return new BaseResponse(
        200,
        await i18n.t('lang.create_user_success', {
          args: { username: newUser.username },
        }),
        newUser,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return new BaseResponse(
        400,
        await i18n.t('lang.failed_to_create_user'),
        null,
      );
    }
  }

  async findUserByEmail(
    email: string,
    i18n: I18nContext,
  ): Promise<BaseResponse<User | null>> {
    const user = await this.userRepository.findOneBy({ email });
    return new BaseResponse(
      200,
      await (user
        ? i18n.t('lang.get_users_success')
        : i18n.t('lang.user_not_found')),
      user,
    );
  }

  async findAllUsers(i18n: I18nContext): Promise<BaseResponse<User[]>> {
    return new BaseResponse(
      200,
      await i18n.t('lang.get_users_success'),
      await this.userRepository.find(),
    );
  }
}
