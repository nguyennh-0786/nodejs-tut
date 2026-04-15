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
import { CreateCommentDto } from './create-comment.dto';

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
        .andWhere('favorite.userId = :userId', { userId: arg0.favorited });
    }

    const articles = await articlesQuery
      .orderBy('article.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    const followingIds = currentUser
      ? await this.getFollowingUserIds(currentUser)
      : new Set<number>();

    const { favoritedArticleIds, favoritesCountMap } =
      await this.getFavoriteInfo(articles, currentUser);

    return articles.map((article) => ({
      ...article,
      favorited: favoritedArticleIds.has(article.id),
      favoritesCount: favoritesCountMap.get(article.id) || 0,
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
  }

  async findFeed(arg0: {
    user: User;
    limit: number | undefined;
    offset: number | undefined;
  }) {
    const { user, limit = 20, offset = 0 } = arg0;
    const articlesQuery = this.articleRepository.createQueryBuilder('article');
    articlesQuery
      .leftJoinAndSelect('article.author', 'author')
      .andWhere('author.username = :username', { username: user.username });

    const articles = await articlesQuery
      .orderBy('article.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    const followingIds = await this.getFollowingUserIds(user);

    const { favoritedArticleIds, favoritesCountMap } =
      await this.getFavoriteInfo(articles, user);

    return articles.map((article) => ({
      ...article,
      favorited: favoritedArticleIds.has(article.id),
      favoritesCount: favoritesCountMap.get(article.id) || 0,
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
  }

  async findOne(slug: string, currentUser?: User) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

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

    const serializedArticle = article
      ? {
          ...article,
          favorited: favoritedArticleIds.has(article.id),
          favoritesCount: favoritesCountMap.get(article.id) || 0,
          author: article.author
            ? new UserSerializer(
                {
                  ...article.author,
                  following: followingIds.has(article.author.id),
                },
                { type: 'PROFILE' },
              ).serialize()
            : null,
        }
      : null;

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
    Object.assign(article, updateArticleDto);
    const newSlug = article.title.toLowerCase().replace(/\s+/g, '-');
    if (newSlug !== slug) {
      article.slug = newSlug;
    }
    await this.articleRepository.save(article);

    const followingIds = await this.getFollowingUserIds(currentUser);
    const { favoritedArticleIds, favoritesCountMap } =
      await this.getFavoriteInfo([article], currentUser);

    return new BaseResponse(
      await t(this.i18nService, 'lang.update_article_success'),
      {
        ...article,
        favorited: favoritedArticleIds.has(article.id),
        favoritesCount: favoritesCountMap.get(article.id) || 0,
        author: article.author
          ? new UserSerializer(
              {
                ...article.author,
                following: followingIds.has(article.author.id),
              },
              { type: 'PROFILE' },
            ).serialize()
          : null,
      },
    );
  }

  async delete(user: User, slug: string) {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['tagList'],
    });
    if (!article) {
      throw new NotFoundException(
        await t(this.i18nService, 'lang.article_not_found'),
      );
    }

    if (article.author.id !== user.id) {
      throw new ForbiddenException(
        await t(this.i18nService, 'lang.failed_to_delete_article'),
      );
    }

    // Delete comments
    await this.commentRepository.delete({ article: { id: article.id } });

    // Delete favorites entity
    await this.favoriteRepository.delete({ articleId: String(article.id) });

    // Delete join table user_favorites
    await this.articleRepository.manager
      .createQueryBuilder()
      .delete()
      .from('user_favorites')
      .where('"articlesId" = :articlesId', { articlesId: article.id })
      .execute();

    // Delete article
    await this.articleRepository.remove(article);

    return new BaseResponse(
      await t(this.i18nService, 'lang.delete_article_success'),
      null,
    );
  }

  async findComments(slug: string, currentUser: User) {
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

    const followingIds = await this.getFollowingUserIds(currentUser);

    const serializedComments = comments.map((comment) => ({
      ...comment,
      author: comment.author
        ? new UserSerializer(
            {
              ...comment.author,
              following: followingIds.has(comment.author.id),
            },
            { type: 'PROFILE' },
          ).serialize()
        : null,
    }));

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

      const serializedComment = {
        ...comment,
        article: undefined,
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

    await this.commentRepository.remove(comment);

    return new BaseResponse(
      await t(this.i18nService, 'lang.delete_comment_success'),
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
          where: { userId: String(currentUser.id) },
        })
      : [];
    const favoritedArticleIds = new Set(
      userFavorites.map((fav) => Number(fav.articleId)),
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

  private async getFollowingUserIds(user: User): Promise<Set<number>> {
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
      where: { articleId: String(article.id), userId: String(user.id) },
    });
    if (existingFavorite) {
      return new BaseResponse(
        await t(this.i18nService, 'lang.article_already_favorited'),
        null,
      );
    }

    try {
      const followingIds = await this.getFollowingUserIds(user);

      const favorite = this.favoriteRepository.create({
        articleId: String(article.id),
        userId: String(user.id),
      });
      await this.favoriteRepository.save(favorite);

      return new BaseResponse(
        await t(this.i18nService, 'lang.article_favorited_success'),
        {
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
        },
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
      where: { articleId: String(article.id), userId: String(user.id) },
    });
    if (!existingFavorite) {
      return new BaseResponse(
        await t(this.i18nService, 'lang.article_not_favorited'),
        null,
      );
    }

    try {
      const followingIds = await this.getFollowingUserIds(user);
      await this.favoriteRepository.remove(existingFavorite);

      return new BaseResponse(
        await t(this.i18nService, 'lang.article_unfavorited_success'),
        {
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
        },
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
