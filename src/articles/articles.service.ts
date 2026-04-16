import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './articles.entity';
import { I18nService } from 'nestjs-i18n';
import { Comment } from './comments.entity';
import { Tag } from './tags.entity';
import { Favorite } from './favorites.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/users.entity';
import { BaseResponse } from 'src/common/base.response';
import { t } from 'src/shared/utils';
import { CreateArticleDto } from './create-article.dto';
import { UpdateArticleDto } from './update-article.dto';
import { UsersService } from 'src/users/users.service';
import { UserSerializer } from 'src/users/serializers/user.serializer';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    private readonly i18nService: I18nService,
    private readonly userService: UsersService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(arg0: {
    tag: string | undefined;
    author: string | undefined;
    favorited: string | undefined;
    limit: number | undefined;
    offset: number | undefined;
    currentUser?: User;
  }) {
    const { limit = 20, offset = 0, currentUser } = arg0;
    const articlesQuery = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author');

    if (arg0.tag) {
      articlesQuery
        .leftJoinAndSelect('article.tagList', 'tag')
        .where('tag.name = :tagName', { tagName: arg0.tag });
    }

    if (arg0.author) {
      articlesQuery.andWhere('author.username = :authorName', {
        authorName: arg0.author,
      });
    }

    if (arg0.favorited) {
      articlesQuery
        .leftJoinAndSelect('article.favorites', 'favorite')
        .andWhere('favorite.username = :username', {
          username: arg0.favorited,
        });
    }

    const articles = await articlesQuery
      .orderBy('article.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    let followingIds = new Set<number>();
    if (currentUser) {
      const userWithFollowing = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['following'],
      });
      followingIds = new Set(
        userWithFollowing?.following.map((u) => u.id) ?? [],
      );
    }

    const serialized = articles.map((article) => ({
      ...article,
      author: article.author
        ? new UserSerializer(
            {
              ...article.author,
              following: followingIds.has(article.author.id),
            },
            { type: 'PROFILE' },
          ).serialize()
        : null,
    }));

    return new BaseResponse(
      await t(this.i18nService, 'lang.get_articles_success'),
      { articles: serialized, articlesCount: serialized.length },
    );
  }

  async findFeed(arg0: {
    user: User;
    limit: number | undefined;
    offset: number | undefined;
  }) {
    const { user, limit = 20, offset = 0 } = arg0;

    const userWithFollowing = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['following'],
    });
    const followingIdList = userWithFollowing?.following.map((u) => u.id) ?? [];

    if (followingIdList.length === 0) {
      return new BaseResponse(
        await t(this.i18nService, 'lang.get_articles_success'),
        { articles: [], articlesCount: 0 },
      );
    }

    const followingIds = new Set(followingIdList);

    const articles = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .where('author.id IN (:...followingIds)', {
        followingIds: followingIdList,
      })
      .orderBy('article.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    const serialized = articles.map((article) => ({
      ...article,
      author: article.author
        ? new UserSerializer(
            {
              ...article.author,
              following: followingIds.has(article.author.id),
            },
            { type: 'PROFILE' },
          ).serialize()
        : null,
    }));

    return new BaseResponse(
      await t(this.i18nService, 'lang.get_articles_success'),
      { articles: serialized, articlesCount: serialized.length },
    );
  }

  async findOne(slug: string, currentUser?: User) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

    let following = false;
    if (currentUser && article?.author) {
      const userWithFollowing = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['following'],
      });
      following =
        userWithFollowing?.following.some((u) => u.id === article.author.id) ??
        false;
    }

    const serializedArticle = article
      ? {
          ...article,
          author: article.author
            ? new UserSerializer(
                { ...article.author, following },
                { type: 'PROFILE' },
              ).serialize()
            : null,
        }
      : null;

    if (serializedArticle === null) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    return new BaseResponse(
      await t(this.i18nService, 'lang.get_article_success'),
      serializedArticle,
    );
  }

  async create(user: User, createArticleDto: CreateArticleDto) {
    const { tagList: tagNames, ...rest } = createArticleDto;
    try {
      const tags = await Promise.all(
        (tagNames ?? []).map(async (name) => {
          let tag = await this.tagRepository.findOne({ where: { name } });
          if (!tag) {
            tag = this.tagRepository.create({ name });
            await this.tagRepository.save(tag);
          }
          return tag;
        }),
      );

      const userEntity = await this.userService.findUserByIdOrThrow(user.id);
      const slug = rest.title.toLowerCase().replace(/\s+/g, '-');

      const article = this.articleRepository.create({
        ...rest,
        slug,
        tagList: tags,
        author: userEntity,
      });
      await this.articleRepository.save(article);

      const serializedAuthor = new UserSerializer(
        { ...userEntity, following: false },
        { type: 'PROFILE' },
      ).serialize();

      return new BaseResponse(
        await t(this.i18nService, 'lang.create_article_success'),
        { ...article, author: serializedAuthor },
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_create_article'),
      );
    }
  }

  async update(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    currentUser: User,
  ) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    if (article.author.id !== currentUser.id) {
      throw new ForbiddenException(
        await t(this.i18nService, 'lang.failed_to_update_article'),
      );
    }

    Object.assign(article, updateArticleDto);
    const newSlug = article.title.toLowerCase().replace(/\s+/g, '-');
    if (newSlug !== slug) {
      article.slug = newSlug;
    }
    await this.articleRepository.save(article);

    let following = false;
    if (article.author) {
      const userWithFollowing = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['following'],
      });
      following =
        userWithFollowing?.following.some((u) => u.id === article.author.id) ??
        false;
    }

    return new BaseResponse(
      await t(this.i18nService, 'lang.update_article_success'),
      {
        ...article,
        author: article.author
          ? new UserSerializer(
              { ...article.author, following },
              { type: 'PROFILE' },
            ).serialize()
          : null,
      },
    );
  }

  async delete(slug: string, currentUser: User) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['tagList', 'author'],
    });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    if (article.author.id !== currentUser.id) {
      throw new ForbiddenException(
        await t(this.i18nService, 'lang.failed_to_delete_article'),
      );
    }

    // Delete comments
    await this.commentRepository.delete({ article: { id: article.id } });

    // Delete favorites entity
    await this.favoriteRepository.delete({ article: { id: article.id } });

    // Delete article
    await this.articleRepository.remove(article);

    return new BaseResponse(
      await t(this.i18nService, 'lang.delete_article_success'),
      null,
    );
  }
}
