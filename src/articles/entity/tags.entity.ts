import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Article } from './articles.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Article, (article) => article.tagList)
  articles: Article[];
}
