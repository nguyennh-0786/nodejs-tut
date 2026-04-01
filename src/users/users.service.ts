import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './create-user.dto';
import { BaseResponse } from 'src/common/base.response';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18nService: I18nService,
  ) {}

  private async t(
    key: string,
    args?: Record<string, unknown>,
  ): Promise<string> {
    return this.i18nService.t(key, { args });
  }

  async createUser(value: CreateUserDto): Promise<BaseResponse<User | null>> {
    const existingUser = await this.findUserByEmailOrThrow(value.email);
    if (existingUser) {
      return new BaseResponse(400, await this.t('lang.email_exists'), null);
    }

    try {
      const hashedPassword = await bcrypt.hash(value.password, 10);
      const newUser = this.userRepository.create({
        ...value,
        password: hashedPassword,
      });
      await this.userRepository.save(newUser);
      return new BaseResponse(
        200,
        await this.t('lang.create_user_success', {
          username: newUser.username,
        }),
        newUser,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return new BaseResponse(
        400,
        await this.t('lang.failed_to_create_user'),
        null,
      );
    }
  }

  async findUserByEmail(email: string): Promise<BaseResponse<User | null>> {
    const user = await this.userRepository.findOneBy({ email });
    return new BaseResponse(
      200,
      await (user
        ? this.i18nService.t('lang.get_users_success')
        : this.i18nService.t('lang.user_not_found')),
      user,
    );
  }

  async findAllUsers(): Promise<BaseResponse<User[]>> {
    return new BaseResponse(
      200,
      await this.i18nService.t('lang.get_users_success'),
      await this.userRepository.find(),
    );
  }

  findUserByEmailOrThrow(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }
}
