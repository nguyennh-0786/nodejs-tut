import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from 'src/users/current-user.decorator';
import { User } from 'src/users/users.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { QueryFeedDto } from './dto/query-feed.dto';

@ApiTags('Articles')
@Controller('api/')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('articles')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get all articles',
    description:
      'Returns most recent articles globally by default, provide tag, author or favorited query parameter to filter results',
  })
  findAll(
    @CurrentUser() currentUser: User | null,
    @Query() query: QueryArticlesDto,
  ) {
    return this.articlesService.findAll({
      tag: query.tag,
      author: query.author,
      favorited: query.favorited,
      limit: query.limit,
      offset: query.offset,
      currentUser: currentUser ?? undefined,
    });
  }

  @Get('articles/feed')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get feed articles',
    description:
      'Returns articles from users you follow, ordered by most recent first.',
  })
  findFeed(@CurrentUser() user: User, @Query() query: QueryFeedDto) {
    return this.articlesService.findFeed({
      user,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get('articles/:slug')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get an article' })
  findOne(
    @CurrentUser() currentUser: User | null,
    @Param('slug') slug: string,
  ) {
    return this.articlesService.findOne(slug, currentUser ?? undefined);
  }

  @Post('articles')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create an article',
    description: 'Creates a new article with the provided data',
  })
  create(
    @CurrentUser() user: User,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.create(user, createArticleDto);
  }

  @Put('articles/:slug')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update an article',
    description: 'Updates an existing article with the provided data',
  })
  update(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(slug, updateArticleDto, user);
  }

  @Delete('articles/:slug')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Delete an article',
    description: 'Deletes an existing article',
  })
  delete(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.articlesService.delete(slug, user);
  }
}
