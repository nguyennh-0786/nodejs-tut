import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from 'src/users/current-user.decorator';
import { User } from 'src/users/users.entity';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './create-comment.dto';

@Controller('api/')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('articles/:slug/comments')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get comments for an article' })
  findComments(
    @CurrentUser() currentUser: User | null,
    @Param('slug') slug: string,
  ) {
    return this.commentsService.findComments(slug, currentUser ?? undefined);
  }

  @Post('articles/:slug/comments')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a comment for an article' })
  createComment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.commentsService.createComment(slug, body, user);
  }

  @Delete('articles/:slug/comments/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  deleteComment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentsService.deleteComment(slug, id, user);
  }
}
