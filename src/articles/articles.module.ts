import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorites.entity';
import { Tag } from './tags.entity';
import { Article } from './articles.entity';
import { Comment } from './comments.entity';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Tag, Favorite, Comment, User])],
  controllers: [ArticlesController],
  providers: [ArticlesService, UsersService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
