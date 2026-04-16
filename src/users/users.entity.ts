import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Article } from '../articles/articles.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  image: string;

  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'followUser',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followUserId',
      referencedColumnName: 'id',
    },
  })
  following: User[];

  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  token?: string;
}
