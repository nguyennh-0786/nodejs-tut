import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Tag } from './tags.entity';
import { Favorite } from './favorites.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  body: string;

  @ManyToMany(() => Tag, (tag) => tag.articles, { eager: true })
  @JoinTable()
  tagList: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  favoritesCount: number;

  @ManyToOne(() => User, { eager: true })
  author: User;

  @OneToMany(() => Favorite, (fav) => fav.article)
  favorites: Favorite[];
}
