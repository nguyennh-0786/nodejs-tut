import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entity/articles.entity';
import { I18nService } from 'nestjs-i18n';
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

    const followingIds = currentUser
      ? await this.getFollowingUserIds(currentUser)
      : new Set<number>();

    const { favoritedArticleIds, favoritesCountMap } =
      await this.getFavoriteInfo(articles, currentUser);

    const serialized = articles.map((article) =>
      new ArticleSerializer(
        {
          ...article,
          favorited: favoritedArticleIds.has(article.id),
          favoritesCount: favoritesCountMap.get(article.id) || 0,
          following: article.author
            ? followingIds.has(article.author.id)
            : false,
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

    const followingIds = await this.getFollowingUserIds(user);
    const { favoritedArticleIds, favoritesCountMap } =
      await this.getFavoriteInfo(articles, user);

    const serialized = articles.map((article) =>
      new ArticleSerializer(
        {
          ...article,
          favorited: favoritedArticleIds.has(article.id),
          favoritesCount: favoritesCountMap.get(article.id) || 0,
          following: article.author
            ? followingIds.has(article.author.id)
            : false,
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

    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    const followingIds = currentUser
      ? await this.getFollowingUserIds(currentUser)
      : new Set<number>();

    const { favoritedArticleIds, favoritesCountMap } =
      await this.getFavoriteInfo([article], currentUser);

    const serializedArticle = new ArticleSerializer(
      {
        ...article,
        favorited: favoritedArticleIds.has(article.id),
        favoritesCount: favoritesCountMap.get(article.id) || 0,
        following: article.author ? followingIds.has(article.author.id) : false,
      },
      { type: 'DETAIL' },
    ).serialize();

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

    const followingIds = await this.getFollowingUserIds(currentUser);
    const { favoritedArticleIds, favoritesCountMap } =
      await this.getFavoriteInfo([article], currentUser);

    return new BaseResponse(
      await t(this.i18nService, 'article.update_article_success'),
      new ArticleSerializer(
        {
          ...article,
          favorited: favoritedArticleIds.has(article.id),
          favoritesCount: favoritesCountMap.get(article.id) || 0,
          following: article.author
            ? followingIds.has(article.author.id)
            : false,
        },
        { type: 'DETAIL' },
      ).serialize(),
    );
  }

  async delete(user: User, slug: string) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['tagList', 'author'],
    });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'article.article_not_found'),
      );
    }

    if (article.author.id !== user.id) {
      throw new ForbiddenException(
        await t(this.i18nService, 'lang.failed_to_delete_article'),
      );
    }

    if (article.author.id !== user.id) {
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

  private async getFavoriteInfo(
    articles: Article[],
    currentUser?: User,
  ): Promise<{
    favoritedArticleIds: Set<number>;
    favoritesCountMap: Map<number, number>;
  }> {
    const userFavorites = currentUser
      ? await this.favoriteRepository.find({
          where: { username: String(currentUser.username) },
        })
      : [];
    const favoritedArticleIds = new Set(
      userFavorites.map((fav) => Number(fav.article.id)),
    );

    const articleIds = articles.map((a) => a.id);
    const favoritesCountMap = new Map<number, number>();
    if (articleIds.length > 0) {
      const counts = await this.favoriteRepository
        .createQueryBuilder('favorite')
        .select('favorite.articleId', 'articleId')
        .addSelect('COUNT(*)', 'count')
        .where('favorite.articleId IN (:...articleIds)', {
          articleIds: articleIds.map(String),
        })
        .groupBy('favorite.articleId')
        .getRawMany();
      for (const row of counts as { articleId: string; count: string }[]) {
        favoritesCountMap.set(Number(row.articleId), Number(row.count));
      }
    }

    return { favoritedArticleIds, favoritesCountMap };
  }

  public async getFollowingUserIds(user: User): Promise<Set<number>> {
    let followingIds = new Set<number>();
    if (user) {
      const userWithFollowing = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['following'],
      });
      followingIds = new Set(
        userWithFollowing?.following.map((u) => u.id) ?? [],
      );
    }
    return followingIds;
  }

  async favorite(slug: string, user: User) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    const existingFavorite = await this.favoriteRepository.findOne({
      where: { article: { id: article.id }, author: { id: user.id } },
    });
    if (existingFavorite) {
      return new BaseResponse(
        await t(this.i18nService, 'lang.article_already_favorited'),
        null,
      );
    }

    try {
      const favorite = this.favoriteRepository.create({
        article,
        author: { id: user.id } as User,
        username: user.username,
      });
      await this.favoriteRepository.save(favorite);

      const followingIds = await this.getFollowingUserIds(user);
      const { favoritesCountMap } = await this.getFavoriteInfo([article]);

      return new BaseResponse(
        await t(this.i18nService, 'lang.article_favorited_success'),
        new ArticleSerializer(
          {
            ...article,
            favorited: true,
            favoritesCount: favoritesCountMap.get(article.id) || 0,
            following: article.author
              ? followingIds.has(article.author.id)
              : false,
          },
          { type: 'DETAIL' },
        ).serialize(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_favorite_article'),
      );
    }
  }

  async unfavorite(slug: string, user: User) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    const existingFavorite = await this.favoriteRepository.findOne({
      where: { article: { id: article.id }, author: { id: user.id } },
    });
    if (!existingFavorite) {
      return new BaseResponse(
        await t(this.i18nService, 'lang.article_not_favorited'),
        null,
      );
    }

    try {
      await this.favoriteRepository.remove(existingFavorite);

      const followingIds = await this.getFollowingUserIds(user);
      const { favoritesCountMap } = await this.getFavoriteInfo([article]);

      return new BaseResponse(
        await t(this.i18nService, 'lang.article_unfavorited_success'),
        new ArticleSerializer(
          {
            ...article,
            favorited: false,
            favoritesCount: favoritesCountMap.get(article.id) || 0,
            following: article.author
              ? followingIds.has(article.author.id)
              : false,
          },
          { type: 'DETAIL' },
        ).serialize(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        await t(this.i18nService, 'lang.failed_to_unfavorite_article'),
      );
    }
  }

  async findAllTags() {
    const tags = await this.tagRepository.find();
    return new BaseResponse(
      await t(this.i18nService, 'lang.get_tags_success'),
      tags.map((tag) => tag.name),
    );
  }
}
