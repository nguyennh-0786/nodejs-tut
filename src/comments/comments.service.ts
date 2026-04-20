import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';
import { Article } from 'src/articles/entity/articles.entity';
import { BaseResponse } from 'src/common/base.response';
import { t } from 'src/shared/utils';
import { UserSerializer } from 'src/users/serializers/user.serializer';
import { User } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './create-comment.dto';
import { Comment } from './comments.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18nService: I18nService,
    private readonly userService: UsersService,
  ) {}

  private serializeComment(
    comment: Comment,
    followingIds: Set<number>,
  ): Record<string, unknown> {
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: undefined,
      articleId: undefined,
      author: comment.author
        ? new UserSerializer(
            {
              ...comment.author,
              following: followingIds.has(comment.author.id),
            },
            { type: 'PROFILE' },
          ).serialize()
        : null,
    };
  }

  private async getFollowingUserIds(user: User): Promise<Set<number>> {
    const userWithFollowing = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['following'],
    });
    return new Set(userWithFollowing?.following.map((u) => u.id) ?? []);
  }

  async findComments(slug: string, currentUser?: User) {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    const comments = await this.commentRepository.find({
      where: { article: { id: article.id } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    const followingIds = currentUser
      ? await this.getFollowingUserIds(currentUser)
      : new Set<number>();

    const serializedComments = comments.map((comment) =>
      this.serializeComment(comment, followingIds),
    );

    return new BaseResponse(
      await t(this.i18nService, 'lang.get_comments_success'),
      serializedComments,
    );
  }

  async createComment(slug: string, body: CreateCommentDto, user: User) {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    const userEntity = await this.userService.findUserByIdOrThrow(user.id);

    try {
      const comment = this.commentRepository.create({
        body: body.body,
        article,
        author: userEntity,
      });
      await this.commentRepository.save(comment);

      const followingIds = await this.getFollowingUserIds(user);

      const serializedComment = this.serializeComment(comment, followingIds);

      return new BaseResponse(
        await t(this.i18nService, 'lang.add_comment_success'),
        serializedComment,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_add_comment'),
      );
    }
  }

  async deleteComment(slug: string, id: number, user: User) {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    const comment = await this.commentRepository.findOne({
      where: { id, article: { id: article.id } },
      relations: ['author'],
    });
    if (!comment) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.comment_not_found'),
      );
    }

    if (comment.author.id !== user.id) {
      throw new ForbiddenException(
        await t(this.i18nService, 'lang.failed_to_delete_comment'),
      );
    }

    try {
      await this.commentRepository.remove(comment);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_delete_comment'),
      );
    }

    return new BaseResponse(
      await t(this.i18nService, 'lang.delete_comment_success'),
      null,
    );
  }
}
