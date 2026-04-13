import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    example: 'title',
    description: 'The title of the article',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'description',
    description: 'The description of the article',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'body',
    description: 'The content of the article',
  })
  @IsString()
  body: string;

  @ApiProperty({
    example: ['tag1', 'tag2'],
    description: 'The list of tags for the article',
  })
  @IsOptional()
  @IsString({ each: true })
  tagList: string[];
}
