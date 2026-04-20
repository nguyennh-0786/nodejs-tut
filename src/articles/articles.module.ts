import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entity/favorites.entity';
import { Tag } from './entity/tags.entity';
import { Comment } from 'src/comments/comments.entity';
import { User } from 'src/users/users.entity';
import { UsersModule } from 'src/users/users.module';
import { Article } from './entity/articles.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Tag, Favorite, Comment, User]),
    UsersModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
