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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from 'src/users/current-user.decorator';
import { User } from 'src/users/users.entity';
import { CreateArticleDto } from './create-article.dto';
import { UpdateArticleDto } from './update-article.dto';
import { CreateCommentDto } from './create-comment.dto';

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
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({
    name: 'author',
    required: false,
    description: 'Filter by author username',
  })
  @ApiQuery({
    name: 'favorited',
    required: false,
    description: 'Filter by favorited username',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset' })
  findAll(
    @CurrentUser() currentUser: User | null,
    @Query('tag') tag?: string,
    @Query('author') author?: string,
    @Query('favorited') favorited?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.articlesService.findAll({
      tag,
      author,
      favorited,
      limit,
      offset,
      currentUser: currentUser ?? undefined,
    });
  }

  @Get('articles/feed')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get feed articles',
    description:
      'Returns articles from users you follow, provide tag, author or favorited query parameter to filter results',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset' })
  findFeed(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.articlesService.findFeed({
      user,
      limit,
      offset,
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
    return this.articlesService.delete(user, slug);
  }

  @Get('articles/:slug/comments')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get comments for an article',
    description: 'Returns comments for a specific article',
  })
  findComments(@CurrentUser() currentUser: User, @Param('slug') slug: string) {
    return this.articlesService.findComments(slug, currentUser);
  }

  @Post('articles/:slug/comments')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a comment for an article',
    description: 'Creates a new comment for a specific article',
  })
  createComment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.articlesService.createComment(slug, body, user);
  }

  @Delete('articles/:slug/comments/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Delete a comment',
    description: 'Deletes a specific comment from an article',
  })
  deleteComment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('id') id: number,
  ) {
    return this.articlesService.deleteComment(slug, id, user);
  }

  @Post('articles/:slug/favorite')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Favorite an article',
    description: 'Marks an article as favorite for the current user',
  })
  favorite(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.articlesService.favorite(slug, user);
  }

  @Delete('articles/:slug/favorite')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Unfavorite an article',
    description: "Removes an article from the current user's favorites",
  })
  unfavorite(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.articlesService.unfavorite(slug, user);
  }

  @Get('tags')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get all tags',
    description: 'Returns all available tags',
  })
  findAllTags() {
    return this.articlesService.findAllTags();
  }
}
