import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { BaseResponse } from 'src/common/base.response';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { t } from 'src/shared/utils';
import { UserSerializer } from './serializers/user.serializer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18nService: I18nService,
  ) {}

  async registerUser(
    value: RegisterUserDto,
  ): Promise<BaseResponse<Record<string, any>>> {
    const existingUser = await this.userRepository.findOneBy({
      email: value.email,
    });
    if (existingUser) {
      throw new BadRequestException(
        await t(this.i18nService, 'lang.email_exists'),
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(value.password, 10);
      const newUser = this.userRepository.create({
        ...value,
        password: hashedPassword,
      });
      await this.userRepository.save(newUser);
      return new BaseResponse(
        await t(this.i18nService, 'lang.create_user_success', {
          username: newUser.username,
        }),
        new UserSerializer(newUser, { type: 'BASIC_INFO' }).serialize(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_create_user'),
      );
    }
  }

  async findUserByEmail(
    email: string,
  ): Promise<BaseResponse<Record<string, any> | null>> {
    const user = await this.findUserByEmailOrThrow(email);
    return new BaseResponse(
      await t(this.i18nService, 'lang.get_user_success'),
      new UserSerializer(user, { type: 'BASIC_INFO' }).serialize(),
    );
  }

  async findAllUsers(): Promise<BaseResponse<Record<string, any>[]>> {
    const users = await this.userRepository.find();
    const serializedUsers = users.map((user) =>
      new UserSerializer(user, { type: 'BASIC_INFO' }).serialize(),
    );
    return new BaseResponse(
      await t(this.i18nService, 'lang.get_users_success'),
      serializedUsers,
    );
  }

  async findUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.user_not_found'),
      );
    }
    return user;
  }

  async findUserByIdOrThrow(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.user_not_found'),
      );
    }
    return user;
  }

  async saveUserOrThrow(user: User): Promise<void> {
    try {
      await this.userRepository.save(user);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_update_user'),
      );
    }
  }

  async updateUser(
    id: number,
    updateData: Partial<User>,
  ): Promise<BaseResponse<Record<string, any>>> {
    const user = await this.findUserByIdOrThrow(id);
    Object.assign(user, updateData);
    await this.saveUserOrThrow(user);
    return new BaseResponse(
      await t(this.i18nService, 'lang.update_user_success', {
        username: user.username,
      }),
      new UserSerializer(user, { type: 'BASIC_INFO' }).serialize(),
    );
  }

  async checkUserFollowStatusOrThrow(
    currentUserId: number,
    usernameFollow: string,
    profileFlow: PROFILE_FLOWS = 'PROFILE',
  ): Promise<[boolean, User, User]> {
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['following'],
    });
    const userFollow = await this.userRepository.findOne({
      where: { username: usernameFollow },
    });

    if (!currentUser || !userFollow) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.user_not_found'),
      );
    }

    const following = await this.userRepository.manager
      .createQueryBuilder()
      .from('followUser', 'f')
      .where('f.userId = :currentUserId', {
        currentUserId: currentUser.id,
      })
      .andWhere('f.followUserId = :targetUserId', {
        targetUserId: userFollow.id,
      })
      .getExists();

    if (profileFlow === 'FOLLOW' && following) {
      throw new BadRequestException(
        await t(this.i18nService, 'lang.already_following_user'),
      );
    }
    if (profileFlow === 'UNFOLLOW' && !following) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.not_following_user'),
      );
    }
    return [following, currentUser, userFollow];
  }

  async getUserProfile(
    currentUserId: number,
    usernameFollow: string,
  ): Promise<BaseResponse<Record<string, any>>> {
    const [following, , userFollow] = await this.checkUserFollowStatusOrThrow(
      currentUserId,
      usernameFollow,
    );

    return new BaseResponse(
      await t(this.i18nService, 'lang.get_user_success'),
      {
        ...new UserSerializer(userFollow, { type: 'PROFILE' }).serialize(),
        following,
      },
    );
  }

  async followUser(
    currentUserId: number,
    currentUsername: string,
    usernameFollow: string,
  ): Promise<BaseResponse<Record<string, any>>> {
    if (currentUsername === usernameFollow) {
      throw new BadRequestException(
        await t(this.i18nService, 'lang.cannot_follow_yourself'),
      );
    }

    const [following, currentUser, userFollow] =
      await this.checkUserFollowStatusOrThrow(
        currentUserId,
        usernameFollow,
        'FOLLOW',
      );

    if (following) {
      throw new BadRequestException(
        await t(this.i18nService, 'lang.already_following_user'),
      );
    }

    try {
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'following')
        .of(currentUser)
        .add(userFollow);
    } catch {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_follow_user'),
      );
    }

    return new BaseResponse(
      await t(this.i18nService, 'lang.follow_user_success'),
      {
        ...new UserSerializer(userFollow, { type: 'PROFILE' }).serialize(),
        following: true,
      },
    );
  }

  async unfollowUser(
    currentUserId: number,
    currentUsername: string,
    usernameFollow: string,
  ): Promise<BaseResponse<Record<string, any>>> {
    if (currentUsername === usernameFollow) {
      throw new BadRequestException(
        await t(this.i18nService, 'lang.cannot_unfollow_yourself'),
      );
    }

    const [following, currentUser, userFollow] =
      await this.checkUserFollowStatusOrThrow(
        currentUserId,
        usernameFollow,
        'UNFOLLOW',
      );

    if (!following) {
      throw new BadRequestException(
        await t(this.i18nService, 'lang.not_following_user'),
      );
    }

    try {
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'following')
        .of(currentUser)
        .remove(userFollow);
    } catch {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_unfollow_user'),
      );
    }

    return new BaseResponse(
      await t(this.i18nService, 'lang.unfollow_user_success'),
      {
        ...new UserSerializer(userFollow, { type: 'PROFILE' }).serialize(),
        following: false,
      },
    );
  }
}

export type PROFILE_FLOWS = 'PROFILE' | 'FOLLOW' | 'UNFOLLOW';
