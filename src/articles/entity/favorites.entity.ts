import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { Article } from './articles.entity';

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Article, (article) => article.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Article;
}
