import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entity/articles.entity';
import { I18nService } from 'nestjs-i18n';
import { Comment } from './entity/comments.entity';
import { Tag } from './entity/tags.entity';
import { Favorite } from './entity/favorites.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/users.entity';
import { BaseResponse } from 'src/common/base.response';
import { t } from 'src/shared/utils';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { UsersService } from 'src/users/users.service';
import { ArticleSerializer } from './serializers/article.serializer';

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
    private readonly dataSource: DataSource,
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

    const [articles, total] = await articlesQuery
      .orderBy('article.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

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

    const serialized = articles.map((article) =>
      new ArticleSerializer(
        {
          ...article,
          following: article.author
            ? followingIds.has(article.author.id)
            : false,
          favorited: false,
        },
        { type: 'DETAIL' },
      ).serialize(),
    );

    return new BaseResponse(
      await t(this.i18nService, 'article.get_articles_success'),
      {
        articles: serialized,
        pagy: {
          total,
          page: Math.floor(offset / limit) + 1,
          items: limit,
        },
      },
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
        await t(this.i18nService, 'article.get_articles_success'),
        { articles: [], articlesCount: 0 },
      );
    }

    const followingIds = new Set(followingIdList);

    const [articles, total] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .where('author.id IN (:...followingIds)', {
        followingIds: followingIdList,
      })
      .orderBy('article.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    const serialized = articles.map((article) =>
      new ArticleSerializer(
        {
          ...article,
          following: article.author
            ? followingIds.has(article.author.id)
            : false,
          favorited: false,
        },
        { type: 'DETAIL' },
      ).serialize(),
    );

    return new BaseResponse(
      await t(this.i18nService, 'article.get_articles_success'),
      {
        articles: serialized,
        pagy: {
          total,
          page: Math.floor(offset / limit) + 1,
          items: limit,
        },
      },
    );
  }

  async findOne(slug: string, currentUser?: User) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

    if (article === null) {
      throw new NotFoundException(
        await t(this.i18nService, 'article.article_not_found'),
      );
    }

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
      ? new ArticleSerializer(
          { ...article, following, favorited: false },
          { type: 'DETAIL' },
        ).serialize()
      : null;

    return new BaseResponse(
      await t(this.i18nService, 'article.get_article_success'),
      serializedArticle,
    );
  }

  async create(user: User, createArticleDto: CreateArticleDto) {
    const { tagList: tagNames, ...rest } = createArticleDto;

    const userEntity = await this.userService.findUserByIdOrThrow(user.id);
    const slug = rest.title.toLowerCase().replace(/\s+/g, '-');

    try {
      const article = await this.dataSource.transaction<Article>(
        async (manager) => {
          const existingTags = tagNames?.length
            ? await manager.findBy(
                Tag,
                tagNames.map((name) => ({ name })),
              )
            : [];

          const existingNames = new Set(existingTags.map((t) => t.name));
          const newNames = (tagNames ?? []).filter(
            (n) => !existingNames.has(n),
          );

          let newTags: Tag[] = [];
          if (newNames.length > 0) {
            const inserted = await manager
              .createQueryBuilder()
              .insert()
              .into(Tag)
              .values(newNames.map((name) => ({ name })))
              .orIgnore()
              .returning('*')
              .execute();
            newTags = inserted.generatedMaps as Tag[];
          }

          const tags = [...existingTags, ...newTags];

          const article = manager.create(Article, {
            ...rest,
            slug,
            tagList: tags,
            author: userEntity,
          });
          return manager.save(article);
        },
      );

      return new BaseResponse(
        await t(this.i18nService, 'article.create_article_success'),
        new ArticleSerializer(
          { ...article, following: false, favorited: false },
          { type: 'DETAIL' },
        ).serialize(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'article.failed_to_create_article'),
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
        await t(this.i18nService, 'article.article_not_found'),
      );
    }

    if (article.author.id !== currentUser.id) {
      throw new ForbiddenException(
        await t(this.i18nService, 'article.failed_to_update_article'),
      );
    }

    Object.assign(article, updateArticleDto);
    const newSlug = article.title.toLowerCase().replace(/\s+/g, '-');
    if (newSlug !== slug) {
      article.slug = newSlug;
    }
    try {
      await this.articleRepository.save(article);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'article.failed_to_update_article'),
      );
    }

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
      await t(this.i18nService, 'article.update_article_success'),
      new ArticleSerializer(
        { ...article, following, favorited: false },
        { type: 'DETAIL' },
      ).serialize(),
    );
  }

  async delete(slug: string, currentUser: User) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['tagList', 'author'],
    });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'article.article_not_found'),
      );
    }

    if (article.author.id !== currentUser.id) {
      throw new ForbiddenException(
        await t(this.i18nService, 'article.failed_to_delete_article'),
      );
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.delete(Comment, { article: { id: article.id } });
        await manager.delete(Favorite, { article: { id: article.id } });
        await manager.remove(article);
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'article.failed_to_delete_article'),
      );
    }

    return new BaseResponse(
      await t(this.i18nService, 'article.delete_article_success'),
      null,
    );
  }
}
